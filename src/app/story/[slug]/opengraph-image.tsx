import { ImageResponse } from "next/og";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const alt = "Story on Erovel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function StoryOGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createServerSupabaseClient();

  let title = "Story";
  let creator = "Unknown";
  let description = "Read on Erovel";

  if (supabase) {
    const { data: story } = await supabase
      .from("stories")
      .select("title, description, creator:profiles!creator_id(display_name)")
      .eq("slug", slug)
      .single();

    if (story) {
      title = story.title;
      description = story.description || "Read on Erovel";
      creator = (story.creator as { display_name?: string } | null)?.display_name || "Unknown";
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0c0a09",
          color: "#f5f0eb",
          padding: "60px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: "16px", color: "#d4a574", margin: "0 0 12px 0" }}>
            EROVEL
          </p>
          <h1 style={{ fontSize: "52px", fontWeight: "bold", margin: "0", lineHeight: "1.1", maxWidth: "900px" }}>
            {title.length > 60 ? title.slice(0, 60) + "..." : title}
          </h1>
          <p style={{ fontSize: "20px", color: "#a8a29e", marginTop: "16px", maxWidth: "800px" }}>
            {description.length > 120 ? description.slice(0, 120) + "..." : description}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "20px",
              backgroundColor: "#1c1917",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              color: "#d4a574",
            }}
          >
            {creator.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: "18px", color: "#a8a29e" }}>
            by {creator}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
