CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`recipeId` text NOT NULL,
	`quantity` text,
	`unit` text,
	`name` text NOT NULL,
	`notes` text,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`recipeId`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `recipes` ADD `instructions` text NOT NULL;--> statement-breakpoint
ALTER TABLE `recipes` DROP COLUMN `content`;