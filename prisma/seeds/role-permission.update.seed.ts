import prisma from "../../src/lib/prisma.ts";

/**
 * Seeder untuk FORCE UPDATE Role & Permissions
 *
 * ⚠️  PERHATIAN: Seeder ini akan MENGHAPUS SEMUA role permissions
 * dan me-recreate dengan mapping terbaru dari ROLE_PERMISSIONS.
 *
 * Schema flow:
 * 1. Delete semua RolePermission entries
 * 2. Create missing permissions (skip duplicates)
 * 3. Re-link roles dengan permissions terbaru
 *
 * Gunakan ini ketika:
 * - Ada perubahan di ROLE_PERMISSIONS mapping
 * - Ingin reset semua permissions ke default
 * - Debugging permission issues
 *
 * Yang TIDAK akan dihapus:
 * - Users (tetap ada)
 * - Roles (tetap ada, hanya permissions yang di-reset)
 * - Data lain (investors, documents, dll)
 */

// Available permissions
const PERMISSIONS = {
  // User Management
  "users:read": "Membaca data user",
  "users:create": "Membuat user baru",
  "users:update": "Mengupdate data user",
  "users:delete": "Menghapus user",
  "users:manage_roles": "Mengelola role user",

  // Investor Management
  "investors:read": "Membaca data investor",
  "investors:read_all": "Membaca semua data investor",
  "investors:create": "Membuat investor baru",
  "investors:update": "Mengupdate data investor",
  "investors:update_status": "Mengupdate status investor",
  "investors:delete": "Menghapus investor",
  "investors:read_own": "Membaca data diri sendiri (sebagai investor)",

  // Investor Documents
  "investors:documents:read": "Membaca dokumen investor semua",
  "investors:documents:read_own": "Membaca dokumen sendiri",
  "investors:documents:upload": "Upload dokumen investor",
  "investors:documents:delete": "Menghapus dokumen investor semua",
  "investors:documents:delete_own": "Menghapus dokumen sendiri",

  // Role Management
  "roles:read": "Membaca data role",
  "roles:manage": "Mengelola role dan permissions",
};

/**
 * Mapping role dengan permissions mereka
 *
 * Permission Matrix:
 * - user: User biasa tanpa permission spesifik
 * - investor: Hanya bisa manage profil & dokumen sendiri
 * - admin: Bisa manage users & investors, TIDAK BISA delete BOD & Superadmin
 * - superadmin: Hampir full access, TIDAK BISA delete BOD
 * - bod: READ ONLY - semua akses pembacaan tanpa write operations
 */
const ROLE_PERMISSIONS = {
  // user: User biasa - minimal permissions
  user: [],

  // investor: Investor - bisa baca dan update diri sendiri
  investor: [
    "investors:read_own",
    "investors:documents:read_own",
    "investors:documents:upload",
    "investors:documents:delete_own",
  ],

  // admin: Admin - manage users dan investors
  // BISA: Create/update users, Create/update/delete investors & admin, Full access investor documents
  // TIDAK BISA: Delete BOD & Superadmin
  admin: [
    "users:read",
    "users:create",
    "users:update",
    // Note: users:delete excluded - tidak bisa delete user (terutama BOD & Superadmin)
    "investors:read",
    "investors:read_all",
    "investors:create",
    "investors:update",
    "investors:update_status",
    "investors:delete",
    "investors:documents:read",
    "investors:documents:upload",
    "investors:documents:delete",
    "roles:read",
  ],

  // superadmin: Super Admin - hampir full access
  // BISA: Create/update semua users, delete admin & user biasa, manage roles, Full access investor documents
  // TIDAK BISA: Delete BOD
  superadmin: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete", // Bisa delete admin & user biasa, BOD harus di-protect di service level
    "users:manage_roles",
    "investors:read",
    "investors:read_all",
    "investors:create",
    "investors:update",
    "investors:update_status",
    "investors:delete",
    "investors:documents:read",
    "investors:documents:upload",
    "investors:documents:delete",
    "roles:read",
    "roles:manage",
  ],

  // bod: Board of Directors - READ ONLY
  // BISA: Semua operasi pembacaan
  // TIDAK BISA: Create, update, delete apapun
  bod: [
    // Read permissions - semua data bisa dibaca
    "users:read",
    "investors:read",
    "investors:read_all",
    "investors:documents:read",
    "roles:read",
    // Note: Tidak ada create, update, atau delete permissions
  ],
};

