import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transcripts = pgTable("transcripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  youtubeUrl: text("youtube_url").notNull(),
  videoId: text("video_id").notNull(),
  videoTitle: text("video_title"),
  transcriptText: text("transcript_text").notNull(),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("success"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranscriptSchema = createInsertSchema(transcripts).omit({
  id: true,
  createdAt: true,
});

export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;
