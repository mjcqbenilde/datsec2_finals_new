import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function getJobRolesForUser(userId: number): Promise<
  { job_key: string; job_name: string }[]
> {
  const [rows] = await pool.query<
    (RowDataPacket & { job_key: string; job_name: string })[]
  >(
    `SELECT jr.job_key, jr.job_name
     FROM user_job_roles ujr
     INNER JOIN job_roles jr ON jr.job_role_id = ujr.job_role_id
     WHERE ujr.user_id = ?
     ORDER BY jr.job_key`,
    [userId],
  );
  return rows;
}

export { hasModuleFamily } from "./permission-helpers";
