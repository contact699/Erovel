import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAdminRoute() {
  const authSupabase = await createServerSupabaseClient();
  if (!authSupabase) {
    return {
      response: NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      ),
      supabase: null,
      adminUserId: null,
    };
  }

  const {
    data: { user },
    error: authError,
  } = await authSupabase.auth.getUser();

  if (authError || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      supabase: null,
      adminUserId: null,
    };
  }

  const { data: profile, error: profileError } = await authSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      supabase: null,
      adminUserId: null,
    };
  }

  if (profile.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      supabase: null,
      adminUserId: null,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return {
      response: NextResponse.json({ error: "Not configured" }, { status: 503 }),
      supabase: null,
      adminUserId: null,
    };
  }

  return {
    response: null,
    supabase: createClient(url, serviceKey),
    adminUserId: user.id,
  };
}
