import express from "express";
import type { Express } from "express";
import { env } from "./config/env.js";
import cors from "cors";
import routes from "./routes/index.route.js";
import { smtpConnection } from "./config/mailer.js";
import docs from "./docs/route.js";
import passport from "./config/passport.js";
import session from "express-session";

const app: Express = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
