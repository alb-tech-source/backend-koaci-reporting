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

// Serve Swagger UI with production-compatible setup
router.get("/api-docs", (req, res) => {
  res.send(
    swaggerUi.generateHTML(swaggerSpec, {
      customSiteTitle: "Koaci Reporting App API Docs",
      customCssUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css",
      customJs: [
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js",
      ],
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        docExpansion: "list",
      },
    }),
  );
});

router.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});

export default router;
