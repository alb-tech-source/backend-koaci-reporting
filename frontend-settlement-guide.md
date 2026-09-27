# Panduan Implementasi Settlement untuk Frontend

Dokumen ini menjelaskan cara frontend mengimplementasikan fitur **settlement** (pembagian hasil project), yang terdiri dari dua bagian:

- **Project Settlement**: hasil dan pembagian keuntungan satu project, yaitu porsi pemohon, porsi Koaci, dan porsi investor.
- **Investor Settlement**: bagian keuntungan tiap investor pada project tersebut, yang dibuat otomatis oleh backend.

Detail teknis setiap endpoint juga tersedia di Swagger: `/api-docs`, pada tag **Project Settlement** dan **Investor Settlement**.

## Daftar Isi

1. [Prinsip Utama](#prinsip-utama)
2. [Peran & Hak Akses](#peran--hak-akses)
3. [Alur Status](#alur-status)
4. [Daftar Endpoint](#daftar-endpoint)
5. [Field: Input vs Hasil Hitung](#field-input-vs-hasil-hitung)
6. [Flow Admin: Membuat Settlement](#flow-admin-membuat-settlement)
7. [Flow Admin: Mengedit Settlement](#flow-admin-mengedit-settlement)
8. [Flow BOD / Superadmin: Approval](#flow-bod--superadmin-approval)
9. [Flow Investor: Melihat Hasil](#flow-investor-melihat-hasil)
10. [Warnings](#warnings)
11. [Penanganan Error](#penanganan-error)
12. [Rumus (Referensi Tampilan)](#rumus-referensi-tampilan)
13. [Type & Helper TypeScript](#type--helper-typescript)
14. [Checklist Implementasi](#checklist-implementasi)

---

## Prinsip Utama

1. **Semua perhitungan dilakukan di backend.** Frontend hanya mengirim angka input. Jangan menghitung `gross_margin`, `*_amount`, `total_profit`, dan field turunan lain di frontend untuk dikirim ke backend. Backend akan **mengabaikan** field tersebut.
2. **Untuk live preview, gunakan `POST /api/project-settlements/preview`.** Endpoint ini menjalankan rumus yang sama persis dengan saat menyimpan, tetapi tidak menyimpan apa pun.
3. **Satu request menyimpan semuanya.** `POST /api/project-settlements` menyimpan settlement project **beserta** settlement seluruh investor dalam satu transaksi. Tidak perlu request terpisah untuk setiap investor.
4. **Nilai uang dan persen dikirim sebagai string**, contohnya `"500000000"` dan `"33.3333"`, agar tidak terjadi error floating point. Backend juga menerima `number`, tetapi string lebih aman.
5. **Response juga mengembalikan angka sebagai string.** Nol di belakang koma tidak disertakan. Contohnya `"140000000"`, `"0.5"`, dan `"-60000000"`. Format tampilannya menjadi tugas frontend (lihat `formatRupiah` di bawah).
6. **Semua `*_pct` memakai satuan persen 0–100.** Artinya `40` = 40%, bukan `0.4`.

---

## Peran & Hak Akses

Permission user bisa dibaca dari `GET /api/auth/me`, di field `data.user.role.permissions` (array string). Tampilkan atau sembunyikan tombol berdasarkan **permission**, bukan nama role.

| Aksi UI | Permission | Role default |
|---|---|---|
| Form buat settlement + preview | `project_settlements:create:any` | admin, superadmin |
| Lihat daftar/detail settlement project | `project_settlements:read:any` | admin, bod, superadmin |
| Edit settlement | `project_settlements:update:any` | admin, superadmin |
| Hapus settlement | `project_settlements:delete:any` | admin, superadmin |
| Tombol **Approve** / **Reject** | `project_settlements:approve:any` | bod, superadmin |
| Lihat semua settlement investor | `investor_settlements:read:any` | admin, bod, superadmin |
| Investor melihat settlement miliknya | `investor_settlements:read:own` | investor |

> Admin **tidak** bisa meng-approve. Permission disimpan di dalam JWT, jadi setelah
> permission diubah, user perlu login ulang agar perubahan berlaku.

---

## Alur Status

```
                 admin: POST /                    bod/superadmin: PATCH /:id/approve
   (belum ada) ─────────────────────► review ─────────────────────────────────► approved 🔒
                                        ▲ │
             admin: PATCH /:id (edit)   │ │ bod/superadmin: PATCH /:id/reject
                                        │ ▼
                                      rejected
```

| Status project | Status investor | Bisa edit? | Bisa hapus? | Bisa approve/reject? | Terlihat oleh investor? |
|---|---|---|---|---|---|
| `review` | `pending` | ✅ | ✅ | ✅ | ❌ |
| `rejected` | `rejected` | ✅ (kembali ke `review`) | ✅ | ❌ | ❌ |
| `approved` | `approved` | ❌ terkunci | ❌ | ❌ | ✅ |

Beberapa aturan tambahan:

- Status investor settlement **selalu mengikuti** status project settlement. Tidak ada approval per investor.
- Setiap edit mengembalikan status ke `review`, sehingga settlement perlu di-approve ulang.
- Satu project hanya bisa punya **satu** settlement.

---

## Daftar Endpoint

Semua endpoint membutuhkan cookie auth, jadi setiap request harus dikirim dengan `credentials: "include"`.

### `/api/project-settlements`

| Method | Path | Fungsi |
|---|---|---|
| `POST` | `/preview` | Hitung tanpa menyimpan. Body sama dengan create |
| `POST` | `/` | Buat settlement (status `review`) |
| `GET` | `/` | List. Query: `page`, `limit`, `search` (project_key), `status`, `project_id` |
| `GET` | `/:settlementId` | Detail, termasuk `investorSettlement[]` |
| `PATCH` | `/:settlementId` | Edit (hanya status `review`/`rejected`) |
| `DELETE` | `/:settlementId` | Hapus (hanya status `review`/`rejected`) |
| `PATCH` | `/:settlementId/approve` | Approve (tanpa body) |
| `PATCH` | `/:settlementId/reject` | Reject (tanpa body) |

### `/api/investor-settlements` (read-only)

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` | List. Query: `page`, `limit`, `status`, `project_settlement_id`, `project_id`, `investor_id` |
| `GET` | `/:investorSettlementId` | Detail |

### Format response

Response sukses:

```json
{ "success": true, "data": ..., "meta": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 } }
```

`meta` hanya ada pada endpoint list.

Response error:

```json
{ "success": false, "message": "..." }
```

---

## Field: Input vs Hasil Hitung

### Field yang diisi admin (dikirim di body)

| Field | Wajib | Aturan |
|---|---|---|
| `project_id` | ✅ (hanya create) | UUID. Tidak bisa diubah saat edit |
| `profit_model` | ✅ | String, mis. `"jual beli"` atau `"bagi hasil pendapatan"` |
| `total_capital` | ✅ | > 0, maks. 2 desimal. **Diisi manual** oleh admin |
| `sales_amount` | ✅ | ≥ 0, maks. 2 desimal |
| `other_cost` | – (default `0`) | ≥ 0, maks. 2 desimal |
| `other_cost_description` | – (default `""`) | String |
| `applicant_share_pct` | ✅ | 0–100, maks. 4 desimal |
| `koaci_share_pct` | ✅ | `applicant_share_pct + koaci_share_pct` **harus = 100** |
| `koaci_portion_pct` | ✅ | 0–100, maks. 4 desimal |
| `investor_portion_pct` | ✅ | `koaci_portion_pct + investor_portion_pct` **harus = 100** |
| `investors` | – (default `[]`) | `[{ investor_id, compensation_pct }]`. `investor_id` tidak boleh duplikat |

Catatan untuk `investors`:
- `investors` **hanya** berisi kompensasi. Investor yang tidak dicantumkan dianggap `compensation_pct = 0`.
- Daftar investor dan besar modalnya (`principal_amount`) **tidak** dikirim oleh frontend. Backend mengambilnya otomatis dari data `ProjectInvestment` project tersebut.
- `investor_id` yang dicantumkan harus investor yang memang punya investasi di project itu. Jika tidak, backend mengembalikan 400.

### Field hasil hitung backend (jangan dikirim, cukup ditampilkan)

**Project settlement:** `gross_margin`, `net_profit_margin`, `applicant_share_amount`, `koaci_share_amount`, `investor_portion_amount`, `koaci_portion_amount`, `compensation_total`, `koaci_final_profit`.

**Investor settlement:** `principal_amount`, `modal_portion_pct`, `profit_share_amount`, `compensation_amount`, `total_profit`.

---

## Flow Admin: Membuat Settlement

```
┌──────────────┐ 1. pilih project        ┌───────────┐
│  Form admin  │ ──────────────────────► │           │
│              │ 2. isi input (debounce) │           │
│              │ ─ POST /preview ──────► │  Backend  │  hitung, TIDAK simpan
│              │ ◄── hasil + warnings ── │           │
│              │ 3. isi kompensasi       │           │
│              │    per investor → ulang preview     │
│              │ 4. klik Simpan          │           │
│              │ ─ POST / ─────────────► │           │  hitung ulang + simpan (1 transaksi)
│              │ ◄── 201 + warnings ──── │           │
└──────────────┘                         └───────────┘
```

**Langkah 1: Pilih project.** Tampilkan daftar project, lalu pilih satu. Jika project sudah punya settlement, `POST /` nanti akan mengembalikan `409`. Untuk mencegahnya lebih awal, cek dengan `GET /api/project-settlements?project_id=<id>`: jika `meta.total > 0`, arahkan admin ke halaman detail atau edit.

**Langkah 2: Isi input dan tampilkan preview.**
- Panggil `POST /preview` dengan debounce (sekitar 400 ms) setiap kali input berubah.
- Panggil preview **hanya jika form sudah valid di sisi client**: semua field wajib terisi dan kedua pasangan persen berjumlah 100. Jika belum valid, backend hanya akan mengembalikan 400.
- Pengecekan jumlah 100 di client hanya untuk UX, bukan perhitungan. Sebagai kemudahan, isi otomatis pasangannya: jika `applicant_share_pct` diisi 60, isi `koaci_share_pct` dengan 40.
- Tampilkan `warnings` jika ada (lihat [Warnings](#warnings)).

Contoh request preview:

```http
POST /api/project-settlements/preview
Content-Type: application/json

{
  "project_id": "8f1c...",
  "profit_model": "jual beli",
  "total_capital": "500000000",
  "sales_amount": "650000000",
  "other_cost": "10000000",
  "other_cost_description": "Biaya logistik",
  "applicant_share_pct": "60",
  "koaci_share_pct": "40",
  "koaci_portion_pct": "30",
  "investor_portion_pct": "70",
  "investors": []
}
```

Contoh response (dua investor: A modal 300 jt, B modal 200 jt):

```json
{
  "success": true,
  "data": {
    "projectSettlement": {
      "project_id": "8f1c...",
      "profit_model": "jual beli",
      "total_capital": "500000000",
      "sales_amount": "650000000",
      "other_cost": "10000000",
      "other_cost_description": "Biaya logistik",
      "applicant_share_pct": "60",
      "koaci_share_pct": "40",
      "koaci_portion_pct": "30",
      "investor_portion_pct": "70",
      "gross_margin": "150000000",
      "net_profit_margin": "140000000",
      "applicant_share_amount": "84000000",
      "koaci_share_amount": "56000000",
      "investor_portion_amount": "39200000",
      "koaci_portion_amount": "16800000",
      "compensation_total": "0",
      "koaci_final_profit": "16800000"
    },
    "investorSettlements": [
      {
        "investor_id": "inv-A",
        "principal_amount": "300000000",
        "modal_portion_pct": "60",
        "profit_share_amount": "23520000",
        "compensation_pct": "0",
        "compensation_amount": "0",
        "total_profit": "23520000"
      },
      {
        "investor_id": "inv-B",
        "principal_amount": "200000000",
        "modal_portion_pct": "40",
        "profit_share_amount": "15680000",
        "compensation_pct": "0",
        "compensation_amount": "0",
        "total_profit": "15680000"
      }
    ],
    "warnings": []
  }
}
```

**Langkah 3: Isi kompensasi per investor.**
- **Gunakan `investorSettlements` dari response preview sebagai sumber daftar investor**, bukan data yang dirakit sendiri di frontend. Daftar ini sudah berisi semua investor project beserta modalnya.
- Untuk menampilkan nama investor, panggil `GET /api/project-investments?project_id=<id>`, lalu cocokkan berdasarkan `investor_id`.
- Setiap baris investor diberi input `compensation_pct` (default 0). Jika ada yang berubah, kirim ulang preview dengan `investors: [{ investor_id, compensation_pct }]`.

Contoh setelah investor A diberi kompensasi 2%:

```json
"investors": [{ "investor_id": "inv-A", "compensation_pct": "2" }]
```

Hasilnya:
- Investor A mendapat `compensation_amount` 6.000.000 dan `total_profit` 29.520.000.
- `compensation_total` menjadi 6.000.000.
- `koaci_final_profit` menjadi 10.800.000.

**Langkah 4: Simpan.**
- Kirim `POST /api/project-settlements` dengan body yang **sama persis** dengan preview terakhir.
- Response `201`:

```json
{
  "success": true,
  "data": {
    "projectSettlement": { "...": "detail lengkap, sama seperti GET /:id" },
    "warnings": [],
    "message": "Settlement berhasil dibuat dan menunggu approval"
  }
}
```

- Setelah berhasil, arahkan ke halaman detail (`data.projectSettlement.project_settlement_id`).
- Jika `warnings` tidak kosong, sebaiknya minta konfirmasi admin **sebelum** klik Simpan, misalnya dengan dialog "Ada 1 peringatan, tetap simpan?". Warning tidak memblokir penyimpanan.

---

## Flow Admin: Mengedit Settlement

Edit hanya tersedia jika `status` adalah `review` atau `rejected`.

1. **Isi form awal dari detail.** Ambil `GET /api/project-settlements/:id`, lalu isi form dengan field input dan kompensasi dari `investorSettlement[].compensation_pct`.
2. **Tampilkan preview seperti saat membuat.** Pakai `POST /preview` dengan body **lengkap** (termasuk `project_id` dari detail). Preview selalu memakai data investasi **terbaru**, sehingga investor yang baru berinvestasi setelah settlement dibuat akan otomatis muncul.
3. **Simpan dengan `PATCH /api/project-settlements/:id`.**
   - Kirim field yang berubah saja, atau semua field. Keduanya boleh.
   - **Penting soal `investors`:** jika dikirim, daftar ini **menggantikan seluruh** kompensasi. Investor yang tidak dicantumkan akan menjadi 0%. Jika tidak dikirim, kompensasi lama dipertahankan.
   - Paling aman, selalu kirim `investors` lengkap sesuai isi form.
4. **Setelah berhasil,** status menjadi `review`. Tampilkan info bahwa settlement menunggu approval ulang.

Beberapa hal yang dilakukan backend otomatis saat edit:
- Menghitung ulang semua field, termasuk `principal_amount` dari data investasi terbaru.
- Menambah investor settlement untuk investor baru.
- Menghapus investor settlement untuk investor yang investasinya sudah dihapus.
- Mempertahankan `investor_settlement_id` untuk investor yang sudah ada.

**Hapus settlement:** `DELETE /:id`, hanya untuk status `review`/`rejected`. Tampilkan dialog konfirmasi sebelum menghapus.

---

## Flow BOD / Superadmin: Approval

1. **Tampilkan daftar yang menunggu approval.** Pakai `GET /api/project-settlements?status=review`. Bisa juga dijadikan badge atau counter dari `meta.total`.
2. **Tampilkan halaman detail.** Pakai `GET /api/project-settlements/:id`, lalu tampilkan:
   - ringkasan project,
   - rincian pembagian (pemohon / Koaci / investor),
   - tabel `investorSettlement` (nama investor dari `investor.user.firstname/lastname`),
   - siapa pembuatnya (`createdBy`).
3. **Tombol Approve/Reject** hanya muncul jika `status === "review"` dan user punya `project_settlements:approve:any`.
   - `PATCH /:id/approve` → status `approved`. `approvedBy` terisi dan data terkunci.
   - `PATCH /:id/reject` → status `rejected`. Admin bisa memperbaiki lalu mengajukan ulang.
   - Kedua endpoint tidak memerlukan body. Response berisi detail settlement terbaru.
   - Tidak ada kolom alasan penolakan. Sampaikan alasannya di luar sistem, atau lihat riwayatnya di Activity Log.
4. **Tampilkan dialog konfirmasi sebelum approve**, karena settlement yang sudah approved tidak bisa diubah atau dihapus.

---

## Flow Investor: Melihat Hasil

- Investor memakai `GET /api/investor-settlements` dan `GET /api/investor-settlements/:id`.
- Backend otomatis hanya mengembalikan settlement **milik investor tersebut** yang sudah **approved**. Frontend tidak perlu mengirim `investor_id`.
- Field `projectSettlement` untuk investor hanya berisi ringkasan:
  - `profit_model`, `total_capital`, `sales_amount`, `net_profit_margin`,
  - `investor_portion_pct`, `investor_portion_amount`, `status`,
  - `project` (termasuk `company`).

  Rincian porsi Koaci dan pemohon **tidak** dikirim.
- Field yang relevan untuk ditampilkan ke investor:

| Label UI | Field |
|---|---|
| Modal yang disetor | `principal_amount` |
| Porsi modal | `modal_portion_pct` (%) |
| Bagi hasil | `profit_share_amount` |
| Kompensasi | `compensation_amount` (`compensation_pct` %) |
| **Total diterima** | `total_profit` |

- Nilai bisa **negatif** jika project rugi. Tampilkan dengan jelas, misalnya dengan warna merah dan tanda minus.
- Jika list kosong, tampilkan pesan seperti "Belum ada settlement yang disetujui".

---

## Warnings

Preview, create, dan update mengembalikan `warnings: { code, message }[]`. Warning **tidak** menggagalkan request, tetapi sebaiknya ditampilkan ke admin.

| `code` | Arti | Saran UI |
|---|---|---|
| `CAPITAL_MISMATCH` | `total_capital` ≠ total investasi investor. Investor hanya menerima porsi sesuai modal yang benar-benar disetor | Alert kuning, dan tampilkan kedua angkanya |
| `NET_LOSS` | `net_profit_margin` negatif (project rugi). Semua porsi ikut negatif | Alert merah |
| `NEGATIVE_KOACI_FINAL_PROFIT` | Kompensasi investor melebihi porsi Koaci | Alert kuning |
| `NO_INVESTORS` | Project belum punya data investasi | Alert kuning, dan sarankan cek data investasi |

---

## Penanganan Error

Pesan error validasi berformat `field: pesan`, dengan beberapa error dipisah koma. Contoh:

`"koaci_share_pct: applicant_share_pct + koaci_share_pct harus berjumlah 100"`

Nama field di depan pesan bisa dipakai untuk menampilkan error di bawah input yang sesuai.

| Status | Pesan (contoh) | Kapan |
|---|---|---|
| `400` | `total_capital: total_capital harus lebih besar dari 0` | Validasi input |
| `400` | `...harus berjumlah 100` | Pasangan persen tidak berjumlah 100 |
| `400` | `investors: investor_id tidak boleh duplikat` | Investor dicantumkan dua kali |
| `400` | `Investor berikut tidak memiliki investasi pada project ini: <id>` | `investor_id` bukan investor project tersebut |
| `400` | `Minimal satu field harus diisi untuk update` | PATCH dengan body kosong |
| `401` | `Token tidak ditemukan` / `Token tidak valid atau sudah kadaluarsa` | Belum login atau token habis. Lakukan refresh token |
| `403` | `Anda tidak memiliki izin: project_settlements:approve:any` | Tidak punya permission |
| `404` | `Project tidak ditemukan` / `Settlement tidak ditemukan` | ID salah |
| `404` | `Profil investor tidak ditemukan` | Investor belum melengkapi profil |
| `409` | `Project ini sudah memiliki settlement` | Create untuk project yang sudah punya settlement |
| `409` | `Settlement yang sudah disetujui tidak dapat diubah` / `...dihapus` | Edit/hapus settlement yang sudah approved |
| `409` | `Settlement berstatus approved; hanya settlement berstatus review yang dapat di-approve` | Approve/reject ganda, misalnya dua BOD menekan tombol bersamaan |

Untuk `409` pada approve, edit, atau hapus, **muat ulang detail** settlement, karena kemungkinan statusnya sudah diubah oleh user lain.

---

## Rumus (Referensi Tampilan)

Bagian ini hanya untuk tooltip atau penjelasan di UI. **Jangan pakai rumus ini untuk menghasilkan data yang dikirim ke backend.**

```
gross_margin            = sales_amount − total_capital
net_profit_margin       = gross_margin − other_cost
applicant_share_amount  = net_profit_margin × applicant_share_pct / 100
koaci_share_amount      = net_profit_margin − applicant_share_amount
investor_portion_amount = koaci_share_amount × investor_portion_pct / 100
koaci_portion_amount    = koaci_share_amount − investor_portion_amount

Per investor:
principal_amount        = Σ amount ProjectInvestment investor pada project
modal_portion_pct       = principal_amount / total_capital × 100
profit_share_amount     = investor_portion_amount × modal_portion_pct / 100
compensation_amount     = principal_amount × compensation_pct / 100
total_profit            = profit_share_amount + compensation_amount

compensation_total      = Σ compensation_amount
koaci_final_profit      = koaci_portion_amount − compensation_total
```

Aturan pembulatan: nominal dibulatkan ke 2 desimal. Selisih pembulatan diserap porsi Koaci, dan `profit_share_amount` antar investor dibagi sedemikian rupa sehingga jumlahnya selalu tepat, tanpa selisih sen. Karena itu, hasil backend bisa berbeda beberapa sen dari perhitungan manual. **Selalu tampilkan angka dari backend.**

---

## Type & Helper TypeScript

```typescript
// settlement.types.ts

/** Angka desimal dari backend, selalu string (mis. "140000000", "0.5", "-60000000"). */
export type DecimalString = string;

export type ProjectSettlementStatus = "review" | "approved" | "rejected";
export type InvestorSettlementStatus = "pending" | "approved" | "rejected";

export interface SettlementWarning {
  code:
    | "CAPITAL_MISMATCH"
    | "NET_LOSS"
    | "NEGATIVE_KOACI_FINAL_PROFIT"
    | "NO_INVESTORS";
  message: string;
}

/** Body untuk POST /preview dan POST / */
export interface SettlementFormPayload {
  project_id: string;
  profit_model: string;
  total_capital: DecimalString;
  sales_amount: DecimalString;
  other_cost?: DecimalString;
  other_cost_description?: string;
  applicant_share_pct: DecimalString;
  koaci_share_pct: DecimalString;
  koaci_portion_pct: DecimalString;
  investor_portion_pct: DecimalString;
  investors?: { investor_id: string; compensation_pct: DecimalString }[];
}

/** Body untuk PATCH /:id — semua opsional, project_id tidak boleh. */
export type SettlementUpdatePayload = Partial<Omit<SettlementFormPayload, "project_id">>;

export interface InvestorSettlementCalc {
  investor_id: string;
  principal_amount: DecimalString;
  modal_portion_pct: DecimalString;
  profit_share_amount: DecimalString;
  compensation_pct: DecimalString;
  compensation_amount: DecimalString;
  total_profit: DecimalString;
}

export interface ProjectSettlementCalc {
  gross_margin: DecimalString;
  net_profit_margin: DecimalString;
  applicant_share_amount: DecimalString;
  koaci_share_amount: DecimalString;
  investor_portion_amount: DecimalString;
  koaci_portion_amount: DecimalString;
  compensation_total: DecimalString;
  koaci_final_profit: DecimalString;
}

export interface SettlementPreview {
  projectSettlement: Required<Omit<SettlementFormPayload, "investors">> & ProjectSettlementCalc;
  investorSettlements: InvestorSettlementCalc[];
  warnings: SettlementWarning[];
}

interface UserSummary {
  user_id: string;
  firstname: string | null;
  lastname: string | null;
  email: string;
}

export interface InvestorSettlement extends InvestorSettlementCalc {
  investor_settlement_id: string;
  project_settlement_id: string;
  status: InvestorSettlementStatus;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  investor: { investor_id: string; user: UserSummary; [key: string]: unknown };
}

export interface ProjectSettlement
  extends Required<Omit<SettlementFormPayload, "investors">>,
    ProjectSettlementCalc {
  project_settlement_id: string;
  status: ProjectSettlementStatus;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  project: { project_id: string; project_key: string; [key: string]: unknown };
  createdBy: UserSummary;
  approvedBy: UserSummary | null;
  investorSettlement: InvestorSettlement[]; // ada di GET /:id, tidak ada di list
}
```

```typescript
// settlement.api.ts
import type {
  ProjectSettlement,
  SettlementFormPayload,
  SettlementPreview,
  SettlementUpdatePayload,
  SettlementWarning,
} from "./settlement.types";

const BASE = `${import.meta.env.VITE_API_URL}/api/project-settlements`;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include", // wajib: auth via httpOnly cookie
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.message ?? "Terjadi kesalahan");
  return body.data as T;
}

type MutationResult = {
  projectSettlement: ProjectSettlement;
  warnings: SettlementWarning[];
  message: string;
};

export const settlementApi = {
  preview: (payload: SettlementFormPayload) =>
    request<SettlementPreview>(`${BASE}/preview`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  create: (payload: SettlementFormPayload) =>
    request<MutationResult>(BASE, { method: "POST", body: JSON.stringify(payload) }),

  getById: (id: string) => request<ProjectSettlement>(`${BASE}/${id}`),

  update: (id: string, payload: SettlementUpdatePayload) =>
    request<MutationResult>(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id: string) => request<string>(`${BASE}/${id}`, { method: "DELETE" }),

  approve: (id: string) =>
    request<{ projectSettlement: ProjectSettlement; message: string }>(
      `${BASE}/${id}/approve`,
      { method: "PATCH" },
    ),

  reject: (id: string) =>
    request<{ projectSettlement: ProjectSettlement; message: string }>(
      `${BASE}/${id}/reject`,
      { method: "PATCH" },
    ),
};
```

```typescript
// settlement.utils.ts
import { settlementApi, type ApiError } from "./settlement.api";
import type { SettlementFormPayload, SettlementPreview } from "./settlement.types";

/** Validasi ringan di client HANYA untuk UX (menentukan kapan preview dipanggil). */
export function isPreviewReady(p: Partial<SettlementFormPayload>): boolean {
  const filled =
    p.project_id && p.profit_model && p.total_capital && p.sales_amount &&
    p.applicant_share_pct && p.koaci_share_pct &&
    p.koaci_portion_pct && p.investor_portion_pct;
  if (!filled) return false;
  // Bandingkan dalam satuan 1/10000 agar bebas error floating point (maks. 4 desimal).
  const units = (v: string) => Math.round(Number(v) * 10_000);
  return (
    units(p.applicant_share_pct!) + units(p.koaci_share_pct!) === 1_000_000 &&
    units(p.koaci_portion_pct!) + units(p.investor_portion_pct!) === 1_000_000
  );
}

/** Isi otomatis pasangan persen: complement("60") -> "40". */
export const complementPct = (v: string) =>
  String((1_000_000 - Math.round(Number(v) * 10_000)) / 10_000);

/** Format DecimalString ke Rupiah untuk tampilan. */
export const formatRupiah = (v: string | null | undefined) =>
  v == null
    ? "-"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(v));

export const formatPct = (v: string) =>
  `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(Number(v))}%`;

/** Debounce preview + abaikan response yang sudah basi (race condition). */
export function createPreviewRunner(
  onResult: (r: SettlementPreview) => void,
  onError: (e: ApiError) => void,
  delay = 400,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest = 0;
  return (payload: SettlementFormPayload) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const id = ++latest;
      try {
        const result = await settlementApi.preview(payload);
        if (id === latest) onResult(result);
      } catch (e) {
        if (id === latest) onError(e as ApiError);
      }
    }, delay);
  };
}
```

> `Number()` pada `formatRupiah` aman untuk nominal hingga sekitar Rp 9.000 triliun.
> Gunakan hanya untuk **tampilan**, jangan untuk menghitung nilai yang akan dikirim.

---

## Checklist Implementasi

**Admin: form create & edit**
- [ ] Form hanya berisi field input. Field hasil hitung ditampilkan read-only dari response preview
- [ ] Preview di-debounce dan hanya dipanggil jika `isPreviewReady` bernilai true
- [ ] Response preview yang sudah basi diabaikan
- [ ] Pasangan persen terisi otomatis (60 → 40)
- [ ] Daftar investor dan input kompensasi berasal dari `investorSettlements` hasil preview
- [ ] Warnings ditampilkan, dengan konfirmasi sebelum simpan jika ada warning
- [ ] Body create/update sama dengan preview terakhir, dan `investors` selalu dikirim lengkap saat edit
- [ ] Tombol Edit/Hapus disembunyikan jika `status === "approved"`
- [ ] Setelah edit, tampil info bahwa settlement menunggu approval ulang

**BOD / Superadmin**
- [ ] Ada list settlement dengan filter `status=review`
- [ ] Tombol Approve/Reject hanya muncul untuk `status === "review"` dan user yang punya permission `approve`
- [ ] Ada dialog konfirmasi sebelum approve
- [ ] Jika muncul 409, detail dimuat ulang

**Investor**
- [ ] Tampilan memakai `/api/investor-settlements` tanpa mengirim `investor_id`
- [ ] Nilai negatif ditampilkan dengan jelas
- [ ] Tersedia tampilan kosong ("Belum ada settlement yang disetujui")

**Umum**
- [ ] Semua request memakai `credentials: "include"`
- [ ] Angka dikirim sebagai string dan diformat hanya untuk tampilan
- [ ] Error 400 ditampilkan per field berdasarkan prefiks `field:`
