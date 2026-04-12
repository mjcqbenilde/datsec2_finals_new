-- RBAC schema for Next.js + MariaDB/MySQL (2NF-oriented)
-- Database name: rbac_system (CREATE DATABASE IF NOT EXISTS rbac_system; USE rbac_system;)
-- Passwords: Argon2id → varchar(255) on users.password_hash
-- Server: MariaDB 10.4+ / MySQL 8+
--
-- Normalization notes (2NF):
-- - Single-column PK tables: attributes depend on that key only.
-- - permissions(module_id, action_id): junction only; descriptions live in `modules` / `actions`,
--   not duplicated here (no partial dependency on half of a composite permission key).
-- - user_job_roles: assignment metadata (assigned_at, assigned_by_user_id) depends on the full
--   composite key (user_id, job_role_id), i.e. on that specific assignment row.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- -----------------------------------------------------------------------------
-- System roles (Super Admin, Admin, User) — one per user
-- -----------------------------------------------------------------------------
CREATE TABLE `system_roles` (
  `system_role_id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `role_key` varchar(32) NOT NULL COMMENT 'super_admin | admin | user',
  `role_name` varchar(64) NOT NULL,
  PRIMARY KEY (`system_role_id`),
  UNIQUE KEY `uq_system_roles_key` (`role_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Job roles
-- -----------------------------------------------------------------------------
CREATE TABLE `job_roles` (
  `job_role_id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `job_key` varchar(32) NOT NULL COMMENT 'finance | hr | operations | compliance',
  `job_name` varchar(128) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`job_role_id`),
  UNIQUE KEY `uq_job_roles_key` (`job_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Actions: atomic verbs (depends only on action_id)
-- -----------------------------------------------------------------------------
CREATE TABLE `actions` (
  `action_id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `action_key` varchar(32) NOT NULL COMMENT 'view | create | update | delete | assign | manage | access | view_self | edit_self',
  PRIMARY KEY (`action_id`),
  UNIQUE KEY `uq_actions_key` (`action_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Modules: feature areas (depends only on module_id); domain replaces old permissions.scope
-- -----------------------------------------------------------------------------
CREATE TABLE `modules` (
  `module_id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `module_key` varchar(96) NOT NULL COMMENT 'e.g. finance.reports, system.audit',
  `domain` enum('system','job') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`module_id`),
  UNIQUE KEY `uq_modules_key` (`module_key`),
  KEY `idx_modules_domain` (`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Permissions: exactly one row per (module, action); no descriptive columns here (2NF)
-- -----------------------------------------------------------------------------
CREATE TABLE `permissions` (
  `permission_id` int unsigned NOT NULL AUTO_INCREMENT,
  `module_id` smallint unsigned NOT NULL,
  `action_id` tinyint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `uq_permissions_module_action` (`module_id`,`action_id`),
  KEY `fk_permissions_action` (`action_id`),
  CONSTRAINT `fk_permissions_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`module_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_permissions_action` FOREIGN KEY (`action_id`) REFERENCES `actions` (`action_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `system_role_permissions` (
  `system_role_id` tinyint unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  PRIMARY KEY (`system_role_id`,`permission_id`),
  KEY `fk_srp_permission` (`permission_id`),
  CONSTRAINT `fk_srp_system_role` FOREIGN KEY (`system_role_id`) REFERENCES `system_roles` (`system_role_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_srp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_role_permissions` (
  `job_role_id` tinyint unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  PRIMARY KEY (`job_role_id`,`permission_id`),
  KEY `fk_jrp_permission` (`permission_id`),
  CONSTRAINT `fk_jrp_job_role` FOREIGN KEY (`job_role_id`) REFERENCES `job_roles` (`job_role_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_jrp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Users
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'Argon2id',
  `system_role_id` tinyint unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_system_role` (`system_role_id`),
  KEY `idx_users_active` (`is_active`),
  CONSTRAINT `fk_users_system_role` FOREIGN KEY (`system_role_id`) REFERENCES `system_roles` (`system_role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_job_roles` (
  `user_id` int unsigned NOT NULL,
  `job_role_id` tinyint unsigned NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by_user_id` int unsigned DEFAULT NULL COMMENT 'Admin / Super Admin who assigned',
  PRIMARY KEY (`user_id`,`job_role_id`),
  KEY `fk_ujr_job` (`job_role_id`),
  KEY `fk_ujr_assigner` (`assigned_by_user_id`),
  CONSTRAINT `fk_ujr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ujr_job` FOREIGN KEY (`job_role_id`) REFERENCES `job_roles` (`job_role_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ujr_assigner` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Audit / activity
-- -----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `log_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL COMMENT 'NULL for failed login or unknown',
  `event_type` varchar(48) NOT NULL COMMENT 'login_success, login_failure, logout, view, create, update, delete, ...',
  `resource_type` varchar(64) DEFAULT NULL COMMENT 'user, audit_log, finance.report, ...',
  `resource_id` varchar(64) DEFAULT NULL,
  `summary` varchar(512) NOT NULL,
  `details` json DEFAULT NULL COMMENT 'Optional structured payload',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_audit_user_time` (`user_id`,`created_at`),
  KEY `idx_audit_event_time` (`event_type`,`created_at`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed: system roles & job roles
-- -----------------------------------------------------------------------------
INSERT INTO `system_roles` (`role_key`, `role_name`) VALUES
  ('super_admin', 'Super Admin'),
  ('admin', 'Admin'),
  ('user', 'User');

INSERT INTO `job_roles` (`job_key`, `job_name`, `description`) VALUES
  ('finance', 'Finance Records', 'Financial reports, budget, transactions'),
  ('hr', 'HR Records', 'Employee information and attendance'),
  ('operations', 'Operations', 'Orders, inventory, and vendor coordination'),
  ('compliance', 'Compliance', 'Policies, training records, and regulatory checklists');

-- -----------------------------------------------------------------------------
-- Seed: actions
-- -----------------------------------------------------------------------------
INSERT INTO `actions` (`action_key`) VALUES
  ('view'),
  ('create'),
  ('update'),
  ('delete'),
  ('assign'),
  ('manage'),
  ('access'),
  ('view_self'),
  ('edit_self');

-- -----------------------------------------------------------------------------
-- Seed: modules (one row per feature area; domain replaces former permissions.scope)
-- -----------------------------------------------------------------------------
INSERT INTO `modules` (`module_key`, `domain`, `description`) VALUES
  ('system.admins', 'system', 'Admin account management'),
  ('system.users', 'system', 'User lifecycle and non–Super-Admin management'),
  ('system.roles', 'system', 'Assign system roles'),
  ('system.job_roles', 'system', 'Assign job roles to users'),
  ('system.audit', 'system', 'View audit and activity logs'),
  ('system.dashboard.super', 'system', 'Super Admin dashboard'),
  ('system.dashboard.admin', 'system', 'Admin dashboard'),
  ('system.dashboard.user', 'system', 'User job-scoped dashboard'),
  ('profile', 'system', 'Own profile'),
  ('finance.reports', 'job', 'Financial reports'),
  ('finance.budget', 'job', 'Budget records'),
  ('finance.transactions', 'job', 'Transactions'),
  ('hr.employees', 'job', 'Employee information'),
  ('hr.attendance', 'job', 'Attendance records'),
  ('operations.orders', 'job', 'Orders'),
  ('operations.inventory', 'job', 'Inventory'),
  ('operations.vendors', 'job', 'Vendors'),
  ('compliance.policies', 'job', 'Policies and acknowledgements'),
  ('compliance.training', 'job', 'Training records'),
  ('compliance.checklists', 'job', 'Compliance checklists');

-- -----------------------------------------------------------------------------
-- Seed: permissions = (module × action) rows needed by the app
-- -----------------------------------------------------------------------------
INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key = 'manage'
WHERE m.module_key = 'system.admins';

INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key = 'manage'
WHERE m.module_key = 'system.users';

INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key = 'assign'
WHERE m.module_key IN ('system.roles', 'system.job_roles');

INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key = 'view'
WHERE m.module_key = 'system.audit';

INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key = 'access'
WHERE m.module_key IN ('system.dashboard.super', 'system.dashboard.admin', 'system.dashboard.user');

INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key IN ('view_self', 'edit_self')
WHERE m.module_key = 'profile';

INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key IN ('view', 'create', 'update', 'delete')
WHERE m.module_key IN (
  'finance.reports', 'finance.budget', 'finance.transactions',
  'hr.employees', 'hr.attendance'
);

INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key IN ('view', 'create', 'update', 'delete')
WHERE m.module_key = 'operations.orders';

INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key IN ('view', 'update')
WHERE m.module_key IN ('operations.inventory', 'operations.vendors');

INSERT INTO `permissions` (`module_id`, `action_id`)
SELECT m.module_id, a.action_id
FROM `modules` m
JOIN `actions` a ON a.action_key IN ('view', 'update')
WHERE m.module_key IN ('compliance.policies', 'compliance.training', 'compliance.checklists');

-- -----------------------------------------------------------------------------
-- Map system roles → permissions
-- -----------------------------------------------------------------------------
INSERT INTO `system_role_permissions` (`system_role_id`, `permission_id`)
SELECT sr.system_role_id, p.permission_id
FROM `system_roles` sr
CROSS JOIN `permissions` p
JOIN `modules` m ON m.module_id = p.module_id
WHERE sr.role_key = 'super_admin';

INSERT INTO `system_role_permissions` (`system_role_id`, `permission_id`)
SELECT sr.system_role_id, p.permission_id
FROM `system_roles` sr
CROSS JOIN `permissions` p
JOIN `modules` m ON m.module_id = p.module_id
JOIN `actions` a ON a.action_id = p.action_id
WHERE sr.role_key = 'admin'
  AND (
    (m.module_key = 'system.users' AND a.action_key = 'manage')
    OR (m.module_key = 'system.job_roles' AND a.action_key = 'assign')
    OR (m.module_key = 'system.audit' AND a.action_key = 'view')
    OR (m.module_key = 'system.dashboard.admin' AND a.action_key = 'access')
    OR (m.module_key = 'profile' AND a.action_key IN ('view_self', 'edit_self'))
  );

INSERT INTO `system_role_permissions` (`system_role_id`, `permission_id`)
SELECT sr.system_role_id, p.permission_id
FROM `system_roles` sr
CROSS JOIN `permissions` p
JOIN `modules` m ON m.module_id = p.module_id
JOIN `actions` a ON a.action_id = p.action_id
WHERE sr.role_key = 'user'
  AND (
    (m.module_key = 'system.dashboard.user' AND a.action_key = 'access')
    OR (m.module_key = 'profile' AND a.action_key IN ('view_self', 'edit_self'))
  );

-- -----------------------------------------------------------------------------
-- Map job roles → job-domain permissions
-- -----------------------------------------------------------------------------
INSERT INTO `job_role_permissions` (`job_role_id`, `permission_id`)
SELECT jr.job_role_id, p.permission_id
FROM `job_roles` jr
CROSS JOIN `permissions` p
JOIN `modules` m ON m.module_id = p.module_id
WHERE jr.job_key = 'finance'
  AND m.domain = 'job'
  AND m.module_key LIKE 'finance.%';

INSERT INTO `job_role_permissions` (`job_role_id`, `permission_id`)
SELECT jr.job_role_id, p.permission_id
FROM `job_roles` jr
CROSS JOIN `permissions` p
JOIN `modules` m ON m.module_id = p.module_id
WHERE jr.job_key = 'hr'
  AND m.domain = 'job'
  AND m.module_key LIKE 'hr.%';

INSERT INTO `job_role_permissions` (`job_role_id`, `permission_id`)
SELECT jr.job_role_id, p.permission_id
FROM `job_roles` jr
CROSS JOIN `permissions` p
JOIN `modules` m ON m.module_id = p.module_id
WHERE jr.job_key = 'operations'
  AND m.domain = 'job'
  AND m.module_key LIKE 'operations.%';

INSERT INTO `job_role_permissions` (`job_role_id`, `permission_id`)
SELECT jr.job_role_id, p.permission_id
FROM `job_roles` jr
CROSS JOIN `permissions` p
JOIN `modules` m ON m.module_id = p.module_id
WHERE jr.job_key = 'compliance'
  AND m.domain = 'job'
  AND m.module_key LIKE 'compliance.%';

-- -----------------------------------------------------------------------------
-- Optional: stable string key for app code (derive in SQL or concatenate in app)
-- CONCAT(m.module_key, ':', a.action_key) AS permission_key
-- -----------------------------------------------------------------------------
