import { test } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { fundingProgressPct } from "./fundingProgress.js";

const D = (value: string | number) => new Prisma.Decimal(value);

test("menghitung persentase dana terkumpul", () => {
  assert.equal(fundingProgressPct(D(45_500_000), D(100_000_000)), 45);
  assert.equal(fundingProgressPct(D(100_000_000), D(100_000_000)), 100);
  assert.equal(fundingProgressPct(D(0), D(100_000_000)), 0);
});

test("membulatkan ke bawah sehingga 100% hanya untuk pendanaan penuh", () => {
  assert.equal(fundingProgressPct(D("99999999.99"), D(100_000_000)), 99);
  assert.equal(fundingProgressPct(D(1), D(100_000_000)), 0);
});

test("membatasi pendanaan berlebih di 100%", () => {
  assert.equal(fundingProgressPct(D(250_000_000), D(100_000_000)), 100);
});

test("mengembalikan 0 jika kebutuhan pendanaan nol atau negatif", () => {
  assert.equal(fundingProgressPct(D(50_000_000), D(0)), 0);
  assert.equal(fundingProgressPct(D(50_000_000), D(-1)), 0);
});

test("tidak terpengaruh error floating point", () => {
  // 0.57 * 100 dalam float = 56.99999999999999
  assert.equal(fundingProgressPct(D("0.57"), D(1)), 57);
});
