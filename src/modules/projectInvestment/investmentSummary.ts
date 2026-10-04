import { Prisma } from "@prisma/client";

/**
 * Investasi "aktif" = investasi pada project yang masih berjalan.
 * closed dan cancelled berarti project sudah berakhir; target_achieved diset
 * saat settlement disetujui (project selesai).
 */
export const ACTIVE_PROJECT_STATUSES = ["open"] as const;

/** Total investasi satu investor pada satu project (hasil groupBy project_id). */
export interface ProjectInvestmentTotal {
  project_id: string;
  amount: Prisma.Decimal | null;
}

export interface InvestmentSummary {
  total_active_investment: Prisma.Decimal;
  active_projects: number;
}

/**
 * Ringkasan dari total per project. Satu project dihitung satu kali walaupun
 * investor menyetor beberapa kali ke project tersebut.
 */
export function summarizeActiveInvestments(
  totals: ProjectInvestmentTotal[],
): InvestmentSummary {
  return {
    total_active_investment: totals.reduce(
      (sum, row) => sum.plus(row.amount ?? 0),
      new Prisma.Decimal(0),
    ),
    active_projects: totals.length,
  };
}
