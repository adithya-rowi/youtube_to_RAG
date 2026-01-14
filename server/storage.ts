import { db } from "./db";
import { type Transcript, type InsertTranscript, transcripts } from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;
  getRecentTranscripts(limit?: number): Promise<Transcript[]>;
}

export class DbStorage implements IStorage {
  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const [transcript] = await db
      .insert(transcripts)
      .values(insertTranscript)
      .returning();
    return transcript;
  }

  async getRecentTranscripts(limit = 10): Promise<Transcript[]> {
    return db
      .select()
      .from(transcripts)
      .orderBy(desc(transcripts.createdAt))
      .limit(limit);
  }
}

export const storage = new DbStorage();
