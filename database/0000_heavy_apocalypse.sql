CREATE TABLE `guestBook` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`email` text(255) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guestBook_email_unique` ON `guestBook` (`email`);