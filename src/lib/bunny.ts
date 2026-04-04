// BunnyCDN upload utility — server-side only (API routes)

import crypto from "crypto";

const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE!;
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!;
const STORAGE_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME!;
const CDN_URL = process.env.NEXT_PUBLIC_BUNNY_CDN_URL!;

export interface UploadResult {
  url: string;       // public CDN URL
  cdnPath: string;   // path within storage zone
}

/**
 * Upload a file to BunnyCDN storage.
 * Call this from API routes only (server-side), never from the client.
 */
export async function uploadToBunny(
  file: Uint8Array,
  fileName: string,
  folder: string = "media"
): Promise<UploadResult> {
  const cdnPath = `/${folder}/${fileName}`;
  const uploadUrl = `https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}${cdnPath}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: STORAGE_PASSWORD,
      "Content-Type": "application/octet-stream",
    },
    body: file as unknown as BodyInit,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BunnyCDN upload failed: ${response.status} ${text}`);
  }

  return {
    url: `${CDN_URL}${cdnPath}`,
    cdnPath,
  };
}

/**
 * Delete a file from BunnyCDN storage.
 */
export async function deleteFromBunny(cdnPath: string): Promise<void> {
  const deleteUrl = `https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}${cdnPath}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      AccessKey: STORAGE_PASSWORD,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`BunnyCDN delete failed: ${response.status}`);
  }
}

/**
 * Generate a signed BunnyCDN URL with token authentication.
 * Requires BUNNY_CDN_TOKEN to be set (configured in BunnyCDN pull zone settings).
 * If no token is configured, returns the URL unsigned (graceful degradation).
 */
export function signCdnUrl(url: string, expirySeconds: number = 14400): string {
  const token = process.env.BUNNY_CDN_TOKEN;
  if (!token) return url; // Graceful degradation — no token = unsigned URLs

  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL;
  if (!cdnUrl || !url.startsWith(cdnUrl)) return url; // Not a CDN URL

  const path = url.replace(cdnUrl, "");
  const expires = Math.floor(Date.now() / 1000) + expirySeconds;

  // BunnyCDN token auth: base64url(sha256(token + path + expires))
  const hashableBase = token + path + expires;
  const hash = crypto
    .createHash("sha256")
    .update(hashableBase)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${hash}&expires=${expires}`;
}
