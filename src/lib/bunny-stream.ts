import crypto from "crypto";

const STREAM_API_BASE = "https://video.bunnycdn.com/library";
const TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

function getLibraryId(): string {
  const id = process.env.BUNNY_STREAM_LIBRARY_ID;
  if (!id) {
    throw new Error("BUNNY_STREAM_LIBRARY_ID is not set");
  }
  return id;
}

function getApiKey(): string {
  const key = process.env.BUNNY_STREAM_API_KEY;
  if (!key) {
    throw new Error("BUNNY_STREAM_API_KEY is not set");
  }
  return key;
}

export interface StreamVideoRecord {
  guid: string;
  libraryId: number;
  title: string;
  status: number;
  thumbnailFileName: string;
}

export interface StreamUploadSession {
  videoGuid: string;
  libraryId: string;
  uploadUrl: string;
  authorizationSignature: string;
  authorizationExpire: number;
  embedUrl: string;
}

/**
 * Create a video record in BunnyCDN Stream. Returns the GUID.
 */
export async function createStreamVideo(title: string): Promise<StreamVideoRecord> {
  const libraryId = getLibraryId();
  const apiKey = getApiKey();

  const response = await fetch(`${STREAM_API_BASE}/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "<unreadable>");
    throw new Error(`Bunny Stream createVideo failed: ${response.status} ${text}`);
  }

  return (await response.json()) as StreamVideoRecord;
}

/**
 * Generate a TUS upload session for direct browser upload to Bunny Stream.
 * The signature is computed server-side so the API key never reaches the browser.
 *
 * Signature formula (per Bunny Stream docs):
 *   sha256(libraryId + apiKey + expirationTime + videoGuid)
 *
 * The browser sends the signature + expiration + videoGuid + libraryId as headers
 * to the TUS endpoint. Bunny verifies the signature server-side.
 */
export async function createStreamUploadSession(title: string): Promise<StreamUploadSession> {
  const video = await createStreamVideo(title);
  const libraryId = getLibraryId();
  const apiKey = getApiKey();

  // 4-hour expiration window (long enough for slow uploads, short enough to limit replay)
  const expirationTime = Math.floor(Date.now() / 1000) + 4 * 60 * 60;

  const signatureBase = `${libraryId}${apiKey}${expirationTime}${video.guid}`;
  const authorizationSignature = crypto
    .createHash("sha256")
    .update(signatureBase)
    .digest("hex");

  return {
    videoGuid: video.guid,
    libraryId,
    uploadUrl: TUS_ENDPOINT,
    authorizationSignature,
    authorizationExpire: expirationTime,
    embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${video.guid}`,
  };
}

/**
 * Get the embed URL for a previously-uploaded video.
 */
export function getStreamEmbedUrl(videoGuid: string): string {
  const libraryId = getLibraryId();
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}`;
}
