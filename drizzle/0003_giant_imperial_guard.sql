DROP TABLE `alertConfigs`;--> statement-breakpoint
DROP TABLE `alerts`;--> statement-breakpoint
DROP TABLE `appsData`;--> statement-breakpoint
DROP TABLE `auditLogs`;--> statement-breakpoint
DROP TABLE `bankAccessAlerts`;--> statement-breakpoint
DROP TABLE `dataRetentionPolicies`;--> statement-breakpoint
DROP TABLE `devices`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
DROP TABLE `installationTokens`;--> statement-breakpoint
DROP TABLE `lgpdConsents`;--> statement-breakpoint
DROP TABLE `screenLocks`;--> statement-breakpoint
DROP TABLE `screenshots`;--> statement-breakpoint
DROP TABLE `websocketSessions`;--> statement-breakpoint
DROP INDEX `users_openId_unique` ON `users`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_openId_unique` UNIQUE(`openId`);