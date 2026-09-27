# Koaci Reporting App — Backend

REST API for the Koaci Reporting App. It manages investors, companies, projects, project investments, and project reporting, with role-based access control (RBAC), activity logging, and file storage on Cloudflare R2.

**Stack:** Node.js · TypeScript (ESM) · Express 5 · Prisma 7 (PostgreSQL via `@prisma/adapter-pg`) · Zod · Passport (Google OAuth2) · Nodemailer · Cloudflare R2 (S3 SDK) · Swagger UI · deployed on Vercel.

---

## Getting started

### Prerequisites

- Node.js 18+ (see `engines` in `package.json`)
- A PostgreSQL database
- A Cloudflare R2 bucket, SMTP credentials, and a Google OAuth2 client (all required at startup; see below)

### Setup

```bash
npm install                      # also runs `prisma generate` (postinstall)
cp .env.example .env             # or create .env by hand, see "Environment variables"
npx prisma migrate dev           # apply migrations to your database
npm run seed                     # seed roles, permissions, and sample users
npm run dev                      # start the dev server with hot reload
```

The server runs at `http://localhost:8000` (or `PORT`), and the API docs are at `http://localhost:8000/api-docs`.

### Environment variables

Every variable below is validated with Zod in [src/config/env.ts](src/config/env.ts). If any required value is missing, the app fails on startup.

