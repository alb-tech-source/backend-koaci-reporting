# Panduan Upload File untuk Frontend (Direct ke Cloudflare R2)

> **BREAKING CHANGE** — Semua endpoint upload tidak lagi menerima `multipart/form-data`.
> File tidak lagi dikirim ke backend; frontend mengunggah **langsung ke Cloudflare R2**
> menggunakan presigned URL yang diterbitkan backend. Backend hanya memvalidasi dan
> mencatat metadata ke database.

## Daftar Isi

- [Mengapa Berubah](#mengapa-berubah)
- [Alur Upload 3 Langkah](#alur-upload-3-langkah)
- [Fungsi Helper Reusable](#fungsi-helper-reusable)
- [Detail Endpoint per Modul](#detail-endpoint-per-modul)
- [Penanganan Error](#penanganan-error)
- [Prasyarat CORS R2](#prasyarat-cors-r2)

---

## Mengapa Berubah

| | Lama (multipart) | Baru (presigned URL) |
|---|---|---|
| Jalur file | Browser → Backend → R2 | Browser → R2 (langsung) |
| RAM backend | File di-buffer penuh di memori | 0 (tidak tersentuh) |
| Batas ukuran efektif | ~4.5MB di produksi (limit body Vercel) | 100MB dokumen / 300MB media |
| Kecepatan upload | 2× transfer (naik + turun) | 1× transfer |

## Alur Upload 3 Langkah

```
┌──────────┐  1. POST /presign     ┌──────────┐
│ Frontend │ ─────────────────────►│  Backend │  validasi permission, parent,
│          │ ◄─────────────────────│          │  mime whitelist, size limit
│          │  { uploadUrl, objectKey, expiresIn }
│          │
│          │  2. PUT uploadUrl      ┌──────────┐
│          │ ─────────────────────►│    R2    │  file masuk langsung ke storage
│          │   (Content-Type wajib sama dengan saat presign)
│          │
│          │  3. POST / (confirm)  ┌──────────┐
│          │ ─────────────────────►│  Backend │  verifikasi HeadObject →
│          │ ◄─────────────────────│          │  buat record DB
└──────────┘  201 Created
```

**Poin penting:**

1. **Langkah 1 — presign**: kirim metadata file (bukan file-nya) ke backend. Respons
   berisi `uploadUrl` (presigned PUT) dan `objectKey`.
2. **Langkah 2 — PUT ke R2**: kirim file mentah ke `uploadUrl` dengan header
   `Content-Type` yang **persis sama** dengan `mime_type` saat presign. URL bersifat
   di-sign — Content-Type yang beda akan ditolak R2 dengan `403 SignatureDoesNotMatch`.
   Request ini tidak butuh cookie auth (autentikasinya ada di tanda tangan URL).
3. **Langkah 3 — confirm**: beri tahu backend bahwa upload selesai. Backend memverifikasi
   ulang keberadaan, ukuran, dan tipe file langsung dari storage (HeadObject), lalu
   membuat record database. `file_size_bytes` yang tersimpan adalah ukuran aktual dari
   storage, bukan klaim client.

## Fungsi Helper Reusable

```typescript
// uploadFile.ts — helper upload direct-to-R2 untuk semua modul

interface PresignPayloadBase {
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
}

interface ConfirmPayloadBase {
  object_key: string;
  mime_type: string;
  storage_provider?: "cloudflare" | "aws" | "tencent";
}

/**
 * Alur lengkap: presign → PUT ke R2 → confirm.
 *
 * @param presignUrl  endpoint presign modul, mis. "/api/company-documents/presign"
 * @param confirmUrl  endpoint confirm modul, mis. "/api/company-documents"
 * @param presignPayload  metadata file + id resource induk
 * @param confirmPayload  metadata record DB + id resource induk
 * @param file        File mentah dari <input type="file">
 * @param fetchApi    fetch yang sudah menyertakan cookie auth (mis. wrapper axios/fetch Anda)
 */
export async function uploadFile<R>(
  presignUrl: string,
  confirmUrl: string,
  presignPayload: PresignPayloadBase & Record<string, unknown>,
  confirmPayload: ConfirmPayloadBase & Record<string, unknown>,
  file: File,
  fetchApi: typeof fetch = fetch,
): Promise<R> {
  // 1. Presign
  const presignRes = await fetchApi(presignUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...presignPayload,
      file_name: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
    }),
  });
  if (!presignRes.ok) throw await toError(presignRes, "Gagal membuat URL upload");
  const { data: presign } = await presignRes.json();

  // 2. PUT langsung ke R2 — TANPA credentials/cookie
  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type }, // WAJIB sama dengan mime_type saat presign
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(
      `Gagal mengunggah file ke storage (HTTP ${putRes.status}). ` +
        "Pastikan Content-Type sama dengan saat presign dan CORS R2 sudah dikonfigurasi.",
    );
  }

  // 3. Confirm — buat record DB
  const confirmRes = await fetchApi(confirmUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...confirmPayload,
      object_key: presign.objectKey,
      mime_type: file.type,
    }),
  });
  if (!confirmRes.ok) throw await toError(confirmRes, "Gagal menyimpan data upload");
  const { data } = await confirmRes.json();
  return data as R;
}

async function toError(res: Response, fallback: string): Promise<Error> {
  try {
    const body = await res.json();
    return new Error(body.message ?? fallback);
  } catch {
    return new Error(fallback);
  }
}
```

### Contoh Pemakaian

```typescript
// Upload company document — respons confirm: { document, message }
const { document } = await uploadFile(
  "/api/company-documents/presign",
  "/api/company-documents",
  { company_id: companyId },
  { company_id: companyId, document_name: file.name, document_type: "Akta Pendirian" },
  file,
);

// Upload media laporan project — respons confirm: { media, message }
const { media } = await uploadFile(
  "/api/project-reporting-media/presign",
  "/api/project-reporting-media",
  { project_reporting_id: reportingId },
  { project_reporting_id: reportingId, media_type: "photo", media_name: file.name },
  file,
);
```

> **Progress bar**: karena PUT ke R2 adalah request biasa, gunakan `XMLHttpRequest`
> (event `upload.onprogress`) atau `fetch` dengan `ReadableStream` untuk menampilkan
> progress bar — hal yang tidak mungkin dilakukan backend sebelumnya.

## Detail Endpoint per Modul

Semua endpoint butuh cookie auth (`cookieAuth`) dan permission `upload` modul terkait.

### 1. Investor Document — `/api/investor-documents`

| | Field | Catatan |
|---|---|---|
| Presign | `investor_id`, `file_name`, `mime_type`, `file_size_bytes` | |
| Confirm | `investor_id`, `document_name`, `object_key`, `mime_type`, `storage_provider?` | `document_name` 2–100 karakter |

### 2. Company Document — `/api/company-documents`

| | Field | Catatan |
|---|---|---|
| Presign | `company_id`, `file_name`, `mime_type`, `file_size_bytes` | |
| Confirm | `company_id`, `document_type?`, `document_name`, `object_key`, `mime_type`, `storage_provider?` | |

### 3. Project Document — `/api/project-documents`

| | Field | Catatan |
|---|---|---|
| Presign | `project_id`, `file_name`, `mime_type`, `file_size_bytes` | |
| Confirm | `project_id`, `document_type?`, `document_name`, `object_key`, `mime_type`, `storage_provider?` | |

### 4. Receipt Document — `/api/receipt-documents`

| | Field | Catatan |
|---|---|---|
| Presign | `project_investment_id`, `file_name`, `mime_type`, `file_size_bytes` | **409** jika investment sudah punya receipt |
| Confirm | `project_investment_id`, `receipt_name`, `object_key`, `mime_type`, `storage_provider?` | 1 receipt per investment (relasi 1-1) |

### 5. Project Reporting Media — `/api/project-reporting-media`

| | Field | Catatan |
|---|---|---|
| Presign | `project_reporting_id`, `file_name`, `mime_type`, `file_size_bytes` | Limit 300MB, URL 30 menit |
| Confirm | `project_reporting_id`, `media_type`, `media_name`, `object_key`, `mime_type`, `storage_provider?` | `media_type`: `photo` \| `video` \| `document` |

### Respons Presign (seragam untuk semua modul)

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://<account>.r2.cloudflarestorage.com/<bucket>/...",
    "objectKey": "company/<uuid>/<uuid>-akta.pdf",
    "expiresIn": 900,
    "message": "URL upload berhasil dibuat"
  }
}
```

### Batas Ukuran & Tipe File

| Modul | Maksimal | Masa berlaku URL | Tipe file |
|---|---|---|---|
| 4 modul dokumen | 100 MB | 15 menit | PDF, JPEG, PNG, DOC, DOCX |
| Reporting media | 300 MB | 30 menit | + MP4, MOV, AVI, WebM |

## Penanganan Error

| Kondisi | Kapan | Bentuk |
|---|---|---|
| `415` | Presign: tipe file di luar whitelist | JSON backend |
| `413` | Presign: klaim size > limit, **atau** confirm: ukuran aktual > limit | JSON backend |
| `404` "File belum ditemukan di storage..." | Confirm sebelum PUT berhasil | JSON backend |
| `400` "object_key tidak valid..." | Confirm dengan key milik resource lain | JSON backend |
| `400` "mime_type tidak sesuai..." | Content-Type aktual di storage ≠ klaim (diverifikasi via HeadObject saat confirm) | JSON backend |
| `409` | Receipt: investment sudah punya receipt | JSON backend |
| `401`/`403` izin | Presign/confirm tanpa permission upload | JSON backend |
| PUT gagal jaringan/CORS | Browser memblokir karena CORS R2 belum diset | Error `TypeError: Failed to fetch` |

> **Catatan Content-Type**: kirim `Content-Type` yang sama dengan `mime_type` saat
> presign di request PUT — jika berbeda, upload tetap berhasil di R2 tetapi akan
> ditolak dengan 400 saat confirm karena mismatch tipe file.

**Strategi retry yang aman:**

- Gagal di langkah 1 atau 2 → ulang dari langkah 1 (presign ulang; URL lama bisa kedaluwarsa).
- Gagal di langkah 3 karena jaringan → **cukup ulang langkah 3 saja** dengan `object_key`
  yang sama (object sudah ada di R2). Aman untuk semua modul kecuali receipt yang sudah
  terlanjur tercatat (409).
- URL kedaluwarsa (15/30 menit) → presign ulang dan PUT ulang.

## Prasyarat CORS R2

Karena browser kini berkomunikasi langsung dengan R2, bucket **wajib** punya CORS policy.
Atur di dashboard Cloudflare: **R2 → bucket → Settings → CORS policy**:

```json
[
  {
    "AllowedOrigins": ["https://app.andadomain.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Sesuaikan `AllowedOrigins` dengan domain frontend. Tanpa ini, PUT dari browser gagal
dengan `TypeError: Failed to fetch` (curl/Postman tidak terpengaruh — CORS hanya
berlaku di browser).
