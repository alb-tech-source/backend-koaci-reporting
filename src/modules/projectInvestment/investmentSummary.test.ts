import { test } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { summarizeActiveInvestments } from "./investmentSummary.js";

const D = (value: string | number) => new Prisma.Decimal(value);

test("menjumlahkan total per project dan menghitung jumlah project", () => {
  const summary = summarizeActiveInvestments([
    { project_id: "p-1", amount: D(100_000_000) },
    { project_id: "p-2", amount: D(50_000_000) },
  ]);

  assert.equal(summary.total_active_investment.toString(), "150000000");
  assert.equal(summary.active_projects, 2);
});

test("mengembalikan nol jika tidak ada investasi aktif", () => {
  const summary = summarizeActiveInvestments([]);

  assert.equal(summary.total_active_investment.toString(), "0");
  assert.equal(summary.active_projects, 0);
});

test("menjumlahkan desimal tanpa error floating point", () => {
  const summary = summarizeActiveInvestments([
    { project_id: "p-1", amount: D("0.1") },
    { project_id: "p-2", amount: D("0.2") },
  ]);

  assert.equal(summary.total_active_investment.toString(), "0.3");
});

test("menganggap total kosong sebagai nol tetapi tetap menghitung project-nya", () => {
  const summary = summarizeActiveInvestments([
    { project_id: "p-1", amount: null },
    { project_id: "p-2", amount: D(25_000_000) },
  ]);

  assert.equal(summary.total_active_investment.toString(), "25000000");
  assert.equal(summary.active_projects, 2);
});

test("serialisasi JSON mengirim nominal sebagai string", () => {
  const summary = summarizeActiveInvestments([
    { project_id: "p-1", amount: D("150000000.50") },
  ]);

  assert.deepEqual(JSON.parse(JSON.stringify(summary)), {
    total_active_investment: "150000000.5",
    active_projects: 1,
  });
});
