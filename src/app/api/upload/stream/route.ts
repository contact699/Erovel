import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createStreamUploadSession } from "@/lib/bunny-stream";

interface RequestBody {
  filename: string;
}

export async function POST(request: Request) {
  // Auth check — must be a logged-in user (any role can upload media for now)
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
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

  if (!body.filename || typeof body.filename !== "string") {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  // Create the Stream upload session
  let session;
  try {
    // Use uploader_id + filename as the title for traceability in the Stream dashboard
    const title = `${user.id}/${body.filename}`;
    session = await createStreamUploadSession(title);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("[upload/stream] failed to create session:", msg);
    return NextResponse.json(
      { error: "Failed to create upload session" },
      { status: 502 }
    );
  }

  return NextResponse.json(session);
}
