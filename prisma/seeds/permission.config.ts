export const CANONICAL_PERMISSIONS = {
  "users:create:any": "Membuat user mana pun",
  "users:read:any": "Membaca semua user",
  "users:read:own": "Membaca user sendiri",
  "users:update:any": "Mengubah semua user",
  "users:update:own": "Mengubah user sendiri",
  "users:delete:any": "Menghapus semua user",
  "users:delete:own": "Menghapus user sendiri",
  "roles:read:any": "Membaca semua role",
  "roles:read:own": "Membaca role sendiri",
  "roles:update:any": "Mengubah semua role",
  "investors:create:any": "Membuat profil investor untuk user mana pun",
  "investors:create:own": "Membuat profil investor sendiri",
  "investors:read:any": "Membaca semua investor",
  "investors:read:own": "Membaca profil investor sendiri",
  "investors:update:any": "Mengubah semua investor",
  "investors:update:own": "Mengubah profil investor sendiri",
  "investors:delete:any": "Menghapus semua investor",
  "investors:delete:own": "Menghapus profil investor sendiri",
  "investor_documents:read:any": "Membaca semua dokumen investor",
  "investor_documents:read:own": "Membaca dokumen investor sendiri",
  "investor_documents:upload:any": "Mengunggah dokumen untuk semua investor",
  "investor_documents:upload:own": "Mengunggah dokumen investor sendiri",
  "investor_documents:download:any": "Mengunduh semua dokumen investor",
  "investor_documents:download:own": "Mengunduh dokumen investor sendiri",
  "investor_documents:delete:any": "Menghapus semua dokumen investor",
  "investor_documents:delete:own": "Menghapus dokumen investor sendiri",
  "companies:create:any": "Membuat perusahaan",
  "companies:read:any": "Membaca semua perusahaan",
  "companies:update:any": "Mengubah perusahaan",
  "companies:delete:any": "Menghapus perusahaan",
  "company_documents:upload:any": "Mengunggah dokumen perusahaan",
  "company_documents:read:any": "Membaca metadata dokumen perusahaan",
  "company_documents:update:any": "Mengubah metadata dokumen perusahaan",
  "company_documents:download:any": "Mengunduh dokumen perusahaan",
  "company_documents:delete:any": "Menghapus dokumen perusahaan",
  "projects:create:any": "Membuat project",
  "projects:read:any": "Membaca semua project",
  "projects:update:any": "Mengubah project",
  "projects:delete:any": "Menghapus project",
  "project_documents:upload:any": "Mengunggah dokumen project",
  "project_documents:read:any": "Membaca metadata dokumen project",
  "project_documents:update:any": "Mengubah metadata dokumen project",
  "project_documents:download:any": "Mengunduh dokumen project",
  "project_documents:delete:any": "Menghapus dokumen project",
  "project_investments:create:any": "Membuat data investasi project",
  "project_investments:read:any": "Membaca semua data investasi project",
  "project_investments:update:any": "Mengubah data investasi project",
  "project_investments:delete:any": "Menghapus data investasi project",
  "receipt_documents:upload:any": "Mengunggah receipt document",
  "receipt_documents:read:any": "Membaca metadata receipt document",
  "receipt_documents:download:any": "Mengunduh receipt document",
  "receipt_documents:delete:any": "Menghapus receipt document",
  "project_reportings:create:any": "Membuat laporan project",
  "project_reportings:read:any": "Membaca semua laporan project",
  "project_reportings:update:any": "Mengubah laporan project",
  "project_reportings:delete:any": "Menghapus laporan project",
  "project_reporting_media:upload:any": "Mengunggah media laporan project",
  "project_reporting_media:read:any": "Membaca metadata media laporan project",
  "project_reporting_media:update:any": "Mengubah metadata media laporan project",
  "project_reporting_media:download:any": "Mengunduh media laporan project",
  "project_reporting_media:delete:any": "Menghapus media laporan project",
} as const;

export const ROLE_NAMES = [
  "superadmin",
  "admin",
  "bod",
  "investor",
  "user",
] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

const ALL_PERMISSION_KEYS = Object.keys(CANONICAL_PERMISSIONS);

// Board of Directors - read only semua data
const BOD_PERMISSIONS = [
  "companies:read:any",
  "company_documents:read:any",
  "company_documents:download:any",
  "investors:read:any",
  "investor_documents:read:any",
  "investor_documents:download:any",
  "projects:read:any",
  "project_documents:read:any",
  "project_documents:download:any",
  "users:read:any",
  "users:update:own",
  "roles:read:any",
  "project_investments:read:any",
  "receipt_documents:read:any",
  "receipt_documents:download:any",
  "project_reportings:read:any",
  "project_reporting_media:read:any",
  "project_reporting_media:download:any",
] as const;

// Investor - mengelola profil & dokumen sendiri, read data publik
const INVESTOR_PERMISSIONS = [
  "users:read:own",
  "users:update:own",
  "roles:read:own",
  "investors:create:own",
  "investors:read:own",
  "investors:update:own",
  "investor_documents:read:own",
  "investor_documents:download:own",
  "investor_documents:upload:own",
  "investor_documents:delete:own",
  "companies:read:any",
  "company_documents:read:any",
  "company_documents:download:any",
  "projects:read:any",
  "project_documents:read:any",
  "project_documents:download:any",
  "project_investments:read:any",
  "receipt_documents:read:any",
  "receipt_documents:download:any",
  "project_reportings:read:any",
  "project_reporting_media:read:any",
  "project_reporting_media:download:any",
] as const;

// User biasa - hanya mengelola akun sendiri
const USER_PERMISSIONS = ["users:read:own", "users:update:own"] as const;

export const CANONICAL_ROLE_PERMISSIONS = {
  superadmin: ALL_PERMISSION_KEYS,
  admin: ALL_PERMISSION_KEYS,
  bod: BOD_PERMISSIONS,
  investor: INVESTOR_PERMISSIONS,
  user: USER_PERMISSIONS,
} as const;

/**
 * Inversi dari CANONICAL_ROLE_PERMISSIONS:
 * permission_key -> daftar role yang memiliki permission tersebut secara default.
 * Dipakai seeder untuk mengisi kolom Permission.default_of_role.
 */
export const PERMISSION_DEFAULT_ROLES: Record<string, RoleName[]> =
  Object.fromEntries(
    ALL_PERMISSION_KEYS.map((key) => [
      key,
      ROLE_NAMES.filter((role) =>
        (CANONICAL_ROLE_PERMISSIONS[role] as readonly string[]).includes(key),
      ),
    ]),
  );
