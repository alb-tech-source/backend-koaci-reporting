# Investor Document Permissions - Documentation

## 📋 Available Permissions

| Permission Key | Description |
|----------------|-------------|
| `investors:documents:read` | Read ALL investor documents (admin, superadmin, bod) |
| `investors:documents:read_own` | Read OWN documents only (investor) |
| `investors:documents:upload` | Upload new investor documents |
| `investors:documents:delete` | Delete ANY investor documents (admin, superadmin) |
| `investors:documents:delete_own` | Delete OWN documents only (investor) |

## 🔐 Role Permission Matrix

### Superadmin - Full Access ✅
**Permissions:**
- ✅ `investors:documents:read` - Read all documents
- ✅ `investors:documents:upload` - Upload documents
- ✅ `investors:documents:delete` - Delete any documents

**Access Level:** FULL ACCESS to all investor documents

---

### Admin - Full Access ✅
**Permissions:**
- ✅ `investors:documents:read` - Read all documents
- ✅ `investors:documents:upload` - Upload documents
- ✅ `investors:documents:delete` - Delete any documents

**Access Level:** FULL ACCESS to all investor documents

---

### BOD (Board of Directors) - Read Only ✅
**Permissions:**
- ✅ `investors:documents:read` - Read all documents
- ❌ `investors:documents:upload` - Cannot upload
- ❌ `investors:documents:delete` - Cannot delete

**Access Level:** READ ONLY - Can view all documents but cannot modify

---

### Investor - Own Documents Access ✅
**Permissions:**
- ✅ `investors:documents:read_own` - Read own documents only
- ✅ `investors:documents:upload` - Upload new documents
- ✅ `investors:documents:delete_own` - Delete own documents only

**Access Level:** LIMITED - Can manage own documents only

---

### User - No Access ✅
**Permissions:**
- ❌ No investor document permissions

**Access Level:** NO ACCESS - Cannot view or manage any investor documents

---

## 🎯 API Endpoint Permission Requirements

| Endpoint | Method | Required Permissions |
|----------|--------|---------------------|
| `/api/investor-documents/investor/:investorId` | GET | `investors:documents:read` OR `investors:documents:read_own` |
| `/api/investor-documents/:documentId/download` | GET | `investors:documents:read` OR `investors:documents:read_own` |
| `/api/investor-documents/` | POST | `investors:documents:upload` |
| `/api/investor-documents/:documentId` | DELETE | `investors:documents:delete` OR `investors:documents:delete_own` |

## 🔄 Implementation Notes

### Business Logic Enforcement
Permissions are enforced at **middleware level** (`requirePermission`) but business logic should also enforce:

1. **`_own` permissions**: Service layer should verify the document belongs to the requesting user
2. **Admin restrictions**: Certain operations (like deleting superadmin/bod) should be protected at service level
3. **File access**: R2 presigned URLs should be generated only for authorized documents

### Example Implementation
```typescript
// In investorDocument.service.ts
export const investorDocumentService = {
  // Check if document belongs to investor (for _own permissions)
  async verifyOwnership(documentId: string, investorId: string): Promise<boolean> {
    const doc = await prisma.investorDocument.findUnique({
      where: { document_id: documentId }
    });
    return doc?.investor_id === investorId;
  }
};
```

## 📊 Permission Hierarchy

```
Full Access (Admin, Superadmin)
    ├── investors:documents:read
    ├── investors:documents:upload
    └── investors:documents:delete

Read Only (BOD)
    └── investors:documents:read

Own Documents (Investor)
    ├── investors:documents:read_own
    ├── investors:documents:upload
    └── investors:documents:delete_own

No Access (User)
    └── (empty)
```

---

*Last Updated: 2026-08-01*
*Seeder Files: `role-permission.seed.ts`, `role-permission.update.seed.ts`*
