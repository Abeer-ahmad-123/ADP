import { randomBytes, scryptSync } from "crypto";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";

const DEFAULT_USERNAME = "admin@awamdost.party";
const DEFAULT_PASSWORD = "AwamDost@2026!";
const DEFAULT_DISPLAY_NAME = "Super Admin";
const PASSWORD_HASH_PREFIX = "scrypt";
const SCRYPT_KEY_LENGTH = 64;
const PLACEHOLDER_SECRETS = new Set([
  "replace-with-a-long-random-admin-token",
  "replace-with-a-long-random-session-secret",
]);

function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function hashAdminPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("base64url");

  return `${PASSWORD_HASH_PREFIX}$${salt}$${hash}`;
}

function hasUsableSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  return Boolean(secret && secret.length >= 24 && !PLACEHOLDER_SECRETS.has(secret));
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. Add it to .env.local first.");
  }

  const username = process.env.ADMIN_SEED_USERNAME || DEFAULT_USERNAME;
  const password = process.env.ADMIN_SEED_PASSWORD || DEFAULT_PASSWORD;
  const displayName = process.env.ADMIN_SEED_DISPLAY_NAME || DEFAULT_DISPLAY_NAME;
  const pool = new Pool({
    connectionString,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  try {
    await pool.query(`
      create table if not exists admin_users (
        id bigserial primary key,
        username text not null unique,
        display_name text not null,
        password_hash text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);

    await pool.query(`
      create index if not exists admin_users_username_idx
        on admin_users (lower(username))
    `);

    await pool.query(
      `
        insert into admin_users (username, display_name, password_hash)
        values ($1, $2, $3)
        on conflict (username)
        do update set
          display_name = excluded.display_name,
          password_hash = excluded.password_hash,
          updated_at = now()
      `,
      [username.toLowerCase(), displayName, hashAdminPassword(password)],
    );

    console.log("Admin user is ready.");
    console.log(`Username: ${username.toLowerCase()}`);
    console.log(`Password: ${password}`);

    if (!hasUsableSessionSecret()) {
      console.warn(
        "Warning: ADMIN_SESSION_SECRET is missing or still a placeholder. Set it before logging in.",
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
