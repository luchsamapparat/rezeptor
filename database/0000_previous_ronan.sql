CREATE TABLE `cookbooks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`authors` text NOT NULL,
	`isbn10` text,
	`isbn13` text
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`photoFileId` text,
	`recipeFileId` text,
	`cookbookId` text,
	`pageNumber` integer,
	FOREIGN KEY (`cookbookId`) REFERENCES `cookbooks`(`id`) ON UPDATE no action ON DELETE no action
);
