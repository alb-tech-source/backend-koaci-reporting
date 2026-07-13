# Auth API Documentation

Dokumentasi lengkap untuk authentication & authorization API endpoints.

## Base URL
```
/api/auth
```

## Endpoints

### 1. Register User
**POST** `/api/auth/register`

Register user baru. Akun perlu diaktifkan oleh admin.

**Request Body:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Validation Rules:**
- `firstname`: 1-50 karakter, wajib diisi
- `lastname`: 1-50 karakter, wajib diisi
- `email`: Format email valid, unik
- `password`: Min 8 karakter, harus mengandung huruf kapital dan angka

**Response (201):**
```json
{
  "success": true,
  "message": "Registrasi berhasil. Silakan hubungi admin untuk aktivasi akun.",
  "data": {
    "user": {
      "user_id": "uuid",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "is_active": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response (409):**
```json
{
  "success": false,
  "message": "Email sudah terdaftar"
}
```

---

### 2. Login
**POST** `/api/auth/login`

Login user dengan email dan password.

**Request Body:**
```json
{
  "email": "admin@koaci.com",
  "password": "Admin@123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "user_id": "uuid",
      "firstname": "Super",
      "lastname": "Admin",
      "email": "admin@koaci.com",
      "is_active": true,
      "last_login_at": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

**JWT Payload Structure:**
```json
{
  "userId": "uuid",
  "email": "admin@koaci.com",
  "role": "admin",
  "permissions": ["dashboard:view", "users:read", "reports:create", ...]
}
```

**Error Responses:**
- `401`: "Email atau password salah"
- `403`: "Akun belum aktif, silakan hubungi admin"

---

### 3. Refresh Access Token
**POST** `/api/auth/refresh`

Perbarui access token menggunakan refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token berhasil diperbarui",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

---

### 4. Forgot Password
**POST** `/api/auth/forgot-password`

Request link reset password.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Jika email terdaftar, link reset password akan dikirim ke email Anda.",
  "data": null
}
```

**Note:** Selalu return sukses untuk menghindari email enumeration attack.

---

### 5. Reset Password
**POST** `/api/auth/reset-password`

Reset password menggunakan token dari forgot password.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewPassword123"
}
```

**Validation Rules:**
- `token`: Wajib diisi
- `newPassword`: Min 8 karakter, harus mengandung huruf kapital dan angka

**Response (200):**
```json
{
  "success": true,
  "message": "Password berhasil direset. Silakan login dengan password baru.",
  "data": null
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Token reset tidak valid atau sudah kadaluarsa"
}
```

---

### 6. Get Current User
**GET** `/api/auth/me`

Mendapatkan profile user yang sedang login.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User profile berhasil diambil",
  "data": {
    "user": {
      "user_id": "uuid",
      "firstname": "Super",
      "lastname": "Admin",
      "email": "admin@koaci.com",
      "is_active": true,
      "last_login_at": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "role": "admin",
    "permissions": [
      "dashboard:view",
      "analytics:view",
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
      "users:manage_roles",
      "reports:read",
      "reports:create",
      "reports:update",
      "reports:delete",
      "reports:approve",
      "reports:export",
      "outlets:read",
      "outlets:create",
      "outlets:update",
      "outlets:delete",
      "settings:read",
      "settings:update",
      "audit:read",
      "notifications:send"
    ]
  }
}
```

---

### 7. Logout
**POST** `/api/auth/logout`

Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout berhasil",
  "data": null
}
```

**Note:** JWT adalah stateless, jadi logout sebenarnya terjadi di client side dengan menghapus tokens. Endpoint ini untuk audit/logging purposes jika diperlukan.

---

## Using the Routes

### Import in Main App
```typescript
import authRoutes from "./routes/auth.route";

const app = express();

app.use("/api/auth", authRoutes);
```

### Example Request with Auth Middleware
```typescript
import { Router } from "express";
import { authMiddleware, requirePermission } from "../middleware/auth.middleware";
import * as reportController from "../controllers/report.controller";

const router = Router();

// Protected route - requires login
router.get(
  "/reports",
  authMiddleware,
  requirePermission(["reports:read"]),
  reportController.getAllReports
);
```

---

## Token Expiration

- **Access Token:** 1 jam
- **Refresh Token:** 7 hari

---

## Test Accounts

Setelah menjalankan seeder (`npm run seed:role-permission`), gunakan account ini untuk testing:

| Role | Email | Password |
|------|-------|----------|
| BOD | `bod@koaci.com` | `Bod@123456` |
| Admin | `admin@koaci.com` | `Admin@123456` |
| Investor | `investor@koaci.com` | `Investor@123456` |

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
- `400`: Bad Request (validation error, invalid token)
- `401`: Unauthorized (invalid credentials, expired token)
- `403`: Forbidden (no permission, inactive account)
- `404`: Not Found
- `409`: Conflict (email already exists)
- `500`: Internal Server Error

---

## Postman Collection Example

### Environment Variables
```
base_url = http://localhost:3000/api/auth
access_token = {{login.response.data.tokens.accessToken}}
```

### Login Request
```
POST {{base_url}}/login
Content-Type: application/json

{
  "email": "admin@koaci.com",
  "password": "Admin@123456"
}
```

### Get Profile Request
```
GET {{base_url}}/me
Authorization: Bearer {{access_token}}
```

### Logout Request
```
POST {{base_url}}/logout
Authorization: Bearer {{access_token}}
```

---

## Security Notes

1. **Password Requirements:** Min 8 karakter, harus mengandung:
   - Huruf kapital (A-Z)
   - Angka (0-9)

2. **Token Storage:** Store tokens securely (httpOnly cookie recommended)

3. **HTTPS:** Gunakan HTTPS di production

4. **Rate Limiting:** Implement rate limiting untuk login endpoint

5. **Email Enumeration:** Forgot password selalu return sukses untuk menghindari email enumeration

6. **Token Expiration:** Access token 1 jam, refresh token 7 hari

7. **Role-Based Access:** Semua protected endpoints harus menggunakan `authMiddleware` dan permission checks

---

## Next Steps

1. ✅ Seeder & Service - DONE
2. ✅ Controller & Routes - DONE
3. ⏳ TODO: Implement email/Lark notification untuk forgot password
4. ⏳ TODO: Add rate limiting untuk login
5. ⏳ TODO: Implement token blacklist untuk logout (optional)
6. ⏳ TODO: Add audit logging untuk auth events
