ALTER TABLE `apkRuntimeConfigs` RENAME COLUMN `configValue` TO `createdAt`;--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` ADD `packageName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` ADD `panelUrl` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` ADD `appName` varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` ADD `logoUrl` varchar(255);--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` ADD `bankId` varchar(80);--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` ADD `bankCountry` varchar(80);--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` ADD `bankName` varchar(255);--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` ADD `artifactSource` varchar(20);--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` ADD `buildId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `apkRuntimeConfigs` DROP COLUMN `configKey`;