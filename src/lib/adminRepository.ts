import type { QueryResultRow } from "pg";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { getPool } from "@/lib/postgres";

type AdminUserRow = QueryResultRow & {
  id: number;
  username: string;
  display_name: string;
  password_hash: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export type AdminUser = {
  id: number;
  username: string;
  displayName: string;
};

function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    displayName: row.display_name,
    id: Number(row.id),
    username: row.username,
  };
}

export async function findAdminUserByUsername(username: string) {
  const pool = getPool();
  const result = await pool.query<AdminUserRow>(
    `
      select id, username, display_name, password_hash, created_at, updated_at
      from admin_users
      where lower(username) = lower($1)
      limit 1
    `,
    [username],
  );

  return result.rows[0] || null;
}

export async function verifyAdminCredentials(username: string, password: string) {
  const user = await findAdminUserByUsername(username);

  if (!user || !verifyAdminPassword(password, user.password_hash)) {
    return null;
  }

  return toAdminUser(user);
}
