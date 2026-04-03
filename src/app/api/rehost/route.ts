import { NextRequest, NextResponse } from "next/server";
import { uploadToBunny } from "@/lib/bunny";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";
import { moderateImage } from "@/lib/moderation";

const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid url" }, { status: 400 });
    }

    // Download the image from the source URL
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to download image from source URL" },
        { status: 400 }
      );
    }

    const buffer = new Uint8Array(await response.arrayBuffer());

    // Determine file extension from URL path
    const urlPath = new URL(url).pathname;
    const ext = urlPath.split(".").pop()?.toLowerCase() || "jpg";
    const isVideo = VIDEO_EXTENSIONS.includes(ext);

    // Run moderation on images (not videos)
    if (!isVideo) {
      const modResult = await moderateImage(buffer);
      if (modResult.blocked) {
        return NextResponse.json(
          { error: "blocked", reason: modResult.reason || "Content blocked by moderation" },
          { status: 403 }
        );
      }
    }

    // Upload to BunnyCDN
    const fileName = `${generateId()}.${ext}`;
    const folder = `imports/${user.id}`;
    const { url: cdnUrl } = await uploadToBunny(buffer, fileName, folder);

    return NextResponse.json({ cdnUrl, original: url });
  } catch (err) {
    console.error("Rehost error:", err);
    return NextResponse.json({ error: "Rehost failed" }, { status: 500 });
  }
}
