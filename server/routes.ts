import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { fetchTranscript } from "youtube-transcript-plus";
import { insertTranscriptSchema } from "@shared/schema";
import { z } from "zod";
import { uploadToDrive } from "./driveService";

const processRequestSchema = z.object({
  url: z.string().url(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/process", async (req, res) => {
    try {
      const { url } = processRequestSchema.parse(req.body);
      
      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      // Try Indonesian first, then fall back to any available
      let transcriptItems;
      let language = "unknown";

      // Priority: manual Indonesian -> auto Indonesian -> any available
      const langPriority = ["id", "id-ID"];

      for (const lang of langPriority) {
        try {
          transcriptItems = await fetchTranscript(videoId, { lang });
          language = lang;
          break;
        } catch {
          // Continue to next language
        }
      }

      // Fall back to default if Indonesian not available
      if (!transcriptItems) {
        transcriptItems = await fetchTranscript(videoId);
        language = "default";
      }

      if (!transcriptItems || transcriptItems.length === 0) {
        return res.status(404).json({ error: "No transcript available for this video" });
      }

      const transcriptText = transcriptItems
        .map((item) => item.text)
        .join(" ");

      const filename = `transcript_${videoId}_${Date.now()}.md`;

      // Format as markdown
      const markdownContent = `# YouTube Transcript

**Video ID:** ${videoId}
**URL:** ${url}
**Language:** ${language}
**Extracted:** ${new Date().toISOString()}

---

${transcriptText}
`;

      // Try uploading to Google Drive
      const driveResult = await uploadToDrive(markdownContent, filename);

      const savedTranscript = await storage.createTranscript({
        youtubeUrl: url,
        videoId,
        videoTitle: null,
        transcriptText,
        filename,
        status: driveResult.success ? "success" : "local_only",
      });

      return res.json({
        success: true,
        filename,
        transcriptId: savedTranscript.id,
        content: markdownContent,
        language,
        gdrive: driveResult.success,
        gdriveFileId: driveResult.fileId,
        gdriveLink: driveResult.webViewLink,
        gdriveError: driveResult.error,
      });
    } catch (error: any) {
      console.error("Error processing transcript:", error);
      return res.status(500).json({
        error: "Failed to process video transcript",
        details: error.message,
      });
    }
  });

  app.get("/api/transcripts", async (req, res) => {
    try {
      const transcripts = await storage.getRecentTranscripts();
      return res.json(transcripts);
    } catch (error: any) {
      console.error("Error fetching transcripts:", error);
      return res.status(500).json({ error: "Failed to fetch transcripts" });
    }
  });

  return httpServer;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
