CREATE TABLE `auditLogs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(255),
	`createdAt` varchar(255),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataRetentionPolicies` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`policyName` varchar(255),
	`description` varchar(255),
	`daysToRetain` int,
	`createdAt` varchar(255),
	CONSTRAINT `dataRetentionPolicies_id` PRIMARY KEY(`id`)
);
