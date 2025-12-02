PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_global_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`max_login_attempts` integer DEFAULT 5 NOT NULL,
	`login_attempt_window_minutes` integer DEFAULT 15 NOT NULL,
	`lockout_duration_minutes` integer DEFAULT 30 NOT NULL,
	`allow_registration` integer DEFAULT true NOT NULL,
	`require_email_verification` integer DEFAULT false NOT NULL,
	`admin_bypass_email_verification` integer DEFAULT true NOT NULL,
	`password_reset_token_expiry_hours` integer DEFAULT 1 NOT NULL,
	`fetch_interval_minutes` integer DEFAULT 60 NOT NULL,
	`prune_days` integer DEFAULT 90 NOT NULL,
	`last_rss_fetch_at` integer,
	`last_prune_at` integer,
	`updated_at` integer NOT NULL,
	`updated_by` integer,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_global_settings`("id", "max_login_attempts", "login_attempt_window_minutes", "lockout_duration_minutes", "allow_registration", "require_email_verification", "admin_bypass_email_verification", "password_reset_token_expiry_hours", "fetch_interval_minutes", "prune_days", "last_rss_fetch_at", "last_prune_at", "updated_at", "updated_by") SELECT "id", "max_login_attempts", "login_attempt_window_minutes", "lockout_duration_minutes", "allow_registration", "require_email_verification", "admin_bypass_email_verification", "password_reset_token_expiry_hours", "fetch_interval_minutes", "prune_days", "last_rss_fetch_at", "last_prune_at", "updated_at", "updated_by" FROM `global_settings`;--> statement-breakpoint
DROP TABLE `global_settings`;--> statement-breakpoint
ALTER TABLE `__new_global_settings` RENAME TO `global_settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `articles` ADD `comment_link` text;