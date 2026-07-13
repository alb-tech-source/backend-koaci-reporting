import nodemailer from "nodemailer";
import { env } from "./env.js";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const smtpConnection = () => {
  return transporter.verify((err) => {
    if (err) console.error("[SMTP]: SMTP Server connection error:", err);
    else console.log("[SMTP]: SMTP server ready");
  });
};
