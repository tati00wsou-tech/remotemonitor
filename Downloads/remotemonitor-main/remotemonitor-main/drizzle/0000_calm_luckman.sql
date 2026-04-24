CREATE TABLE `keylogs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`key` varchar(255),
	`createdAt` varchar(255),
	CONSTRAINT `keylogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`openId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(255),
	`loginMethod` varchar(255),
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