async function forceUpdatePermissions() {
  console.log("🔄 Starting Force Update Role Permissions...\n");

  try {
    // STEP 1: Delete all existing role permissions
    console.log("🗑️  STEP 1: Deleting ALL existing role permissions...");
    const deletedCount = await prisma.rolePermission.deleteMany({});
    console.log(`✅ Deleted ${deletedCount.count} role permission entries\n`);

    // STEP 2: Create/update permissions
    console.log("📝 STEP 2: Creating/updating permissions...");
    const permissionEntries = Object.entries(PERMISSIONS);

    await prisma.permission.createMany({
      data: permissionEntries.map(([key]) => ({
        permission_key: key,
      })),
      skipDuplicates: true,
    });

    const allPermissions = await prisma.permission.findMany();
    console.log(`✅ Total permissions in database: ${allPermissions.length}\n`);

    // STEP 3: Fetch permission IDs for linking
    console.log("🔗 STEP 3: Linking permissions to roles...");
    const permissionMap = new Map(
      allPermissions.map((p) => [p.permission_key, p.permission_id]),
    );

    // STEP 4: Get all existing roles
    console.log("👥 STEP 4: Fetching all existing roles...");
    const allRoles = await prisma.role.findMany();
    console.log(`✅ Found ${allRoles.length} roles in database\n`);

    // STEP 5: Create RolePermissions for each role
    console.log("🔗 STEP 5: Creating new role permissions...\n");

    let totalLinked = 0;
    const roleSummary: any = {};

    for (const role of allRoles) {
      const roleName = role.role_name;
      const permissionKeys =
        ROLE_PERMISSIONS[roleName as keyof typeof ROLE_PERMISSIONS];

      if (!permissionKeys) {
        console.warn(`⚠️  No permissions defined for role: ${roleName}`);
        roleSummary[roleName] = {
          permissions: 0,
          status: "No mapping defined",
        };
        continue;
      }

      const rolePermissionData = permissionKeys
        .map((key) => {
          const permissionId = permissionMap.get(key);
          if (!permissionId) {
            console.warn(`⚠️  Permission not found: ${key}`);
            return null;
          }
          return {
            role_id: role.role_id,
            permission_id: permissionId,
          };
        })
        .filter(Boolean);

      await prisma.rolePermission.createMany({
        data: rolePermissionData as any,
        skipDuplicates: true,
      });

      totalLinked += rolePermissionData.length;
      roleSummary[roleName] = {
        permissions: rolePermissionData.length,
        status: "✅ Updated",
      };

      console.log(
        `✅ Role: ${String(roleName).padEnd(12)} → ${rolePermissionData.length} permissions linked`,
      );
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Force Update completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Total permissions: ${allPermissions.length}`);
    console.log(`   - Total roles: ${allRoles.length}`);
    console.log(`   - Total permissions linked: ${totalLinked}`);
    console.log("\n📋 Role Details:");
    Object.entries(roleSummary).forEach(([role, info]: [string, any]) => {
      console.log(
        `   - ${String(role).padEnd(12)}: ${info.permissions} permissions ${info.status}`,
      );
    });

    console.log("\n" + "=".repeat(50));
    console.log("⚠️  IMPORTANT:");
    console.log(
      "   All role permissions have been reset to the latest mapping.",
    );
    console.log("   Users and roles remain unchanged.");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Error during force update:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder
console.log("\n" + "⚠️ ".repeat(25));
console.log("⚠️  FORCE UPDATE PERMISSIONS SEEDER");
console.log("⚠️ ".repeat(25));
console.log(
  "\n⚠️  WARNING: This will DELETE ALL role permissions and recreate them!",
);
console.log(
  "⚠️  Make sure you have the correct ROLE_PERMISSIONS mapping in this file.",
);
console.log("\n" + "⚠️ ".repeat(25) + "\n");

// Tunggu 3 detik sebelum proceed (gives time to cancel)
setTimeout(() => {
  console.log("⏳ Proceeding with force update...\n");
  forceUpdatePermissions()
    .then(() => {
      console.log("\n✅ Force update completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Force update failed:", error);
      process.exit(1);
    });
}, 3000);
