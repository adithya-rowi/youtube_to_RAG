import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

const FOLDER_ID = "1nZkT0cSOtEDEOj-qC13cyitK6ll6G2JO";

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

function getServiceAccountCredentials(): ServiceAccountCredentials {
  // Try environment variable first
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON environment variable");
    }
  }

  // Fall back to file
  const filePath = path.join(process.cwd(), "service_account.json");
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  }

  throw new Error(
    "Google Drive credentials not found. Set GOOGLE_SERVICE_ACCOUNT_JSON env var or create service_account.json file"
  );
}

function getDriveClient() {
  const credentials = getServiceAccountCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return google.drive({ version: "v3", auth });
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

export async function uploadToDrive(
  content: string,
  filename: string
): Promise<UploadResult> {
  try {
    const drive = getDriveClient();

    // Create file metadata
    const fileMetadata = {
      name: filename,
      parents: [FOLDER_ID],
    };

    // Create media with markdown content
    const media = {
      mimeType: "text/markdown",
      body: content,
    };

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    return {
      success: true,
      fileId: response.data.id || undefined,
      webViewLink: response.data.webViewLink || undefined,
    };
  } catch (error: any) {
    console.error("Google Drive upload error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to upload to Google Drive",
    };
  }
}
