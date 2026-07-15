import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../config/doc/swagger-output.json" with { type: "json" };

const router = Router();

// Serve Swagger documentation
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;
