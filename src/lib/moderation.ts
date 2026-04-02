import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";

const client = new RekognitionClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface ModerationResult {
  safe: boolean;
  blocked: boolean;
  labels: { name: string; confidence: number; parent: string }[];
  reason?: string;
}

// Labels that should BLOCK content entirely (illegal/CSAM indicators)
const BLOCKED_LABELS = [
  "Explicit Nudity - Child",
  "Child",
  "Graphic Violence",
];

// Labels that are expected on an adult platform (allowed but logged)
const ADULT_ALLOWED_LABELS = [
  "Explicit Nudity",
  "Nudity",
  "Sexual Activity",
  "Suggestive",
  "Partial Nudity",
  "Revealing Clothes",
];

/**
 * Scan an image for prohibited content using AWS Rekognition.
 * Returns whether the image is safe to upload.
 *
 * On an adult platform, nudity/sexual content is expected and allowed.
 * Only CSAM indicators and extreme violence are blocked.
 */
export async function moderateImage(
  imageBytes: Uint8Array
): Promise<ModerationResult> {
  try {
    const command = new DetectModerationLabelsCommand({
      Image: { Bytes: imageBytes },
      MinConfidence: 50,
    });

    const response = await client.send(command);
    const labels = (response.ModerationLabels || []).map((label) => ({
      name: label.Name || "",
      confidence: label.Confidence || 0,
      parent: label.ParentName || "",
    }));

    // Check for blocked content
    for (const label of labels) {
      const fullPath = `${label.parent} - ${label.name}`.toLowerCase();
      const labelName = label.name.toLowerCase();

      for (const blocked of BLOCKED_LABELS) {
        if (
          fullPath.includes(blocked.toLowerCase()) ||
          labelName.includes(blocked.toLowerCase())
        ) {
          return {
            safe: false,
            blocked: true,
            labels,
            reason: `Content blocked: ${label.name} (${label.confidence.toFixed(0)}% confidence)`,
          };
        }
      }
    }

    return {
      safe: true,
      blocked: false,
      labels,
    };
  } catch (error) {
    console.error("Rekognition moderation error:", error);
    // Fail open — don't block uploads if the service is down
    // Log for manual review
    return {
      safe: true,
      blocked: false,
      labels: [],
      reason: "Moderation service unavailable — flagged for manual review",
    };
  }
}

/**
 * Scan an image from a URL. Downloads the image first, then scans.
 */
export async function moderateImageFromUrl(
  url: string
): Promise<ModerationResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { safe: true, blocked: false, labels: [], reason: "Could not fetch image" };
    }
    const buffer = await response.arrayBuffer();
    return moderateImage(new Uint8Array(buffer));
  } catch {
    return { safe: true, blocked: false, labels: [], reason: "Could not fetch image" };
  }
}
