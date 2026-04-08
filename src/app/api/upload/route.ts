import { NextRequest, NextResponse } from "next/server";
import { uploadToBunny } from "@/lib/bunny";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";
import { moderateImage } from "@/lib/moderation";

const MAX_DEFAULT_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_FILE_SIZE = 250 * 1024 * 1024; // 250MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
];

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const maxFileSize = isVideo ? MAX_VIDEO_FILE_SIZE : MAX_DEFAULT_FILE_SIZE;
    const maxFileSizeLabel = isVideo ? "250MB" : "50MB";

    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `File too large (max ${maxFileSizeLabel})` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const fileName = `${generateId()}.${ext}`;
    const folder = `uploads/${user.id}`;

    // Determine media type
    let mediaType: "image" | "gif" | "video" = "image";
    if (file.type === "image/gif") mediaType = "gif";
    else if (file.type.startsWith("video/")) mediaType = "video";

    const buffer = new Uint8Array(await file.arrayBuffer());

    // Scan images for prohibited content (skip videos — Rekognition is image-only)
    if (file.type.startsWith("image/")) {
      const modResult = await moderateImage(buffer);
      if (modResult.blocked) {
        return NextResponse.json(
          { error: modResult.reason || "Content blocked by moderation" },
          { status: 403 }
        );
      }
    }

    // Upload to BunnyCDN
    const { url, cdnPath } = await uploadToBunny(buffer, fileName, folder);

    // Record in database
    const { data: media, error } = await supabase
      .from("media")
      .insert({
        uploader_id: user.id,
        url,
        cdn_path: cdnPath,
        type: mediaType,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to save media record" }, { status: 500 });
    }

    return NextResponse.json({ media });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
