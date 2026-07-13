# Auth Middleware Guide

Panduan penggunaan middleware autentikasi dan otorisasi dengan RBAC (Role-Based Access Control).

## Import

```typescript
import {
  authMiddleware,
  requirePermission,
  requireRole,
  requireRoleAndPermission,
} from "../middleware/auth.middleware";
```

## 1. Basic Authentication

Hanya mengecek apakah user sudah login:

```typescript
import { authMiddleware } from "../middleware/auth.middleware";

router.get("/profile", authMiddleware, getProfile);
```

## 2. Permission-Based Authorization

Mengecek apakah user memiliki permission tertentu:

```typescript
// Single permission (OR logic - butuk satu dari array)
router.get(
  "/reports",
  authMiddleware,
  requirePermission(["reports:read"]),
  getReports
);

// Multiple permissions (OR logic - cukup satu)
router.get(
  "/analytics",
  authMiddleware,
  requirePermission(["analytics:view", "analytics:advanced"]),
  getAnalytics
);

// Multiple permissions (AND logic - harus punya semua)
router.delete(
  "/users/:id",
  authMiddleware,
  requirePermission(["users:delete", "users:manage_roles"], true),
  deleteUser
);
```

## 3. Role-Based Authorization

Mengecek apakah user memiliki role tertentu:

```typescript
// Single role
router.post(
  "/admin/settings",
  authMiddleware,
  requireRole(["admin"]),
  updateSettings
);

// Multiple roles (OR logic)
router.get(
  "/board-reports",
  authMiddleware,
  requireRole(["bod", "admin"]),
  getBoardReports
);
```

## 4. Combined Role & Permission

Mengecek role DAN permission sekaligus:

```typescript
import { requireRoleAndPermission } from "../middleware/auth.middleware";

router.post(
  "/reports",
  authMiddleware,
  ...requireRoleAndPermission(
    ["admin", "bod"],           // Allowed roles
    ["reports:create"],         // Required permissions
    false                        // requireAll = false (OR logic)
  ),
  createReport
);

// Dengan AND logic untuk permissions
router.delete(
  "/reports/:id",
  authMiddleware,
  ...requireRoleAndPermission(
    ["admin"],
    ["reports:delete", "reports:approve"],
    true                         // Harus punya KEDUA permissions
  ),
  deleteReport
);
```

## 5. Complete Route Example

```typescript
import { Router } from "express";
import {
  authMiddleware,
  requirePermission,
  requireRole,
  requireRoleAndPermission,
} from "../middleware/auth.middleware";
import * as reportController from "../controllers/report.controller";

const router = Router();

// Public routes
router.get("/reports/public", reportController.getPublicReports);

// Protected routes (login required)
router.get(
  "/reports/my-reports",
  authMiddleware,
  reportController.getMyReports
);

// Permission-based routes
router.get(
  "/reports",
  authMiddleware,
  requirePermission(["reports:read"]),
  reportController.getAllReports
);

router.post(
  "/reports",
  authMiddleware,
  requirePermission(["reports:create"]),
  reportController.createReport
);

router.put(
  "/reports/:id",
  authMiddleware,
  requirePermission(["reports:update"]),
  reportController.updateReport
);

router.delete(
  "/reports/:id",
  authMiddleware,
  requirePermission(["reports:delete"]),
  reportController.deleteReport
);

// Role-based routes
router.get(
  "/admin/dashboard",
  authMiddleware,
  requireRole(["admin"]),
  reportController.getAdminDashboard
);

router.get(
  "/board/dashboard",
  authMiddleware,
  requireRole(["bod", "admin"]),
  reportController.getBoardDashboard
);

// Combined routes
router.post(
  "/reports/:id/approve",
  authMiddleware,
  ...requireRoleAndPermission(
    ["admin", "bod"],
    ["reports:approve"]
  ),
  reportController.approveReport
);

export default router;
```

## 6. Permission Keys Reference

Permission yang tersedia di sistem:

### User Management
- `users:read` - Membaca data user
- `users:create` - Membuat user baru
- `users:update` - Mengupdate data user
- `users:delete` - Menghapus user
- `users:manage_roles` - Mengelola role user

### Report Management
- `reports:read` - Membaca laporan
- `reports:create` - Membuat laporan baru
- `reports:update` - Mengupdate laporan
- `reports:delete` - Menghapus laporan
- `reports:approve` - Menyetujui laporan
- `reports:export` - Mengekspor laporan
- `reports:view_all` - Melihat semua laporan

### Outlet Management
- `outlets:read` - Membaca data outlet
- `outlets:create` - Membuat outlet baru
- `outlets:update` - Mengupdate data outlet
- `outlets:delete` - Menghapus outlet

### Dashboard & Analytics
- `dashboard:view` - Melihat dashboard
- `analytics:view` - Melihat analitik
- `analytics:advanced` - Melihat analitik lanjutan

### Settings Management
- `settings:read` - Membaca pengaturan
- `settings:update` - Mengupdate pengaturan

### Audit & Logs
- `audit:read` - Membaca audit logs
- `audit:export` - Mengekspor audit logs

### Communication
- `notifications:send` - Mengirim notifikasi

## 7. Role Permissions Mapping

### BOD (Board of Directors)
- dashboard:view
- analytics:view
- analytics:advanced
- reports:read
- reports:view_all
- reports:export
- reports:approve
- outlets:read
- settings:read
- audit:read
- audit:export

### Admin
- dashboard:view
- analytics:view
- users:read
- users:create
- users:update
- users:delete
- users:manage_roles
- reports:read
- reports:create
- reports:update
- reports:delete
- reports:approve
- reports:export
- outlets:read
- outlets:create
- outlets:update
- outlets:delete
- settings:read
- settings:update
- audit:read
- notifications:send

### Investor
- dashboard:view
- analytics:view
- reports:read
- reports:view_all
- reports:export
- outlets:read

## 8. Error Responses

### 401 Unauthorized
```json
{
  "message": "Token tidak ditemukan"
}
```
atau
```json
{
  "message": "Token tidak valid atau sudah kadaluarsa"
}
```

### 403 Forbidden
```json
{
  "message": "Anda tidak memiliki izin: reports:create"
}
```
atau
```json
{
  "message": "Anda tidak memiliki akses. Role required: admin, bod"
}
```

## 9. Running the Seeder

Untuk membuat test data dengan users, roles, dan permissions:

```bash
npm run seed:role-permission
```

Test accounts yang dibuat:
- **bod@koaci.com** / `Bod@123456` - Role: BOD
- **admin@koaci.com** / `Admin@123456` - Role: Admin
- **investor@koaci.com** / `Investor@123456` - Role: Investor
