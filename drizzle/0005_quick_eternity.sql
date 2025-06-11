CREATE UNIQUE INDEX "likes_post_user_unique_idx" ON "likes" USING btree ("post_id","user_id");--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "time_ago";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "time_ago";