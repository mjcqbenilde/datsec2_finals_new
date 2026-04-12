import type { RowDataPacket } from "mysql2";

export type SystemRoleRow = RowDataPacket & {
  system_role_id: number;
  role_key: string;
  role_name: string;
};

export type UserRow = RowDataPacket & {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  system_role_id: number;
  is_active: number;
  first_name: string | null;
  last_name: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
  role_key: string;
  role_name: string;
};

export type JobRoleRow = RowDataPacket & {
  job_role_id: number;
  job_key: string;
  job_name: string;
};
