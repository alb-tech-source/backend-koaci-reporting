# User Management API Documentation

Dokumentasi lengkap untuk User Management API endpoints dengan RBAC (Role-Based Access Control).

## Base URL
```
/api/users
```

## Permissions Required

Endpoints ini membutuhkan permission tertentu:
- `users:read` - Melihat data user
- `users:create` - Membuat user baru
- `users:update` - Mengupdate data user
- `users:delete` - Menghapus user
- `users:manage_roles` - Manajemen role dan reset password

## Endpoints

### 1. Get List Users
**GET** `/api/users`

Mendapatkan daftar user dengan pagination dan filtering.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
```typescript
{
  page?: number;      // Default: 1
  limit?: number;     // Default: 10, Max: 100
  search?: string;    // Search by firstname, lastname, or email
  is_active?: boolean; // Filter by active status
}
```

**Example Request:**
```bash
GET /api/users?page=1&limit=10&search=john&is_active=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "user_id": "uuid",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "is_active": true,
      "last_login_at": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Permission Required:** `users:read`

---

### 2. Get User by ID
**GET** `/api/users/:id`

Mendapatkan detail user berdasarkan ID.

**Headers:**
```
Authorization: Bearer {access_token}
```

**URL Parameters:**
```
id: string (UUID) - User ID
```

**Example Request:**
```bash
GET /api/users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user_id": "uuid",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "is_active": true,
    "last_login_at": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "User tidak ditemukan!"
}
```

**Permission Required:** `users:read`

---

### 3. Create User
**POST** `/api/users`

Membuat user baru. Password bersifat optional - jika tidak diberikan, system akan generate temporary password.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "Password123",  // Optional
  "is_active": false         // Optional, Default: false
}
```

**Validation Rules:**
- `firstname`: 1-50 karakter, wajib diisi
- `lastname`: 1-50 karakter, wajib diisi
- `email`: Format email valid, unik
- `password`: Min 8 karakter (optional)
- `is_active`: Boolean (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "user_id": "uuid",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "is_active": false,
      "last_login_at": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "temporaryPassword": "a1b2c3d4e5f6g7h8"
  }
}
```

**Note:** 
- `temporaryPassword` hanya muncul sekali saat create. Simpan dengan baik!
- Jika password tidak diberikan, system akan generate random password.
- Kirim kredensial ke user via email/Lark.

**Permission Required:** `users:create`

---

### 4. Update User
**PUT** `/api/users/:id`

Mengupdate data user.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**URL Parameters:**
```
id: string (UUID) - User ID
```

**Request Body:**
```json
{
  "firstname": "Jane",
  "lastname": "Smith",
  "email": "jane.smith@example.com",
  "password": "NewPassword123",
  "is_active": true
}
```

**Validation Rules:**
- Minimal satu field harus diisi
- `firstname`, `lastname`: 1-50 karakter
- `email`: Format email valid, unik
- `password`: Min 8 karakter (optional)
- `is_active`: Boolean (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user_id": "uuid",
    "firstname": "Jane",
    "lastname": "Smith",
    "email": "jane.smith@example.com",
    "is_active": true,
    "last_login_at": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T10:30:00.000Z"
  }
}
```

**Permission Required:** `users:update`

---

### 5. Change User Activation
**PATCH** `/api/users/:id/activate`

Mengaktifkan atau menonaktifkan user.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**URL Parameters:**
```
id: string (UUID) - User ID
```

**Request Body:**
```json
{
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user_id": "uuid",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "is_active": true,
    "last_login_at": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T11:00:00.000Z"
  }
}
```

**Permission Required:** `users:update`

---

### 6. Reset User Password
**POST** `/api/users/:id/reset-password`

Reset password user dan generate temporary password baru.

**Headers:**
```
Authorization: Bearer {access_token}
```

