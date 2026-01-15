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

async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();

    // Try og:title meta tag first
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
    if (ogTitleMatch && ogTitleMatch[1]) {
      return ogTitleMatch[1];
    }

    // Fall back to <title> tag
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      // Remove " - YouTube" suffix
      return titleMatch[1].replace(/ - YouTube$/, "").trim();
    }

    return "Unknown Title";
  } catch (error) {
    console.error("Failed to fetch video title:", error);
    return "Unknown Title";
  }
}

function sanitizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Multiple hyphens to single
    .substring(0, 30) // Max 30 chars
    .replace(/-$/, ""); // Remove trailing hyphen
}

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

      // Fetch video title
      const videoTitle = await getVideoTitle(videoId);

      const transcriptText = transcriptItems
        .map((item) => item.text)
        .join(" ");

      const sanitizedTitle = sanitizeTitle(videoTitle);
      const filename = `gus_${sanitizedTitle}_${videoId}.md`;

      // Format as markdown
      const markdownContent = `# ${videoTitle}

**Source:** ${url}
**Video ID:** ${videoId}
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
        videoTitle,
        transcriptText,
        filename,
        status: driveResult.success ? "success" : "local_only",
      });

      return res.json({
        success: true,
        filename,
        videoTitle,
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
