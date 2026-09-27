import { Router } from "express";
import { projectSettlementController } from "../modules/projectSettlement/projectSettlement.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import {
  validate,
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware.js";
import {
  createProjectSettlementBodySchema,
  updateProjectSettlementBodySchema,
  listProjectSettlementQuerySchema,
  projectSettlementIdParamSchema,
} from "../modules/projectSettlement/projectSettlement.validation.js";

const router = Router();

router.post(
  "/preview",
  /*
    #swagger.tags = ['Project Settlement']
    #swagger.summary = 'Preview perhitungan settlement (tidak disimpan)'
    #swagger.description = 'Menghitung seluruh field settlement project & investor dari input admin tanpa menyimpan ke database. Body sama dengan create. Gunakan untuk live preview di form.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/CreateProjectSettlementRequest' } } } }
    #swagger.responses[200] = { description: 'Hasil perhitungan', schema: { $ref: '#/components/schemas/ProjectSettlementPreviewResponse' } }
    #swagger.responses[400] = { description: 'Input tidak valid / persentase tidak berjumlah 100 / investor tidak berinvestasi pada project' }
    #swagger.responses[404] = { description: 'Project tidak ditemukan' }
  */
  authMiddleware,
  authorize("project_settlements", "create", ["any"]),
  validate(createProjectSettlementBodySchema),
  projectSettlementController.preview,
);

router.get(
  "/",
  /*
    #swagger.tags = ['Project Settlement']
    #swagger.summary = 'List project settlements'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['search'] = { in: 'query', type: 'string', description: 'Cari berdasarkan project_key' }
    #swagger.parameters['status'] = { in: 'query', schema: { type: 'string', enum: ['review', 'approved', 'rejected'] } }
    #swagger.parameters['project_id'] = { in: 'query', type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project settlement list', schema: { $ref: '#/components/schemas/ListProjectSettlementsResponse' } }
  */
  authMiddleware,
  authorize("project_settlements", "read", ["any"]),
  validateQuery(listProjectSettlementQuerySchema),
  projectSettlementController.list,
);

router.get(
  "/:settlementId",
  /*
    #swagger.tags = ['Project Settlement']
    #swagger.summary = 'Get project settlement by ID (termasuk investor settlements)'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['settlementId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project settlement detail', schema: { $ref: '#/components/schemas/ProjectSettlementResponse' } }
    #swagger.responses[404] = { description: 'Settlement tidak ditemukan' }
  */
  authMiddleware,
  authorize("project_settlements", "read", ["any"]),
  validateParams(projectSettlementIdParamSchema),
  projectSettlementController.getById,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Project Settlement']
    #swagger.summary = 'Create project settlement'
    #swagger.description = 'Menyimpan settlement project beserta seluruh investor settlement dalam satu transaksi. Principal investor diambil dari ProjectInvestment; field hasil hitung diisi backend. Status awal: review.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/CreateProjectSettlementRequest' } } } }
    #swagger.responses[201] = { description: 'Settlement dibuat' }
    #swagger.responses[400] = { description: 'Input tidak valid / persentase tidak berjumlah 100 / investor tidak berinvestasi pada project' }
    #swagger.responses[404] = { description: 'Project tidak ditemukan' }
    #swagger.responses[409] = { description: 'Project sudah memiliki settlement' }
  */
  authMiddleware,
  authorize("project_settlements", "create", ["any"]),
  validate(createProjectSettlementBodySchema),
  projectSettlementController.create,
);

router.patch(
  "/:settlementId",
  /*
    #swagger.tags = ['Project Settlement']
    #swagger.summary = 'Update project settlement'
    #swagger.description = 'Hanya untuk status review/rejected. Seluruh field dihitung ulang (termasuk principal terbaru dari ProjectInvestment) dan status kembali ke review. Jika `investors` dikirim, daftar tersebut menggantikan seluruh kompensasi; investor yang tidak dicantumkan dianggap compensation_pct = 0.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['settlementId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/UpdateProjectSettlementRequest' } } } }
    #swagger.responses[200] = { description: 'Settlement diperbarui' }
    #swagger.responses[400] = { description: 'Input tidak valid / persentase tidak berjumlah 100' }
    #swagger.responses[404] = { description: 'Settlement tidak ditemukan' }
    #swagger.responses[409] = { description: 'Settlement sudah disetujui' }
  */
  authMiddleware,
  authorize("project_settlements", "update", ["any"]),
  validateParams(projectSettlementIdParamSchema),
  validate(updateProjectSettlementBodySchema),
  projectSettlementController.update,
);

router.patch(
  "/:settlementId/approve",
  /*
    #swagger.tags = ['Project Settlement']
    #swagger.summary = 'Approve project settlement'
    #swagger.description = 'Hanya bod/superadmin. Status review -> approved; seluruh investor settlement ikut approved. Settlement yang sudah approved terkunci.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['settlementId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Settlement disetujui' }
    #swagger.responses[404] = { description: 'Settlement tidak ditemukan' }
    #swagger.responses[409] = { description: 'Settlement tidak berstatus review' }
  */
  authMiddleware,
  authorize("project_settlements", "approve", ["any"]),
  validateParams(projectSettlementIdParamSchema),
  projectSettlementController.approve,
);

router.patch(
  "/:settlementId/reject",
  /*
    #swagger.tags = ['Project Settlement']
    #swagger.summary = 'Reject project settlement'
    #swagger.description = 'Hanya bod/superadmin. Status review -> rejected; seluruh investor settlement ikut rejected. Admin dapat mengedit lalu settlement kembali ke review.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['settlementId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Settlement ditolak' }
    #swagger.responses[404] = { description: 'Settlement tidak ditemukan' }
    #swagger.responses[409] = { description: 'Settlement tidak berstatus review' }
  */
  authMiddleware,
  authorize("project_settlements", "approve", ["any"]),
  validateParams(projectSettlementIdParamSchema),
  projectSettlementController.reject,
);

router.delete(
  "/:settlementId",
  /*
    #swagger.tags = ['Project Settlement']
    #swagger.summary = 'Delete project settlement'
    #swagger.description = 'Hanya untuk status review/rejected. Investor settlement terkait ikut terhapus.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['settlementId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Settlement dihapus' }
    #swagger.responses[404] = { description: 'Settlement tidak ditemukan' }
    #swagger.responses[409] = { description: 'Settlement sudah disetujui' }
  */
  authMiddleware,
  authorize("project_settlements", "delete", ["any"]),
  validateParams(projectSettlementIdParamSchema),
  projectSettlementController.remove,
);

export default router;
