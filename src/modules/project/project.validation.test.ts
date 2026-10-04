import { test } from "node:test";
import assert from "node:assert/strict";
import { createProjectSchema, updateProjectSchema } from "./project.validation.js";

const base = {
  company_id: "3f2c1e0a-9b7d-4c5e-8a1f-2d3b4c5d6e7f",
  project_key: "ksi-2026-001",
  funding_required: 500_000_000,
};

test("menerima project_name dan is_public saat membuat project", () => {
  const parsed = createProjectSchema.parse({
    ...base,
    project_name: "  Pembiayaan Gudang  ",
    is_public: true,
  });
  assert.equal(parsed.project_name, "Pembiayaan Gudang");
  assert.equal(parsed.is_public, true);
});

test("update tanpa is_public tidak mengubah visibilitas project", () => {
  const parsed = updateProjectSchema.parse({ project_name: "Nama Baru" });
  assert.equal("is_public" in parsed, false);
});

test("update tanpa status tidak mengembalikan status ke open", () => {
  const parsed = updateProjectSchema.parse({ funding_required: 600_000_000 });
  assert.deepEqual(parsed, { funding_required: 600_000_000 });
});

test("membuat project tanpa status tetap memakai default open", () => {
  assert.equal(createProjectSchema.parse(base).status, "open");
});

test("menolak is_public yang bukan boolean", () => {
  assert.equal(
    createProjectSchema.safeParse({ ...base, is_public: "true" }).success,
    false,
  );
});
