import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";
import investorRoutes from "./investor.route.js";
import investorDocumentRoutes from "./investorDocument.route.js";
import activityLogRoutes from "./activityLog.route.js";
import type { Express } from "express";

const initRoutes = (app: Express) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/investors", investorRoutes);
  app.use("/api/investor-documents", investorDocumentRoutes);
  app.use("/api/activity-logs", activityLogRoutes);
};

export default initRoutes;
