import express from "express";
import type { Express } from "express";
import { env } from "./config/env.js";
import cors from "cors";
import routes from "./routes/index.route.js";
import { smtpConnection } from "./config/mailer.js";
import docs from "./docs/route.js";
import passport from "./config/passport.js";
import session from "express-session";
import cookieParser from "cookie-parser";

const app: Express = express();

// Get allowed origins from environment variables with fallback
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  env.CLIENT_URL,
  env.FRONTEND_URL,
  "https://frontend-koaci-reporting-mobile.vercel.app",
  "https://frontend-koaci-reporting-web.vercel.app",
  "https://backend-koaci-reporting.vercel.app",
].filter(Boolean); // Remove any empty/undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Log for debugging (remove in production)
      if (env.NODE_ENV !== "production") {
        console.log("CORS request from origin:", origin);
      }

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // wajib true, karena state disimpan sebelum user login
    cookie: {
      maxAge: 1000 * 60 * 5, // 5 menit cukup, cuma buat handshake
      httpOnly: true,
      secure: env.NODE_ENV === "production",
    },
  }),
);

// Passport must be initialized before routes that use passport.authenticate().
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.json({
    message: "Koaci Reporting App API",
    version: "1.0.0",
    status: "running",
  });
});

// All Routes
routes(app);

// api-docs
docs(app);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err); // penting: log error asli biar keliatan di Vercel logs
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({
      success: false,
      message,
    });
  },
);

if (env.NODE_ENV !== "production") {
  const port = env.PORT;
  app.listen(port, (): void => {
    console.log(`[SERVER]: Server running at http://localhost:${port}`);
    smtpConnection();
  });
}

export default app;