| Variable | Description |
|---|---|
| `PORT` | Server port (default `8000`) |
| `NODE_ENV` | `development` / `production`. In production the server does not call `listen()` (Vercel), and cookies are `secure` + `sameSite=none` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signs access tokens |
| `JWT_REFRESH_SECRET` | Signs refresh tokens |
| `JWT_VERIFY_SECRET` | Signs email-verification tokens |
| `SESSION_SECRET` | express-session secret (only used for the OAuth handshake) |
| `CLIENT_URL` | Frontend (web/mobile) URL, used for CORS and redirects |
| `FRONTEND_ADMIN_URL` | Admin frontend URL, used for CORS and redirects |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Outgoing mail (verification, password reset) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 object storage |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL` | Google OAuth2 login |
| `VERCEL_URL` | Optional; set automatically by Vercel |

> Allowed CORS origins are set in [src/index.ts](src/index.ts): localhost:3000/3001, `CLIENT_URL`, `FRONTEND_ADMIN_URL`, and the deployed Vercel frontends. Add new frontends there.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Runs `src/index.ts` with `tsx watch` |
| `npm run build` | Regenerates Swagger docs, runs `prisma generate`, and compiles to `dist/` |
| `npm start` | Runs the compiled build (`dist/index.js`) |
| `npm run docs` | Regenerates [src/docs/swagger_output.json](src/docs/swagger_output.json) from the routes |
| `npm run seed` | Seeds roles, permissions, role→permission links, and sample users |
| `npm run seed:update` | **Deletes all role-permission links** and rebuilds them from `permission.config.ts`. Users are kept |
| `npm test` | Runs Jest (not configured for TypeScript yet) |
| `npm run test:unit` | Runs `src/**/*.test.ts` with the Node test runner via `tsx` |

---

## Project structure

```
src/
├── index.ts              # Express app: CORS, session, passport, routes, error handler
├── config/               # env validation, mailer, passport (Google OAuth)
├── routes/               # One router per resource, mounted in index.route.ts
├── modules/<resource>/   # controller / service / validation for each resource
├── middleware/           # auth (JWT + RBAC), Zod validation, errors
├── lib/                  # Prisma client, R2 client, and presigned URL helpers
├── types/                # Shared TypeScript types per resource
├── utils/                # ApiResponse, ApiError, asyncHandler, cookies, email tokens
└── docs/                 # swagger-autogen config and Swagger UI route
prisma/
├── schema.prisma         # Data model
├── migrations/           # SQL migrations
└── seeds/                # Role/permission seeders and permission.config.ts
```

To add a new resource, follow the existing pattern: `src/types/x.types.ts`, then `src/modules/x/{x.controller,x.service,x.validation}.ts`, then `src/routes/x.route.ts`. Register the router in [src/routes/index.route.ts](src/routes/index.route.ts) and add a Swagger tag in [src/docs/swagger.ts](src/docs/swagger.ts).

---

## API overview

All routes are under `/api`. `GET /` returns a health/status payload.

| Base path | Resource |
|---|---|
| `/api/auth` | Register, login, refresh, logout, email verification, password reset, Google OAuth |
| `/api/users` | User management |
| `/api/investors`, `/api/investor-documents` | Investors and their documents |
| `/api/companies`, `/api/company-documents` | Companies and their documents |
| `/api/projects`, `/api/project-documents` | Projects and their documents |
| `/api/project-investments`, `/api/receipt-documents` | Investments in projects and their payment receipts |
| `/api/project-reportings`, `/api/project-reporting-media` | Project progress reports and attached media |
| `/api/project-settlements` | Project profit settlement: preview, create, update, approve/reject (see below) |
| `/api/investor-settlements` | Per-investor settlement results (read-only; investors see only their own approved ones) |
| `/api/activity-logs` | Audit trail |
| `/api/permissions` | Permission listing and role mapping |

Interactive docs: **`/api-docs`**. After you change routes, run `npm run docs` (the build also runs it).

**Response shape:** success responses are `{ success: true, data, meta? }` (see [src/utils/apiResponse.ts](src/utils/apiResponse.ts)). Errors are `{ success: false, message }`.

### Authentication and authorization

- Login sets httpOnly cookies (`access_token` plus a refresh token). Clients must send requests with credentials (`credentials: "include"` / `withCredentials: true`).
- `POST /api/auth/login` is rate-limited. Only failed attempts count: 5 per IP+email and 20 per IP in 15 minutes, after which requests get `429` ([rateLimit.middleware.ts](src/middleware/rateLimit.middleware.ts)).
- Roles: `superadmin`, `admin`, `bod`, `investor`, `user`.
- Permissions use the `resource:action:scope` format (for example `roles:read:any`) and are defined in [prisma/seeds/permission.config.ts](prisma/seeds/permission.config.ts), along with the default mapping from roles to permissions.
- Protect routes with `authMiddleware`, `requirePermission([...])`, `requireRole([...])`, or `requireRoleAndPermission(...)`. See the [Auth Middleware Guide](src/middleware/AUTH_MIDDLEWARE_GUIDE.md).

**To add a permission:** add it to `CANONICAL_PERMISSIONS` and `CANONICAL_ROLE_PERMISSIONS` in `permission.config.ts`, then run `npm run seed:update`.

### Settlements

The backend is the only place settlement formulas run ([settlement.calculator.ts](src/modules/projectSettlement/settlement.calculator.ts)). Clients send only the inputs: `total_capital`, `sales_amount`, `other_cost`, the four `*_pct` values, and optional per-investor `compensation_pct`. Every derived field is computed and stored by the backend.

- Each investor's `principal_amount` is the sum of that investor's `ProjectInvestment.amount` on the project.
- Percentages are stored on a 0–100 scale. `applicant + koaci` and `koaci_portion + investor_portion` must each add up to 100.
- `POST /preview` runs the same calculation without saving anything, for live form previews. `POST /` saves the project settlement and all investor settlements in one transaction.
- Responses include `warnings[]` for these cases: capital mismatch, net loss, negative Koaci profit, and no investors.
- Workflow: admin creates → `review` → bod/superadmin approves or rejects. After a reject, admin can edit, which sets the status back to `review`. An approved settlement is locked and cannot be edited or deleted.

### File uploads

Files never pass through the backend. Uploads go straight to R2 in three steps:

1. `POST .../presign` sends file metadata and receives `{ uploadUrl, objectKey, expiresIn }`.
2. `PUT uploadUrl` sends the raw file, with the **same `Content-Type`** that was presigned.
3. `POST ...` confirms the upload. The backend verifies the object with HeadObject and then creates the DB record.

Limits: 100 MB for documents and 300 MB for media. See [frontend-upload-guide.md](frontend-upload-guide.md) for the full flow and client helpers.

---

## Database

The schema is in [prisma/schema.prisma](prisma/schema.prisma). Core models: `User`, `Role`, `Permission`, `RolePermission`, `ActivityLog`, `Investor`, `Company`, `Project`, `ProjectInvestment`, `ProjectReporting`, `ProjectSettlement`, and `InvestorSettlement`, plus a document/media model for each.

```bash
npx prisma migrate dev --name <change>   # create and apply a migration after editing the schema
npx prisma migrate deploy                # apply pending migrations (production)
npx prisma studio                        # browse data
```

### Seeded accounts

`npm run seed` creates sample users for each role (for example `superadmin@koaci.id`, `bod@koaci.id`) with the password `password123`. The full list is in [prisma/seeds/role-permission.seed.ts](prisma/seeds/role-permission.seed.ts). **Do not run the seed against production without changing these passwords.**

---

## Deployment (Vercel)

The app exports the Express `app` as the default export, and Vercel runs `npm run vercel-build`. Before you deploy:

- Add every variable from the table above in Vercel → Settings → Environment Variables (Production and Preview), with `NODE_ENV=production`.
- Run `npx prisma migrate deploy` against the production database.
- The request body limit on Vercel is about 4.5 MB, which is why uploads use presigned URLs.

For CORS troubleshooting, see [vercel-env-setup.md](vercel-env-setup.md).

---

## Further docs

- [Auth API](src/modules/auth/AUTH_API_DOCS.md)
- [User API](src/modules/user/USER_API_DOCS.md)
- [Auth Middleware Guide](src/middleware/AUTH_MIDDLEWARE_GUIDE.md)
- [Frontend Upload Guide](frontend-upload-guide.md)
- [Frontend Settlement Guide](frontend-settlement-guide.md)
- [Investor document permissions](prisma/seeds/investor-document-permissions.md)
