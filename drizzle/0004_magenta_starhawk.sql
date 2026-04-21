CREATE TABLE `keylogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`appName` varchar(255) NOT NULL,
	`keyText` text NOT NULL,
	`isDeleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keylogs_id` PRIMARY KEY(`id`)
);
