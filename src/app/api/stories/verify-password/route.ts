import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { storyId, password } = await request.json();
    if (!storyId || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const { data: story } = await supabase
      .from("stories")
      .select("password_hash")
      .eq("id", storyId)
      .single();

    if (!story || !story.password_hash) {
      return NextResponse.json({ error: "Story not found or no password" }, { status: 404 });
    }

    const match = story.password_hash === hashPassword(password);
    return NextResponse.json({ success: match });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
