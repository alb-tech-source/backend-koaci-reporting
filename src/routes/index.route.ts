import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";
import type { Express } from "express";

const initRoutes = (app: Express) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
};

export default initRoutes;
