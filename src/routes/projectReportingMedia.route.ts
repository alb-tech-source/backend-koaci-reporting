import { Router } from "express";
import { projectReportingMediaController } from "../modules/projectReportingMedia/projectReportingMedia.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  presignProjectReportingMediaSchema,
  createProjectReportingMediaBodySchema,
  updateProjectReportingMediaSchema,
  listProjectReportingMediaQuerySchema,
  projectReportingMediaIdParamSchema,
  projectReportingMediaReportingIdParamSchema,
} from "../modules/projectReportingMedia/projectReportingMedia.validation.js";

const router = Router();

router.get(
  "/reporting/:reportingId",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'List media by project reporting'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['reportingId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['media_type'] = { in: 'query', schema: { type: 'string', enum: ['photo', 'video', 'document'] } }
    #swagger.parameters['search'] = { in: 'query', type: 'string' }
    #swagger.responses[200] = { description: 'Project reporting media list', schema: { $ref: '#/components/schemas/ListProjectReportingMediaResponse' } }
  */
  authMiddleware, authorize("project_reporting_media", "read", ["any"]),
  validateParams(projectReportingMediaReportingIdParamSchema), validateQuery(listProjectReportingMediaQuerySchema),
  projectReportingMediaController.listByReporting,
);

router.get(
  "/own",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Get project reporting media milik sendiri (login sebagai investor)'
    #swagger.description = 'Mengambil semua media dari laporan project yang diinvestasi oleh investor yang sedang login.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.responses[200] = { description: 'Daftar media laporan project yang terjalin dengan investor', schema: { type: 'array', items: { $ref: '#/components/schemas/ProjectReportingMediaResponse' } } }
    #swagger.responses[404] = { description: 'Investor tidak ditemukan' }
  */
  authMiddleware, authorize("project_reporting_media", "read", ["own"]),
  projectReportingMediaController.getByUser,
);

router.get(
  "/own/:mediaId/download",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Generate media download URL milik sendiri'
    #swagger.description = 'Membuat presigned URL untuk media laporan dari project yang diinvestasi investor yang sedang login. Ditolak (404) jika media bukan milik project yang terjalin.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['mediaId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Presigned download URL', schema: { $ref: '#/components/schemas/ProjectReportingMediaDownloadUrlResponse' } }
    #swagger.responses[404] = { description: 'Media tidak ditemukan atau bukan milik project yang Anda ikuti' }
  */
  authMiddleware, authorize("project_reporting_media", "download", ["own"]),
  validateParams(projectReportingMediaIdParamSchema), projectReportingMediaController.downloadByUser,
);

router.get(
  "/:mediaId/download",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Generate media download URL'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['mediaId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Presigned download URL', schema: { $ref: '#/components/schemas/ProjectReportingMediaDownloadUrlResponse' } }
  */
  authMiddleware, authorize("project_reporting_media", "download", ["any"]),
  validateParams(projectReportingMediaIdParamSchema), projectReportingMediaController.download,
);

router.get(
  "/:mediaId",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Get project reporting media detail'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['mediaId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project reporting media detail', schema: { $ref: '#/components/schemas/ProjectReportingMediaResponse' } }
    #swagger.responses[404] = { description: 'Project reporting media not found' }
  */
  authMiddleware, authorize("project_reporting_media", "read", ["any"]),
  validateParams(projectReportingMediaIdParamSchema), projectReportingMediaController.getById,
);

router.post(
  "/presign",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Presign upload URL untuk media laporan project'
    #swagger.description = 'Langkah 1 alur upload direct ke Cloudflare R2. Kembalikan uploadUrl (presigned PUT, Content-Type di-sign) + objectKey. Maksimal 300MB, kedaluwarsa 30 menit.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/PresignProjectReportingMediaRequest' } } } }
    #swagger.responses[200] = { description: 'Presigned upload URL', schema: { $ref: '#/components/schemas/PresignUploadResponse' } }
    #swagger.responses[404] = { description: 'Project reporting not found' }
    #swagger.responses[413] = { description: 'Ukuran file melebihi batas maksimal 300MB' }
    #swagger.responses[415] = { description: 'Tipe file tidak diizinkan' }
  */
  authMiddleware, authorize("project_reporting_media", "upload", ["any"]),
  validate(presignProjectReportingMediaSchema), projectReportingMediaController.presign,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Konfirmasi upload media laporan project'
    #swagger.description = 'Langkah 2 alur upload direct ke R2: setelah PUT ke uploadUrl berhasil, kirim body ini untuk membuat record DB. Ukuran & tipe file diverifikasi ulang dari storage.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/ConfirmProjectReportingMediaRequest' } } } }
    #swagger.responses[201] = { description: 'Media uploaded', schema: { $ref: '#/components/schemas/ProjectReportingMediaResponse' } }
    #swagger.responses[400] = { description: 'object_key tidak valid atau mime_type tidak sesuai' }
    #swagger.responses[404] = { description: 'Project reporting not found atau file belum diunggah ke storage' }
    #swagger.responses[413] = { description: 'Ukuran file aktual melebihi batas maksimal 300MB' }
  */
  authMiddleware, authorize("project_reporting_media", "upload", ["any"]),
  validate(createProjectReportingMediaBodySchema), projectReportingMediaController.upload,
);

router.put(
  "/:mediaId",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Update project reporting media metadata'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['mediaId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/UpdateProjectReportingMediaRequest' } } } }
    #swagger.responses[200] = { description: 'Media updated', schema: { $ref: '#/components/schemas/ProjectReportingMediaResponse' } }
  */
  authMiddleware, authorize("project_reporting_media", "update", ["any"]),
  validateParams(projectReportingMediaIdParamSchema), validate(updateProjectReportingMediaSchema), projectReportingMediaController.update,
);

router.delete(
  "/:mediaId",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Delete project reporting media'
    #swagger.description = 'Menghapus file media dari object storage beserta record database-nya.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['mediaId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Media deleted' }
    #swagger.responses[404] = { description: 'Project reporting media not found' }
  */
  authMiddleware, authorize("project_reporting_media", "delete", ["any"]),
  validateParams(projectReportingMediaIdParamSchema), projectReportingMediaController.remove,
);

export default router;
