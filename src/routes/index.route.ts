import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";
import investorRoutes from "./investor.route.js";
import investorDocumentRoutes from "./investorDocument.route.js";
import companyRoutes from "./company.route.js";
import companyDocumentRoutes from "./companyDocument.route.js";
import projectRoutes from "./project.route.js";
import projectDocumentRoutes from "./projectDocument.route.js";
import projectInvestmentRoutes from "./projectInvestment.route.js";
import receiptDocumentRoutes from "./receiptDocument.route.js";
import activityLogRoutes from "./activityLog.route.js";
import permissionRoutes from "./permission.route.js";
import type { Express } from "express";

const initRoutes = (app: Express) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/investors", investorRoutes);
  app.use("/api/investor-documents", investorDocumentRoutes);
  app.use("/api/companies", companyRoutes);
  app.use("/api/company-documents", companyDocumentRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/project-documents", projectDocumentRoutes);
  app.use("/api/project-investments", projectInvestmentRoutes);
  app.use("/api/receipt-documents", receiptDocumentRoutes);
  app.use("/api/activity-logs", activityLogRoutes);
  app.use("/api/permissions", permissionRoutes);
};

export default initRoutes;
