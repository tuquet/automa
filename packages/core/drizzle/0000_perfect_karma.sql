CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`username` text NOT NULL,
	`password` text,
	`two_factor_secret` text,
	`cookies` text,
	`proxy_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`trust_score` integer DEFAULT 100,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `browser_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_agent` text NOT NULL,
	`timezone` text,
	`language` text DEFAULT 'en-US',
	`screen_resolution` text DEFAULT '1920x1080',
	`account_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `campaign_accounts` (
	`campaign_id` text NOT NULL,
	`account_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`workflow_id` text NOT NULL,
	`schedule` text,
	`status` text DEFAULT 'idle' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`options` text,
	`status` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `proxies` (
	`id` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`port` integer NOT NULL,
	`username` text,
	`password` text,
	`protocol` text DEFAULT 'http',
	`status` text DEFAULT 'alive' NOT NULL,
	`trust_score` integer DEFAULT 100,
	`last_checked` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`workflow_path` text NOT NULL,
	`cron_expr` text NOT NULL,
	`concurrency` integer DEFAULT 1,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
