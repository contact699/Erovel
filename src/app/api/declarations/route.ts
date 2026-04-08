import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

interface RequestBody {
  creator_id: string;
  declaration_type: string;
  subject_name?: string;
  subject_platform?: string;
  subject_profile_url?: string;
  evidence_tier?: string;
  evidence_urls?: string[];
  evidence_metadata?: Record<string, unknown>;
  badge_level: string;
  status: string;
  grace_deadline?: string;
}

export async function POST(request: Request) {
  // 1. Authenticate via server SSR client (uses cookies, resilient to long operations)
  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await authSupabase.auth.getUser();

  if (authError || !user) {
    console.warn("[api/declarations] auth failed:", authError?.message);
    return NextResponse.json(
      { error: "You need to be logged in to create a declaration" },
      { status: 401 }
    );
  }

  // 2. Parse + validate the request body
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Required fields
  if (!body.creator_id || !body.declaration_type || !body.badge_level || !body.status) {
    return NextResponse.json(
      { error: "creator_id, declaration_type, badge_level, and status are required" },
      { status: 400 }
    );
  }

  // 3. Authorization: a creator can only create declarations for themselves.
  // (Admins could in theory create declarations for others, but the form is
  // creator-facing — admin moderation goes through a different route.)
  if (body.creator_id !== user.id) {
    console.warn("[api/declarations] creator_id mismatch", {
      authenticated_user: user.id,
      requested_creator: body.creator_id,
    });
    return NextResponse.json(
      { error: "You can only create declarations for your own account" },
      { status: 403 }
    );
  }

  // 4. Use service-role client for the insert. RLS would otherwise
  // require auth.uid() to be non-null at insert time, which can fail
  // for users with expired session tokens after long operations. Since
  // we already verified the auth server-side above, the service-role
  // bypass is safe.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("[api/declarations] service role env vars not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = createServiceClient(url, serviceKey);

  // 5. Insert the declaration
  const { data, error } = await supabase
    .from("content_rights_declarations")
    .insert({
      creator_id: body.creator_id,
      declaration_type: body.declaration_type,
      subject_name: body.subject_name ?? null,
      subject_platform: body.subject_platform ?? null,
      subject_profile_url: body.subject_profile_url ?? null,
      evidence_tier: body.evidence_tier ?? null,
      evidence_urls: body.evidence_urls ?? null,
      evidence_metadata: body.evidence_metadata ?? null,
      badge_level: body.badge_level,
      status: body.status,
      grace_deadline: body.grace_deadline ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    // Log the full Postgres error so it shows up in Vercel logs
    console.error("[api/declarations] insert failed:", {
      error: {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      },
      input: {
        creator_id: body.creator_id,
        declaration_type: body.declaration_type,
        evidence_tier: body.evidence_tier,
        evidence_url_count: body.evidence_urls?.length ?? 0,
        badge_level: body.badge_level,
        status: body.status,
      },
    });
    return NextResponse.json(
      {
        error: error?.message ?? "Failed to create declaration",
        code: error?.code,
        details: error?.details,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ declaration: data });
}
