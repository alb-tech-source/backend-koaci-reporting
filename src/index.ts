import express from "express";
import type { Express } from "express";
import { env } from "./config/env.js";
import cors from "cors";
import swaggerRoutes from "./routes/swagger.route.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import { smtpConnection } from "./config/mailer.js";

const app: Express = express();

// Setup
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Koaci Reporting App API",
    version: "1.0.0",
    status: "running",
    docs: "/api-docs",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Swagger Documentation
app.use("/", swaggerRoutes);

// Error handling middleware (should be last)
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({
      success: false,
      message,
    });
  },
);

// Running
function main(): void {
  try {
    const port = env.PORT;

    // Listening Server
    app.listen(port, (): void => {
      console.log(`[SERVER]: Server running at localhost: ${port}`);
      console.log(
        `[DOCS]: API Documentation available at http://localhost:${port}/api-docs`,
      );
      smtpConnection();
    });
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
