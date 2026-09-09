import prisma from "../../src/lib/prisma.ts";
import {
  CANONICAL_PERMISSIONS,
  CANONICAL_ROLE_PERMISSIONS,
  PERMISSION_DEFAULT_ROLES,
} from "./permission.config.ts";

/**
 * Seeder untuk FORCE UPDATE Role & Permissions
 *
 * ⚠️  PERHATIAN: Seeder ini akan MENGHAPUS SEMUA role permissions
 * dan me-recreate dengan mapping terbaru dari CANONICAL_ROLE_PERMISSIONS.
 *
 * Schema flow:
 * 1. Delete semua RolePermission entries
 * 2. Create missing permissions (skip duplicates)
 * 3. Re-link roles dengan permissions terbaru
 *
 * Gunakan ini ketika:
 * - Ada perubahan di CANONICAL_ROLE_PERMISSIONS mapping (permission.config.ts)
 * - Ingin reset semua permissions ke default
 * - Debugging permission issues
 *
 * Yang TIDAK akan dihapus:
 * - Users (tetap ada)
 * - Roles (tetap ada, hanya permissions yang di-reset)
 * - Data lain (investors, documents, dll)
 */

async function forceUpdatePermissions() {
  console.log("🔄 Starting Force Update Role Permissions...\n");

  try {
    // STEP 1: Delete all existing role permissions
    console.log("🗑️  STEP 1: Deleting ALL existing role permissions...");
    const deletedCount = await prisma.rolePermission.deleteMany({});
    console.log(`✅ Deleted ${deletedCount.count} role permission entries\n`);

    // STEP 2: Create/update permissions
    console.log("📝 STEP 2: Creating/updating permissions...");
    const permissionEntries = Object.entries(CANONICAL_PERMISSIONS);

    await prisma.permission.createMany({
      data: permissionEntries.map(([key]) => ({
        permission_key: key,
        default_of_role: PERMISSION_DEFAULT_ROLES[key] ?? [],
      })),
      skipDuplicates: true,
    });

    // Backfill default_of_role untuk permission yang sudah ada sebelumnya
    // (createMany + skipDuplicates tidak meng-update row yang sudah ada)
    for (const [key] of permissionEntries) {
      await prisma.permission.update({
        where: { permission_key: key },
        data: { default_of_role: PERMISSION_DEFAULT_ROLES[key] ?? [] },
      });
    }

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
        CANONICAL_ROLE_PERMISSIONS[
          roleName as keyof typeof CANONICAL_ROLE_PERMISSIONS
        ];

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
  "⚠️  Make sure you have the correct CANONICAL_ROLE_PERMISSIONS mapping in permission.config.ts.",
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
