import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Serve Swagger UI static files from public directory for Vercel compatibility
const publicDir = path.join(__dirname, "../../public");

// IMPORTANT: Order matters!
// 1. First serve the HTML at /api-docs root
router.get("/api-docs", (_req, res) => {
  res.send(swaggerUi.generateHTML(swaggerSpec, {
    customSiteTitle: "Koaci Reporting App API Docs",
    customCss: ".swagger-ui .topbar { display: none }",
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
  }));
});

// 2. Then serve static assets for requests like /api-docs/swagger-ui-bundle.js
router.use("/api-docs", express.static(publicDir, {
  setHeaders: (res, filepath) => {
    // Set proper content types for static assets
    if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

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
