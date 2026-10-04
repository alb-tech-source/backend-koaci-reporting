import { test } from "node:test";
import assert from "node:assert/strict";
import { createCompanySchema, updateCompanySchema } from "./company.validation.js";

test("update tanpa status dan company_type tidak mengisi nilai default", () => {
  const parsed = updateCompanySchema.parse({ company_address: "Jl. Baru No. 5" });
  assert.deepEqual(parsed, { company_address: "Jl. Baru No. 5" });
});

test("update tetap menerima status dan company_type yang dikirim", () => {
  const parsed = updateCompanySchema.parse({ status: "blacklist", company_type: "CV" });
  assert.deepEqual(parsed, { status: "blacklist", company_type: "CV" });
});

test("membuat perusahaan tanpa status dan company_type tetap memakai default", () => {
  const parsed = createCompanySchema.parse({
    company_name: "PT Maju Bersama",
    director_name: "Budi Santoso",
    director_phone: "081234567890",
    company_address: "Jl. Merdeka No. 1",
  });
  assert.equal(parsed.status, "active");
  assert.equal(parsed.company_type, "PT");
});
