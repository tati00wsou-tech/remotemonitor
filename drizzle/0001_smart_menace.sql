CREATE TABLE `apkRuntimeConfigs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`configKey` varchar(255) NOT NULL,
	`configValue` varchar(255),
	CONSTRAINT `apkRuntimeConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appsData` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appName` varchar(255),
	`data` varchar(255),
	`createdAt` varchar(255),
	CONSTRAINT `appsData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bankAccessAlerts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertType` varchar(255),
	`createdAt` varchar(255),
	CONSTRAINT `bankAccessAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lgpdConsents` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consentType` varchar(255),
	`granted` int,
	`createdAt` varchar(255),
	CONSTRAINT `lgpdConsents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `screenLocks` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`locked` int,
	`createdAt` varchar(255),
	CONSTRAINT `screenLocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `screenshots` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` varchar(255),
	`createdAt` varchar(255),
	CONSTRAINT `screenshots_id` PRIMARY KEY(`id`)
);
