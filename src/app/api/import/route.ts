import { NextRequest, NextResponse } from "next/server";

const IMGCHEST_API = "https://api.imgchest.com/v1";

// Extract post ID from various imgchest URL formats
function extractPostId(url: string): string | null {
  const match = url.match(/imgchest\.com\/p\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const postId = extractPostId(url);
    if (!postId) {
      return NextResponse.json(
        { error: "Invalid imgchest URL. Expected format: https://imgchest.com/p/..." },
        { status: 400 }
      );
    }

    const apiToken = process.env.IMGCHEST_API_TOKEN;

    if (!apiToken) {
      return NextResponse.json(
        { error: "imgchest API token not configured. Add IMGCHEST_API_TOKEN to environment variables." },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`,
    };

    const response = await fetch(`${IMGCHEST_API}/post/${postId}`, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "API authentication failed. Check IMGCHEST_API_TOKEN." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `imgchest API error: ${response.status}` },
        { status: 502 }
      );
    }

    const json = await response.json();
    const post = json.data;

    const images = (post.images || [])
      .map(
        (img: { id: string; link: string; description: string | null; position: number }) => {
          const url = img.link;
          // Parse extension from the pathname so query strings don't
          // poison detection (e.g. xxx.mp4?v=1 would otherwise become "mp4?v=1").
          let ext = "";
          try {
            const pathname = new URL(url).pathname;
            ext = pathname.split(".").pop()?.toLowerCase() || "";
          } catch {
            ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() || "";
          }
          const isVideo = ["mp4", "webm", "mov", "m4v"].includes(ext);
          return {
            id: img.id,
            url,
            description: img.description,
            position: img.position,
            type: isVideo ? "video" as const : "image" as const,
          };
        }
      )
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position);

    return NextResponse.json({
      id: post.id,
      title: post.title || "Untitled Gallery",
      imageCount: post.image_count,
      nsfw: !!post.nsfw,
      images,
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}
