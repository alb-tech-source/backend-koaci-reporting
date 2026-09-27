import { Router } from "express";
import { investorSettlementController } from "../modules/investorSettlement/investorSettlement.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import {
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware.js";
import {
  listInvestorSettlementQuerySchema,
  investorSettlementIdParamSchema,
} from "../modules/investorSettlement/investorSettlement.validation.js";

const router = Router();

router.get(
  "/",
  /*
    #swagger.tags = ['Investor Settlement']
    #swagger.summary = 'List investor settlements'
    #swagger.description = 'Admin/bod/superadmin melihat semua. Investor hanya melihat settlement miliknya yang sudah approved, dengan ringkasan settlement project.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['status'] = { in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } }
    #swagger.parameters['project_settlement_id'] = { in: 'query', type: 'string', format: 'uuid' }
    #swagger.parameters['project_id'] = { in: 'query', type: 'string', format: 'uuid' }
    #swagger.parameters['investor_id'] = { in: 'query', type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Investor settlement list', schema: { $ref: '#/components/schemas/ListInvestorSettlementsResponse' } }
  */
  authMiddleware,
  authorize("investor_settlements", "read"),
  validateQuery(listInvestorSettlementQuerySchema),
  investorSettlementController.list,
);

router.get(
  "/:investorSettlementId",
  /*
    #swagger.tags = ['Investor Settlement']
    #swagger.summary = 'Get investor settlement by ID'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['investorSettlementId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Investor settlement detail', schema: { $ref: '#/components/schemas/InvestorSettlementResponse' } }
    #swagger.responses[404] = { description: 'Settlement investor tidak ditemukan' }
  */
  authMiddleware,
  authorize("investor_settlements", "read"),
  validateParams(investorSettlementIdParamSchema),
  investorSettlementController.getById,
);

export default router;
