import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { moderateImageFromUrl } from "@/lib/moderation";

/**
 * Scan an image URL for prohibited content.
 * Used by the import tool to check imgchest images before publishing.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { urls } = await request.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs array required" }, { status: 400 });
    }

    // Limit to 50 images per request to prevent abuse
    const toScan = urls.slice(0, 50);

    const results = await Promise.allSettled(
      toScan.map(async (url: string) => {
        const result = await moderateImageFromUrl(url);
        return { url, ...result };
      })
    );

    const scanned = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { url: toScan[i], safe: true, blocked: false, labels: [], reason: "Scan failed" };
    });

    const blocked = scanned.filter((r) => r.blocked);

    return NextResponse.json({
      total: scanned.length,
      blocked: blocked.length,
      results: scanned,
    });
  } catch (err) {
    console.error("Moderation error:", err);
    return NextResponse.json({ error: "Moderation failed" }, { status: 500 });
  }
}
