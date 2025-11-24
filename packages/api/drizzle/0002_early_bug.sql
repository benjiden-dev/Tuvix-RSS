ALTER TABLE `articles` ADD `audio_url` text;--> statement-breakpoint
CREATE INDEX `idx_articles_audio_url` ON `articles` (`audio_url`);