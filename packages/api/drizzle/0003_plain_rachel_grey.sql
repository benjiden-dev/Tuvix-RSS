ALTER TABLE `user_article_states` ADD `audio_position` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user_article_states` ADD `audio_duration` integer;--> statement-breakpoint
ALTER TABLE `user_article_states` ADD `audio_completed_at` integer;--> statement-breakpoint
ALTER TABLE `user_article_states` ADD `audio_last_played_at` integer;--> statement-breakpoint
CREATE INDEX `idx_user_article_states_audio_position` ON `user_article_states` (`audio_position`);