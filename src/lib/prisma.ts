import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  // Neon suspends idle computes; drop connections client-side first so we
  // never hand out sockets Neon has already killed.
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  // Default is 5s — too tight when Neon wakes from a cold start.
  transactionOptions: { maxWait: 10_000, timeout: 30_000 },
});

export default prisma;
