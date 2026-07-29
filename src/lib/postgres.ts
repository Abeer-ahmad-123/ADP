import { Pool } from "pg";

type PgGlobal = typeof globalThis & {
  adpPgPool?: Pool;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return new Pool({
    connectionString,
    max: 5,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

export function getPool() {
  const pgGlobal = globalThis as PgGlobal;

  if (!pgGlobal.adpPgPool) {
    pgGlobal.adpPgPool = createPool();
  }

  return pgGlobal.adpPgPool;
}
