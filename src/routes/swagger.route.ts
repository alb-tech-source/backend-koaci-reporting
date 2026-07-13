import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.js";

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health Check
 *     description: Check if API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 */
router.get("/", (req, res) => {
  res.json({
    message: "Koaci Reporting App API",
    version: "1.0.0",
    status: "running",
    docs: "/api-docs",
  });
});

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: API Documentation
 *     description: Swagger UI for API documentation
 *     tags: [Documentation]
 */
router.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Koaci Reporting App API Docs",
    customCss: ".swagger-ui .topbar { display: none }",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      displayOperationId: false,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      docExpansion: "list",
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      syntaxHighlight: {
        activate: true,
        theme: "tomorrow-night",
      },
    },
  })
);

/**
 * @swagger
 * /api-docs.json:
 *   get:
 *     summary: Get Swagger Spec JSON
 *     description: Get OpenAPI specification in JSON format
 *     tags: [Documentation]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OpenAPI specification JSON
 */
router.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

export default router;
