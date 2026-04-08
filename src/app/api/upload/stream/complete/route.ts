import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getStreamEmbedUrl } from "@/lib/bunny-stream";

interface RequestBody {
  videoGuid: string;
  fileSize: number;
}

export async function POST(request: Request) {
  // Auth
  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user }, error: authError } = await authSupabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse + validate
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.videoGuid || typeof body.fileSize !== "number") {
    return NextResponse.json({ error: "videoGuid and fileSize required" }, { status: 400 });
  }

  // Use service-role client for the insert (RLS would block uploader writes otherwise)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = createServiceClient(url, serviceKey);

  const embedUrl = getStreamEmbedUrl(body.videoGuid);

  const { data: media, error } = await supabase
    .from("media")
    .insert({
      uploader_id: user.id,
      url: embedUrl,
      cdn_path: `stream/${body.videoGuid}`,
      type: "video",
      file_size: body.fileSize,
    })
    .select()
    .single();

  if (error || !media) {
    console.error("[upload/stream/complete] failed to insert media row:", error?.message);
    return NextResponse.json({ error: "Failed to record upload" }, { status: 500 });
  }

  return NextResponse.json({ media });
}
