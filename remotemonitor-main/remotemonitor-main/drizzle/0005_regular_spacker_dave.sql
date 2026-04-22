ALTER TABLE `apkRuntimeConfigs` MODIFY COLUMN `createdAt` datetime;--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` MODIFY COLUMN `updatedAt` datetime;--> statement-breakpoint
ALTER TABLE `appsData` MODIFY COLUMN `createdAt` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `auditLogs` MODIFY COLUMN `createdAt` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `bankAccessAlerts` MODIFY COLUMN `createdAt` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicies` MODIFY COLUMN `createdAt` datetime;--> statement-breakpoint
ALTER TABLE `keylogs` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `lgpdConsents` MODIFY COLUMN `createdAt` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `screenLocks` MODIFY COLUMN `createdAt` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `screenshots` MODIFY COLUMN `imageUrl` varchar(2048);--> statement-breakpoint
ALTER TABLE `screenshots` MODIFY COLUMN `createdAt` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `appsData` ADD `deviceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `appsData` ADD `appPackage` varchar(255);--> statement-breakpoint
ALTER TABLE `appsData` ADD `appType` varchar(20);--> statement-breakpoint
ALTER TABLE `appsData` ADD `isInstalled` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `appsData` ADD `timeUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `appsData` ADD `lastUsed` datetime;--> statement-breakpoint
ALTER TABLE `appsData` ADD `updatedAt` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `deviceId` int;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `actorType` varchar(20);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `actorId` int;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `dataAccessed` varchar(255);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `ipAddress` varchar(64);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `userAgent` varchar(500);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `status` varchar(20);--> statement-breakpoint
ALTER TABLE `bankAccessAlerts` ADD `deviceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `bankAccessAlerts` ADD `bankName` varchar(255);--> statement-breakpoint
ALTER TABLE `bankAccessAlerts` ADD `bankApp` varchar(255);--> statement-breakpoint
ALTER TABLE `bankAccessAlerts` ADD `accessTime` datetime;--> statement-breakpoint
ALTER TABLE `bankAccessAlerts` ADD `duration` int;--> statement-breakpoint
ALTER TABLE `bankAccessAlerts` ADD `location` varchar(500);--> statement-breakpoint
ALTER TABLE `bankAccessAlerts` ADD `alertSent` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicies` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicies` ADD `dataType` varchar(50);--> statement-breakpoint
ALTER TABLE `dataRetentionPolicies` ADD `retentionDays` int;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicies` ADD `autoDelete` int;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicies` ADD `lastDeletedAt` datetime;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicies` ADD `updatedAt` datetime;--> statement-breakpoint
ALTER TABLE `keylogs` ADD `deviceId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `keylogs` ADD `appName` varchar(255);--> statement-breakpoint
ALTER TABLE `keylogs` ADD `keyText` varchar(2048);--> statement-breakpoint
ALTER TABLE `keylogs` ADD `isDeleted` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `lgpdConsents` ADD `deviceId` int;--> statement-breakpoint
ALTER TABLE `lgpdConsents` ADD `isConsented` int;--> statement-breakpoint
ALTER TABLE `lgpdConsents` ADD `consentDate` datetime;--> statement-breakpoint
ALTER TABLE `lgpdConsents` ADD `expiresAt` datetime;--> statement-breakpoint
ALTER TABLE `lgpdConsents` ADD `documentVersion` varchar(50);--> statement-breakpoint
ALTER TABLE `screenLocks` ADD `deviceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `screenLocks` ADD `lockType` varchar(50);--> statement-breakpoint
ALTER TABLE `screenLocks` ADD `reason` varchar(255);--> statement-breakpoint
ALTER TABLE `screenLocks` ADD `isLocked` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `screenLocks` ADD `unlockedAt` datetime;--> statement-breakpoint
ALTER TABLE `screenshots` ADD `deviceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `screenshots` ADD `screenshotUrl` varchar(2048);--> statement-breakpoint
ALTER TABLE `screenshots` ADD `fileSize` int;--> statement-breakpoint
ALTER TABLE `screenshots` ADD `captureType` varchar(20);--> statement-breakpoint
ALTER TABLE `screenshots` ADD `description` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `role` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `lastSignedIn` datetime;