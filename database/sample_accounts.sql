-- Sample users for RBAC demo (run after database/rbac_schema.sql against database rbac_system)
--
-- Default password for every account below: Password123!
-- Argon2id (nodejs argon2, same params as typical defaults: m=65536, t=3, p=4)
-- Replace hashes in production; do not ship demo passwords to production.

SET NAMES utf8mb4;

-- Optional: re-run safely (removes only these demo accounts)
DELETE ujr FROM `user_job_roles` ujr
INNER JOIN `users` u ON u.`user_id` = ujr.`user_id`
WHERE u.`username` IN (
  'superadmin', 'admin', 'finance_user', 'hr_user', 'operations_user', 'compliance_user'
);
DELETE FROM `users`
WHERE `username` IN (
  'superadmin', 'admin', 'finance_user', 'hr_user', 'operations_user', 'compliance_user'
);

-- One shared Argon2id hash for Password123!
SET @demo_hash = '$argon2id$v=19$m=65536,t=3,p=4$yCuFuFGxTkpYCG12l1RVXg$cLxPEulsmbBFfN/kYkAsCVgDyt+K3cGXOpRTxxHwl2M';

-- -----------------------------------------------------------------------------
-- System roles: Super Admin, Admin, User (one account each)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`username`, `email`, `password_hash`, `system_role_id`, `first_name`, `last_name`, `is_active`)
SELECT 'superadmin', 'superadmin@example.local', @demo_hash, sr.`system_role_id`, 'Sage', 'Administrator', 1
FROM `system_roles` sr WHERE sr.`role_key` = 'super_admin';

INSERT INTO `users` (`username`, `email`, `password_hash`, `system_role_id`, `first_name`, `last_name`, `is_active`)
SELECT 'admin', 'admin@example.local', @demo_hash, sr.`system_role_id`, 'Alex', 'Manager', 1
FROM `system_roles` sr WHERE sr.`role_key` = 'admin';

-- -----------------------------------------------------------------------------
-- Standard users: one per job role (Finance, HR, Operations, Compliance)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`username`, `email`, `password_hash`, `system_role_id`, `first_name`, `last_name`, `is_active`)
SELECT 'finance_user', 'finance@example.local', @demo_hash, sr.`system_role_id`, 'Fiona', 'Bookkeeper', 1
FROM `system_roles` sr WHERE sr.`role_key` = 'user';

INSERT INTO `users` (`username`, `email`, `password_hash`, `system_role_id`, `first_name`, `last_name`, `is_active`)
SELECT 'hr_user', 'hr@example.local', @demo_hash, sr.`system_role_id`, 'Hannah', 'Recruiter', 1
FROM `system_roles` sr WHERE sr.`role_key` = 'user';

INSERT INTO `users` (`username`, `email`, `password_hash`, `system_role_id`, `first_name`, `last_name`, `is_active`)
SELECT 'operations_user', 'operations@example.local', @demo_hash, sr.`system_role_id`, 'Oscar', 'Coordinator', 1
FROM `system_roles` sr WHERE sr.`role_key` = 'user';

INSERT INTO `users` (`username`, `email`, `password_hash`, `system_role_id`, `first_name`, `last_name`, `is_active`)
SELECT 'compliance_user', 'compliance@example.local', @demo_hash, sr.`system_role_id`, 'Casey', 'Auditor', 1
FROM `system_roles` sr WHERE sr.`role_key` = 'user';

-- -----------------------------------------------------------------------------
-- Job role assignments (Super Admin as assigner for demo audit trail)
-- Super Admin / Admin have no job rows here; they rely on system permissions.
-- -----------------------------------------------------------------------------
INSERT INTO `user_job_roles` (`user_id`, `job_role_id`, `assigned_by_user_id`)
SELECT u.`user_id`, jr.`job_role_id`, sa.`user_id`
FROM `users` u
CROSS JOIN `job_roles` jr
CROSS JOIN `users` sa
WHERE u.`username` = 'finance_user' AND jr.`job_key` = 'finance' AND sa.`username` = 'superadmin';

INSERT INTO `user_job_roles` (`user_id`, `job_role_id`, `assigned_by_user_id`)
SELECT u.`user_id`, jr.`job_role_id`, sa.`user_id`
FROM `users` u
CROSS JOIN `job_roles` jr
CROSS JOIN `users` sa
WHERE u.`username` = 'hr_user' AND jr.`job_key` = 'hr' AND sa.`username` = 'superadmin';

INSERT INTO `user_job_roles` (`user_id`, `job_role_id`, `assigned_by_user_id`)
SELECT u.`user_id`, jr.`job_role_id`, sa.`user_id`
FROM `users` u
CROSS JOIN `job_roles` jr
CROSS JOIN `users` sa
WHERE u.`username` = 'operations_user' AND jr.`job_key` = 'operations' AND sa.`username` = 'superadmin';

INSERT INTO `user_job_roles` (`user_id`, `job_role_id`, `assigned_by_user_id`)
SELECT u.`user_id`, jr.`job_role_id`, sa.`user_id`
FROM `users` u
CROSS JOIN `job_roles` jr
CROSS JOIN `users` sa
WHERE u.`username` = 'compliance_user' AND jr.`job_key` = 'compliance' AND sa.`username` = 'superadmin';
