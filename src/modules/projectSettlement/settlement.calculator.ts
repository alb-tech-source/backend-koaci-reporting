import { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/apiError.js";

/**
 * Kalkulator settlement — satu-satunya sumber rumus untuk ProjectSettlement
 * dan InvestorSettlement. Fungsi murni (tanpa akses DB) agar bisa dipakai
 * oleh endpoint preview, create, dan update, serta mudah diuji.
 *
 * Konvensi:
 * - Semua *_pct dalam satuan persen 0-100 (mis. 40 = 40%).
 * - Nominal dibulatkan ke 2 desimal (ROUND_HALF_UP).
 * - Selisih pembulatan antara dua bagian yang saling melengkapi diserap sisi Koaci:
 *   koaci_share_amount = net_profit_margin - applicant_share_amount
 *   koaci_portion_amount = koaci_share_amount - investor_portion_amount
 * - profit_share_amount antar investor dibagi dengan metode largest remainder,
 *   sehingga totalnya tepat sama dengan porsi investor (tidak ada selisih sen).
 * - Nilai negatif (kondisi rugi) diperbolehkan dan dihitung apa adanya.
 */

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;

const HUNDRED = new Decimal(100);

const money = (value: Decimal) =>
  value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export interface SettlementInvestorInput {
  investor_id: string;
  principal_amount: Decimal;
  compensation_pct: Decimal;
}

export interface SettlementCalcInput {
  total_capital: Decimal;
  sales_amount: Decimal;
  other_cost: Decimal;
  applicant_share_pct: Decimal;
  koaci_share_pct: Decimal;
  koaci_portion_pct: Decimal;
  investor_portion_pct: Decimal;
  investors: SettlementInvestorInput[];
}

export interface SettlementInvestorResult {
  investor_id: string;
  principal_amount: Decimal;
  modal_portion_pct: Decimal;
  profit_share_amount: Decimal;
  compensation_pct: Decimal;
  compensation_amount: Decimal;
  total_profit: Decimal;
}

export type SettlementWarningCode =
  | "NO_INVESTORS"
  | "CAPITAL_MISMATCH"
  | "NET_LOSS"
  | "NEGATIVE_KOACI_FINAL_PROFIT";

export interface SettlementWarning {
  code: SettlementWarningCode;
  message: string;
}

export interface SettlementCalcResult {
  project: {
    gross_margin: Decimal;
    net_profit_margin: Decimal;
    applicant_share_amount: Decimal;
    koaci_share_amount: Decimal;
    investor_portion_amount: Decimal;
    koaci_portion_amount: Decimal;
    compensation_total: Decimal;
    koaci_final_profit: Decimal;
  };
  investors: SettlementInvestorResult[];
  warnings: SettlementWarning[];
}

/**
 * Validasi aturan bisnis persentase. Dipanggil juga setelah merge input
 * PATCH, karena body parsial tidak bisa divalidasi sendiri oleh Zod.
 */
export function assertValidPercentages(
  input: Pick<
    SettlementCalcInput,
    | "applicant_share_pct"
    | "koaci_share_pct"
    | "koaci_portion_pct"
    | "investor_portion_pct"
  >,
): void {
  if (!input.applicant_share_pct.plus(input.koaci_share_pct).eq(HUNDRED)) {
    throw new ApiError(
      400,
      "applicant_share_pct + koaci_share_pct harus berjumlah 100",
    );
  }
  if (!input.koaci_portion_pct.plus(input.investor_portion_pct).eq(HUNDRED)) {
    throw new ApiError(
      400,
      "koaci_portion_pct + investor_portion_pct harus berjumlah 100",
    );
  }
}

/**
 * Membagi `total` (2 desimal) secara proporsional terhadap `weights`
 * dengan metode largest remainder. Jumlah hasil selalu tepat sama dengan `total`.
 */
export function allocateProportionally(
  total: Decimal,
  weights: Decimal[],
): Decimal[] {
  const weightSum = weights.reduce((sum, w) => sum.plus(w), new Decimal(0));
  if (weights.length === 0 || weightSum.isZero()) {
    return weights.map(() => new Decimal(0));
  }

  const sign = total.isNegative() ? -1 : 1;
  const totalCents = money(total).abs().times(100);

  const shares = weights.map((weight, index) => {
    const raw = totalCents.times(weight).dividedBy(weightSum);
    const floor = raw.floor();
    return { index, weight, floor, remainder: raw.minus(floor) };
  });

  let leftover = totalCents.minus(
    shares.reduce((sum, s) => sum.plus(s.floor), new Decimal(0)),
  );

  // Sisa sen diberikan ke remainder terbesar; seri dipecah oleh bobot terbesar
  // lalu urutan input, agar hasil deterministik.
  const order = [...shares].sort(
    (a, b) =>
      b.remainder.comparedTo(a.remainder) ||
      b.weight.comparedTo(a.weight) ||
      a.index - b.index,
  );
  for (const share of order) {
    if (leftover.lte(0)) break;
    share.floor = share.floor.plus(1);
    leftover = leftover.minus(1);
  }

  return shares.map((s) => s.floor.dividedBy(100).times(sign));
}

export function calculateSettlement(
  input: SettlementCalcInput,
): SettlementCalcResult {
  if (input.total_capital.lte(0)) {
    throw new ApiError(400, "total_capital harus lebih besar dari 0");
  }
  assertValidPercentages(input);

  const warnings: SettlementWarning[] = [];

  const gross_margin = money(input.sales_amount.minus(input.total_capital));
  const net_profit_margin = money(gross_margin.minus(input.other_cost));

  const applicant_share_amount = money(
    net_profit_margin.times(input.applicant_share_pct).dividedBy(HUNDRED),
  );
  const koaci_share_amount = net_profit_margin.minus(applicant_share_amount);

  const investor_portion_amount = money(
    koaci_share_amount.times(input.investor_portion_pct).dividedBy(HUNDRED),
  );
  const koaci_portion_amount = koaci_share_amount.minus(
    investor_portion_amount,
  );

  // Porsi yang menjadi hak investor terdaftar = porsi investor x (total principal / total_capital).
  // Jika total principal = total_capital, nilainya tepat investor_portion_amount.
  const principalTotal = input.investors.reduce(
    (sum, inv) => sum.plus(inv.principal_amount),
    new Decimal(0),
  );
  const distributable = money(
    investor_portion_amount.times(principalTotal).dividedBy(input.total_capital),
  );
  const profitShares = allocateProportionally(
    distributable,
    input.investors.map((inv) => inv.principal_amount),
  );

  const investors = input.investors.map((inv, index) => {
    const profit_share_amount = profitShares[index]!;
    const compensation_amount = money(
      inv.principal_amount.times(inv.compensation_pct).dividedBy(HUNDRED),
    );
    return {
      investor_id: inv.investor_id,
      principal_amount: money(inv.principal_amount),
      modal_portion_pct: inv.principal_amount
        .dividedBy(input.total_capital)
        .times(HUNDRED)
        .toDecimalPlaces(6, Decimal.ROUND_HALF_UP),
      profit_share_amount,
      compensation_pct: inv.compensation_pct,
      compensation_amount,
      total_profit: profit_share_amount.plus(compensation_amount),
    };
  });

  const compensation_total = investors.reduce(
    (sum, inv) => sum.plus(inv.compensation_amount),
    new Decimal(0),
  );
  const koaci_final_profit = koaci_portion_amount.minus(compensation_total);

  if (input.investors.length === 0) {
    warnings.push({
      code: "NO_INVESTORS",
      message: "Project ini belum memiliki data investasi (ProjectInvestment)",
    });
  } else if (!principalTotal.eq(input.total_capital)) {
    warnings.push({
      code: "CAPITAL_MISMATCH",
      message: `total_capital (${money(input.total_capital).toFixed(2)}) berbeda dengan total investasi investor (${money(principalTotal).toFixed(2)})`,
    });
  }
  if (net_profit_margin.isNegative()) {
    warnings.push({
      code: "NET_LOSS",
      message: `Project mengalami kerugian bersih sebesar ${net_profit_margin.abs().toFixed(2)}`,
    });
  }
  if (koaci_final_profit.isNegative()) {
    warnings.push({
      code: "NEGATIVE_KOACI_FINAL_PROFIT",
      message: "koaci_final_profit bernilai negatif setelah dikurangi kompensasi investor",
    });
  }

  return {
    project: {
      gross_margin,
      net_profit_margin,
      applicant_share_amount,
      koaci_share_amount,
      investor_portion_amount,
      koaci_portion_amount,
      compensation_total,
      koaci_final_profit,
    },
    investors,
    warnings,
  };
}
