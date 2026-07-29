import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "adp_admin_session";

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const PASSWORD_HASH_PREFIX = "scrypt";
const SCRYPT_KEY_LENGTH = 64;
const PLACEHOLDER_SECRETS = new Set([
  "replace-with-a-long-random-admin-token",
  "replace-with-a-long-random-session-secret",
]);

export type AdminSession = {
  sub: number;
  username: string;
  displayName: string;
  exp: number;
  iat: number;
};

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value: unknown) {
  return base64UrlEncode(JSON.stringify(value));
}

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 24 || PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error("ADMIN_SESSION_SECRET must be set to a long random value.");
  }

  return secret;
}

function signTokenPart(value: string) {
  return createHmac("sha256", getAdminSessionSecret())
    .update(value)
    .digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("base64url");

  return `${PASSWORD_HASH_PREFIX}$${salt}$${hash}`;
}

export function verifyAdminPassword(password: string, passwordHash: string) {
  const [prefix, salt, storedHash] = passwordHash.split("$");

  if (prefix !== PASSWORD_HASH_PREFIX || !salt || !storedHash) {
    return false;
  }

  const incomingHash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString(
    "base64url",
  );

  return safeCompare(incomingHash, storedHash);
}

export function createAdminSessionToken({
  displayName,
  id,
  username,
}: {
  displayName: string;
  id: number;
  username: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    displayName,
    exp: now + SESSION_TTL_SECONDS,
    iat: now,
    sub: id,
    username,
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = signTokenPart(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = signTokenPart(`${header}.${payload}`);

  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AdminSession;
    const now = Math.floor(Date.now() / 1000);

    if (
      typeof session.sub !== "number" ||
      typeof session.username !== "string" ||
      typeof session.displayName !== "string" ||
      typeof session.exp !== "number" ||
      session.exp <= now
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getAdminSessionFromCookies() {
  const cookieStore = await cookies();

  try {
    return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(ADMIN_SESSION_COOKIE.length + 1);

  try {
    return verifyAdminSessionToken(token);
  } catch {
    return null;
  }
}

export function getAdminSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}
