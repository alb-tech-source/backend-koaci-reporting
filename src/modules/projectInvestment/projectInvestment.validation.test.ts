import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createProjectInvestmentBodySchema,
  updateProjectInvestmentBodySchema,
} from "./projectInvestment.validation.js";

test("update tanpa payment_method tidak mengembalikannya ke transfer", () => {
  const parsed = updateProjectInvestmentBodySchema.parse({ amount: 25_000_000 });
  assert.deepEqual(parsed, { amount: 25_000_000 });
});

test("membuat investasi tanpa payment_method tetap memakai default transfer", () => {
  const parsed = createProjectInvestmentBodySchema.parse({
    project_id: "3f2c1e0a-9b7d-4c5e-8a1f-2d3b4c5d6e7f",
    investor_id: "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
    amount: 25_000_000,
    total_package: 5,
  });
  assert.equal(parsed.payment_method, "transfer");
});
