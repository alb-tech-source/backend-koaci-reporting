import bcrypt from "bcrypt";

import prisma from "../../src/lib/prisma.ts";
import {
  CANONICAL_PERMISSIONS,
  CANONICAL_ROLE_PERMISSIONS,
} from "./permission.config.ts";
/**
 * Seeder untuk User, Role, Permission, dan RolePermission
 *
 * Schema flow:
 * User -> Role (1:1) -> RolePermission (many) -> Permission
 *
 * Role yang ada:
 * - user: User biasa (belum ada role spesifik)
 * - investor: Investor
 * - admin: Administrator
 * - superadmin: Super Administrator
 * - bod: Board of Directors
 */

// Sample users to be created with their roles
const SAMPLE_USERS = [
  {
    email: "bod@koaci.id",
    firstname: "Board",
    lastname: "Director",
    password: "password123",
    role: "bod",
    isActive: true,
  },
  {
    email: "superadmin@koaci.id",
    firstname: "Super",
    lastname: "Admin",
    password: "password123",
    role: "superadmin",
    isActive: true,
  },
  {
    email: "admin@koaci.id",
    firstname: "Admin",
    lastname: "Staff",
    password: "password123",
    role: "admin",
    isActive: true,
  },
  {
    email: "user@koaci.id",
    firstname: "Regular",
    lastname: "User",
    password: "password123",
    role: "user",
    isActive: true,
  },
  {
    email: "investor@koaci.id",
    firstname: "Investor",
    lastname: "One",
    password: "password123",
    role: "investor",
    isActive: true,
  },
];

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

async function seedUsersAndPermissions() {
  console.log("🌱 Starting User, Role & Permission seeding...");

  try {
    // 1. Create Permissions
    console.log("📝 Creating permissions...");
    const permissionEntries = Object.entries(CANONICAL_PERMISSIONS);

    await prisma.permission.createMany({
      data: permissionEntries.map(([key]) => ({
        permission_key: key,
      })),
      skipDuplicates: true,
    });

    const allPermissions = await prisma.permission.findMany();
    console.log(`✅ Created ${allPermissions.length} permissions`);

    // 2. Fetch permission IDs for linking
    const permissionMap = new Map(
      allPermissions.map((p) => [p.permission_key, p.permission_id]),
    );

    // 3. Create Users with their Roles
    console.log("👥 Creating users with roles...");
    const createdRoles = [];

    for (const userData of SAMPLE_USERS) {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const user = await prisma.user.create({
          data: {
            email: userData.email,
            firstname: userData.firstname,
            lastname: userData.lastname,
            password: hashedPassword,
            is_active: userData.isActive,
          },
        });

        // Create Role for this user
        const role = await prisma.role.create({
          data: {
            user_id: user.user_id,
            role_name: userData.role as any,
          },
        });

        createdRoles.push({ role, roleName: userData.role });
        console.log(
          `✅ Created user: ${userData.email} with role: ${userData.role}`,
        );
      } else {
        // Check if user has role
        const existingRole = await prisma.role.findUnique({
          where: { user_id: existingUser.user_id },
        });

        if (existingRole) {
          createdRoles.push({
            role: existingRole,
            roleName: existingRole.role_name,
          });
          console.log(`ℹ️  User already exists: ${userData.email}`);
        } else {
          // Create role for existing user
          const role = await prisma.role.create({
            data: {
              user_id: existingUser.user_id,
              role_name: userData.role as any,
            },
          });

          createdRoles.push({ role, roleName: userData.role });
          console.log(`✅ Created role for existing user: ${userData.email}`);
        }
      }
    }

    // 4. Create RolePermissions
    console.log("🔗 Linking permissions to roles...");

    for (const { role, roleName } of createdRoles) {
      const permissionKeys =
        CANONICAL_ROLE_PERMISSIONS[
          roleName as keyof typeof CANONICAL_ROLE_PERMISSIONS
        ];

      if (!permissionKeys) {
        console.warn(`⚠️  No permissions defined for role: ${roleName}`);
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

      console.log(
        `✅ Linked ${rolePermissionData.length} permissions to role: ${roleName}`,
      );
    }

    console.log("🎉 Seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Permissions: ${allPermissions.length}`);
    console.log(`   - Users created: ${SAMPLE_USERS.length}`);
    console.log(`   - Roles created: ${createdRoles.length}`);

    console.log("\n🔑 Test Accounts:");
    SAMPLE_USERS.forEach((u) => {
      console.log(`   - ${u.email} | ${u.password} | Role: ${u.role}`);
    });
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder
seedUsersAndPermissions()
  .then(() => {
    console.log("✅ Seeder completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeder failed:", error);
    process.exit(1);
  });
