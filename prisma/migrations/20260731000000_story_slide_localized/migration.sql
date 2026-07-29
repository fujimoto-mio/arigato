-- Story slide title/body become locale maps { en, ja, ko, zh }. Existing text is
-- migrated into the default locale (en) so nothing is lost.
ALTER TABLE "StorySlide" ALTER COLUMN "title" TYPE JSONB USING jsonb_build_object('en', "title");
ALTER TABLE "StorySlide" ALTER COLUMN "body" TYPE JSONB USING jsonb_build_object('en', "body");
