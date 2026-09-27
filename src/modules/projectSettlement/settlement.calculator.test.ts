import { test } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import {
  allocateProportionally,
  calculateSettlement,
  type SettlementCalcInput,
} from "./settlement.calculator.js";

const D = (value: string | number) => new Prisma.Decimal(value);
const str = (value: Prisma.Decimal) => value.toFixed(2);

const baseInput = (
  overrides: Partial<SettlementCalcInput> = {},
): SettlementCalcInput => ({
  total_capital: D(500_000_000),
  sales_amount: D(650_000_000),
  other_cost: D(10_000_000),
  applicant_share_pct: D(60),
  koaci_share_pct: D(40),
  koaci_portion_pct: D(30),
  investor_portion_pct: D(70),
  investors: [
    { investor_id: "a", principal_amount: D(300_000_000), compensation_pct: D(2) },
    { investor_id: "b", principal_amount: D(200_000_000), compensation_pct: D(0) },
  ],
  ...overrides,
});

test("menghitung seluruh field sesuai rumus", () => {
  const { project, investors, warnings } = calculateSettlement(baseInput());

  assert.equal(str(project.gross_margin), "150000000.00");
  assert.equal(str(project.net_profit_margin), "140000000.00");
  assert.equal(str(project.applicant_share_amount), "84000000.00");
  assert.equal(str(project.koaci_share_amount), "56000000.00");
  assert.equal(str(project.investor_portion_amount), "39200000.00");
  assert.equal(str(project.koaci_portion_amount), "16800000.00");

  const [a, b] = investors;
  assert.equal(a!.modal_portion_pct.toString(), "60");
  assert.equal(str(a!.profit_share_amount), "23520000.00");
  assert.equal(str(a!.compensation_amount), "6000000.00");
  assert.equal(str(a!.total_profit), "29520000.00");
  assert.equal(b!.modal_portion_pct.toString(), "40");
  assert.equal(str(b!.profit_share_amount), "15680000.00");

  assert.equal(str(project.compensation_total), "6000000.00");
  assert.equal(str(project.koaci_final_profit), "10800000.00");
  assert.deepEqual(warnings, []);
});

test("bagian yang saling melengkapi selalu berjumlah tepat walau ada pembulatan", () => {
  const { project, investors } = calculateSettlement(
    baseInput({
      total_capital: D(300),
      sales_amount: D("400.01"),
      other_cost: D(0),
      applicant_share_pct: D("33.3333"),
      koaci_share_pct: D("66.6667"),
      investors: ["a", "b", "c"].map((id) => ({
        investor_id: id,
        principal_amount: D(100),
        compensation_pct: D(0),
      })),
    }),
  );

  assert.ok(
    project.applicant_share_amount
      .plus(project.koaci_share_amount)
      .eq(project.net_profit_margin),
  );
  assert.ok(
    project.investor_portion_amount
      .plus(project.koaci_portion_amount)
      .eq(project.koaci_share_amount),
  );
  const shareSum = investors.reduce(
    (sum, inv) => sum.plus(inv.profit_share_amount),
    D(0),
  );
  assert.ok(shareSum.eq(project.investor_portion_amount));
});

test("largest remainder membagi sisa sen secara deterministik", () => {
  const result = allocateProportionally(D("0.10"), [D(1), D(1), D(1)]);
  assert.deepEqual(result.map(str), ["0.04", "0.03", "0.03"]);

  const negative = allocateProportionally(D("-0.10"), [D(1), D(1), D(1)]);
  assert.deepEqual(negative.map(str), ["-0.04", "-0.03", "-0.03"]);
});

test("kondisi rugi dihitung negatif dan memberi warning", () => {
  const { project, investors, warnings } = calculateSettlement(
    baseInput({ sales_amount: D(450_000_000) }),
  );

  assert.equal(str(project.net_profit_margin), "-60000000.00");
  assert.ok(project.investor_portion_amount.isNegative());
  assert.ok(investors.every((inv) => inv.profit_share_amount.isNegative()));
  assert.ok(warnings.some((w) => w.code === "NET_LOSS"));
  assert.ok(warnings.some((w) => w.code === "NEGATIVE_KOACI_FINAL_PROFIT"));
});

test("selisih total_capital dan total principal memberi warning", () => {
  const { investors, project, warnings } = calculateSettlement(
    baseInput({ total_capital: D(600_000_000) }),
  );

  assert.ok(warnings.some((w) => w.code === "CAPITAL_MISMATCH"));
  // Investor hanya mendapat porsi sebesar modal yang benar-benar mereka setor.
  const shareSum = investors.reduce(
    (sum, inv) => sum.plus(inv.profit_share_amount),
    D(0),
  );
  assert.ok(shareSum.lt(project.investor_portion_amount));
  assert.equal(investors[0]!.modal_portion_pct.toString(), "50");
});

test("project tanpa investor memberi warning NO_INVESTORS", () => {
  const { investors, warnings } = calculateSettlement(baseInput({ investors: [] }));
  assert.equal(investors.length, 0);
  assert.ok(warnings.some((w) => w.code === "NO_INVESTORS"));
});

test("menolak persentase yang tidak berjumlah 100", () => {
  assert.throws(
    () => calculateSettlement(baseInput({ koaci_share_pct: D(30) })),
    /applicant_share_pct \+ koaci_share_pct/,
  );
  assert.throws(
    () => calculateSettlement(baseInput({ investor_portion_pct: D(60) })),
    /koaci_portion_pct \+ investor_portion_pct/,
  );
});
