import { Prisma } from "@prisma/client";

/**
 * Persentase dana terkumpul terhadap kebutuhan pendanaan, bilangan bulat 0–100.
 * Dibulatkan ke bawah agar 100% hanya tampil saat pendanaan benar-benar terpenuhi;
 * pendanaan yang melebihi kebutuhan tetap 100.
 */
export function fundingProgressPct(
  collected: Prisma.Decimal,
  required: Prisma.Decimal,
): number {
  if (required.lte(0)) return 0;

  const pct = collected.div(required).times(100).floor().toNumber();
  return Math.min(100, Math.max(0, pct));
}
