import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../config/doc/swagger-output.json" with { type: "json" };
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const css = fs.readFileSync(
  path.resolve(__dirname, "../../node_modules/swagger-ui-dist/swagger-ui.css"),
  "utf-8",
);

// Serve Swagger documentation
router.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: css,
  }),
);

export default router;