**URL Parameters:**
```
id: string (UUID) - User ID
```

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "temporaryPassword": "x9y8z7w6v5u4"
  }
}
```

**Note:** 
- `temporaryPassword` hanya muncul sekali. Kirim ke user via email/Lark.
- Password lama akan langsung ditimpa.

**Permission Required:** `users:manage_roles`

---

### 7. Delete User
**DELETE** `/api/users/:id`

Menghapus user secara permanen.

**Headers:**
```
Authorization: Bearer {access_token}
```

**URL Parameters:**
```
id: string (UUID) - User ID
```

**Response (200):**
```json
{
  "success": true,
  "message": "User berhasil dihapus permanen"
}
```

**Warning:** 
- Operasi ini TIDAK BISA di-undo!
- Data user akan dihapus permanen dari database.
- Pertimbangkan untuk menggunakan soft delete di production.

**Permission Required:** `users:delete`

---

## Using the Routes

### Import in Main App
```typescript
import userRoutes from "./routes/user.route";

const app = express();

app.use("/api/users", userRoutes);
```

### Example Usage with Auth Middleware
```typescript
import { Router } from "express";
import { authMiddleware, requirePermission } from "../middleware/auth.middleware";
import * as userController from "../controllers/user.controller";

const router = Router();

// Get all users - requires users:read permission
router.get(
  "/users",
  authMiddleware,
  requirePermission(["users:read"]),
  userController.list
);

// Create user - requires users:create permission
router.post(
  "/users",
  authMiddleware,
  requirePermission(["users:create"]),
  userController.create
);

// Delete user - requires users:delete permission
router.delete(
  "/users/:id",
  authMiddleware,
  requirePermission(["users:delete"]),
  userController.remove
);
```

---

## Permission Matrix

| Role | users:read | users:create | users:update | users:delete | users:manage_roles |
|------|------------|--------------|---------------|--------------|-------------------|
| BOD  | ❌         | ❌           | ❌            | ❌           | ❌                |
| Admin| ✅         | ✅           | ✅            | ✅           | ✅                |
| Investor| ❌     | ❌           | ❌            | ❌           | ❌                |

**Note:** BOD dan Investor tidak memiliki akses ke user management.

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error message here"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid token)
- `403`: Forbidden (no permission)
- `404`: Not Found (user not found)
- `409`: Conflict (email already exists)
- `500`: Internal Server Error

### Common Error Messages
- `"User tidak ditemukan!"` - User ID tidak valid
- `"Email sudah terdaftar."` - Email sudah digunakan
- `"Email sudah digunakan user lain"` - Email conflict saat update
- `"Firstname wajib diisi."` - Validation error

---

## Postman Collection Example

### Environment Variables
```
base_url = http://localhost:3000/api/users
access_token = {{login.response.data.tokens.accessToken}}
```

### Get Users Request
```
GET {{base_url}}/?page=1&limit=10
Authorization: Bearer {{access_token}}
```

### Create User Request
```
POST {{base_url}}/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "is_active": true
}
```

### Delete User Request
```
DELETE {{base_url}}/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {{access_token}}
```

---

## Security Notes

1. **Password Handling:**
   - Temporary password hanya muncul sekali
   - Kirim via secure channel (email/Lark)
   - User harus ganti password setelah login

2. **Email Uniqueness:**
   - Email harus unik di seluruh system
   - Update email akan mengecek availability

3. **Role Assignment:**
   - Role assignment melalui seeder atau manual DB
   - Hubungan User-Role adalah 1:1

4. **Audit Trail:**
   - Pertimbangkan menambah audit log untuk user actions
   - Track create, update, delete operations

5. **Soft Delete:**
   - Pertimbangkan soft delete untuk production
   - Tambah field `deleted_at` di User model

---

## Next Steps

1. ✅ User Service & Controller - DONE
2. ✅ User Routes with Permissions - DONE
3. ⏳ TODO: Implement email/Lark notification untuk kredensial
4. ⏳ TODO: Add soft delete functionality
5. ⏳ TODO: Implement audit logging
6. ⏳ TODO: Add bulk user operations
7. ⏳ TODO: Implement user profile picture upload

---

## Test with Sample Data

Gunakan test accounts untuk testing permissions:

### Login as Admin
```bash
POST /api/auth/login
{
  "email": "admin@koaci.com",
  "password": "Admin@123456"
}
```

### Create User (Admin Only)
```bash
POST /api/users
Authorization: Bearer {admin_token}
{
  "firstname": "Test",
  "lastname": "User",
  "email": "test@example.com",
  "is_active": false
}
```

### Try Access as Investor (Should Fail)
```bash
GET /api/users
Authorization: Bearer {investor_token}

# Response: 403 Forbidden
# "Anda tidak memiliki izin: users:read"
```
