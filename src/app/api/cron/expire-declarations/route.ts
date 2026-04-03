import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  // Find expired pending declarations
  const { data: expired } = await supabase
    .from("content_rights_declarations")
    .select("id, creator_id, subject_name")
    .in("status", ["pending", "more_info_requested"])
    .lt("grace_deadline", new Date().toISOString());

  if (!expired || expired.length === 0) {
    return NextResponse.json({ expired: 0, unpublished: 0 });
  }

  let unpublishedCount = 0;

  for (const declaration of expired) {
    // Mark as expired
    await supabase
      .from("content_rights_declarations")
      .update({ status: "expired" })
      .eq("id", declaration.id);

    // Find linked stories
    const { data: linkedStories } = await supabase
      .from("story_rights_declarations")
      .select("story_id")
      .eq("declaration_id", declaration.id);

    for (const link of linkedStories || []) {
      // Check for other approved declarations on this story
      const { data: otherDeclarations } = await supabase
        .from("story_rights_declarations")
        .select("declaration:content_rights_declarations(status)")
        .eq("story_id", link.story_id)
        .neq("declaration_id", declaration.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasApproved = (otherDeclarations || []).some((d: any) => {
        const decl = Array.isArray(d.declaration)
          ? d.declaration[0]
          : d.declaration;
        return decl?.status === "approved";
      });

      if (!hasApproved) {
        await supabase
          .from("stories")
          .update({ status: "draft" })
          .eq("id", link.story_id)
          .eq("status", "published");
        unpublishedCount++;
      }
    }

    // Notify creator
    await supabase.from("notifications").insert({
      user_id: declaration.creator_id,
      type: "rights_expired",
      title: "Rights declaration expired",
      body: `Your permission documentation for "${declaration.subject_name || "content"}" has expired. Associated stories have been unpublished. Please submit updated documentation.`,
      link: "/dashboard/stories",
    });
  }

  return NextResponse.json({
    expired: expired.length,
    unpublished: unpublishedCount,
  });
}
