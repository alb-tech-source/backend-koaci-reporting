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

// JANGAN pakai swaggerUi.serve lagi — itu yang butuh static file serving
router.get("/api-docs", (req, res) => {
  res.send(
    swaggerUi.generateHTML(swaggerSpec, {
      customSiteTitle: "Koaci Reporting App API Docs",
      customCssUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.29.1/swagger-ui.min.css",
      customJs: [
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.29.1/swagger-ui-bundle.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.29.1/swagger-ui-standalone-preset.min.js",
      ],
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        docExpansion: "list",
        url: "/api-docs.json", // eksplisit suruh fetch spec dari sini
      },
    }),
  );
});

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
  res.json(swaggerSpec);
});

export default router;
