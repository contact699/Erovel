# Imgchest Image Re-hosting & Taboo Content Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Re-host imported imgchest images on BunnyCDN (with moderation), migrate existing content, add taboo content policy with automatic disclaimer, and fix tag persistence.

**Architecture:** New `/api/rehost` endpoint downloads an image from a URL, runs it through AWS Rekognition, uploads to BunnyCDN, and returns the CDN URL. The import page calls this for each image before saving. A separate admin endpoint migrates existing content. The story reader shows a fiction disclaimer on Taboo-category stories. Tags are persisted via new query functions.

**Tech Stack:** Next.js API routes, BunnyCDN (`lib/bunny.ts`), AWS Rekognition (`lib/moderation.ts`), Supabase

---

### Task 1: Create `/api/rehost` Endpoint

**Files:**
- Create: `src/app/api/rehost/route.ts`

**Step 1: Create the rehost endpoint**

This endpoint accepts a URL and a user ID, downloads the image, moderates it, uploads to BunnyCDN, and returns the CDN URL.

```typescript
// src/app/api/rehost/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadToBunny } from "@/lib/bunny";
import { moderateImage } from "@/lib/moderation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";

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

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Download the image
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to download image" }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") || "";
    const buffer = new Uint8Array(await response.arrayBuffer());

    // Determine file extension from URL or content type
    const urlExt = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
    const isVideo = ["mp4", "webm", "mov"].includes(urlExt) || contentType.startsWith("video/");
    const ext = urlExt || (isVideo ? "mp4" : "jpg");

    // Run moderation on images (not videos — Rekognition is image-only)
    if (!isVideo) {
      const modResult = await moderateImage(buffer);
      if (modResult.blocked) {
        return NextResponse.json({
          error: "blocked",
          reason: modResult.reason || "Content blocked by moderation",
        }, { status: 403 });
      }
    }

    // Upload to BunnyCDN
    const fileName = `${generateId()}.${ext}`;
    const folder = `imports/${user.id}`;
    const { url: cdnUrl } = await uploadToBunny(buffer, fileName, folder);

    return NextResponse.json({ cdnUrl, original: url });
  } catch (err) {
    console.error("[Rehost] Error:", err);
    return NextResponse.json({ error: "Rehost failed" }, { status: 500 });
  }
}
```

**Step 2: Verify the endpoint compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/rehost/route.ts
git commit -m "feat: add /api/rehost endpoint for downloading and re-hosting images to BunnyCDN"
```

---

### Task 2: Integrate Re-hosting Into Import Page

**Files:**
- Modify: `src/app/dashboard/import/page.tsx`

**Step 1: Add rehost helper function and progress state**

Add after the existing state declarations (around line 77):

```typescript
const [rehostProgress, setRehostProgress] = useState({ current: 0, total: 0, failed: 0 });
const [rehosting, setRehosting] = useState(false);

async function rehostImage(imageUrl: string): Promise<string> {
  const res = await fetch("/api/rehost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: imageUrl }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.error === "blocked") {
      throw new Error(`blocked:${data.reason}`);
    }
    throw new Error("rehost_failed");
  }
  const data = await res.json();
  return data.cdnUrl;
}

async function rehostAllImages(chaptersToRehost: ChapterImport[]): Promise<ChapterImport[]> {
  // Count total images to rehost
  const allImages = chaptersToRehost.flatMap(ch =>
    ch.images.filter(img => img.selected)
  );
  setRehostProgress({ current: 0, total: allImages.length, failed: 0 });
  setRehosting(true);

  let current = 0;
  let failed = 0;
  const updatedChapters = [...chaptersToRehost];

  for (let ci = 0; ci < updatedChapters.length; ci++) {
    const ch = updatedChapters[ci];
    const updatedImages = [...ch.images];

    for (let ii = 0; ii < updatedImages.length; ii++) {
      const img = updatedImages[ii];
      if (!img.selected) continue;

      try {
        const cdnUrl = await rehostImage(img.url);
        updatedImages[ii] = { ...img, url: cdnUrl };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.startsWith("blocked:")) {
          // Flagged by moderation — deselect this image
          updatedImages[ii] = { ...img, selected: false };
          toast("error", `Image blocked by moderation and excluded`);
        }
        // For other errors, keep the original imgchest URL as fallback
        failed++;
      }

      current++;
      setRehostProgress({ current, total: allImages.length, failed });
    }

    updatedChapters[ci] = { ...ch, images: updatedImages };
  }

  setRehosting(false);
  return updatedChapters;
}
```

**Step 2: Modify `handlePublish` to call rehost before saving**

Replace the existing `handlePublish` function (lines 261-352). Insert the rehost call right before story creation. The key change is in the `try` block — after session validation and before `createStory`:

```typescript
// Add right after the validChapters check (around line 288):

      // Re-host all images from imgchest to BunnyCDN
      const rehostedChapters = await rehostAllImages(validChapters);
      const finalChapters = rehostedChapters.filter(
        (ch) => !ch.error && ch.images.some((img) => img.selected)
      );

      if (finalChapters.length === 0) {
        setError("No chapters with valid images after moderation.");
        setPublishing(false);
        return;
      }

      const totalImages = finalChapters.reduce(
        (sum, ch) => sum + ch.images.filter((img) => img.selected).length,
        0
      );

      const firstImage = finalChapters[0]?.images.find((img) => img.selected && img.type === "image");
```

Then use `finalChapters` instead of `validChapters` in the rest of the function (story creation, chapter loop).

**Step 3: Add progress UI in the review step**

In the review step JSX (around line 802), add a progress indicator when rehosting:

```tsx
{(publishing || rehosting) && rehostProgress.total > 0 && (
  <div className="mb-4 space-y-2">
    <div className="flex items-center justify-between text-xs text-muted">
      <span>Uploading images to CDN...</span>
      <span>{rehostProgress.current}/{rehostProgress.total}{rehostProgress.failed > 0 ? ` (${rehostProgress.failed} failed)` : ""}</span>
    </div>
    <div className="h-1.5 bg-border rounded-full overflow-hidden">
      <div
        className="h-full bg-accent transition-all duration-200"
        style={{ width: `${(rehostProgress.current / rehostProgress.total) * 100}%` }}
      />
    </div>
  </div>
)}
```

**Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/dashboard/import/page.tsx
git commit -m "feat: re-host imgchest images to BunnyCDN during import with progress UI"
```

---

### Task 3: Create Admin Migration Endpoint

**Files:**
- Create: `src/app/api/admin/rehost-migrate/route.ts`

**Step 1: Create the migration endpoint**

This endpoint scans existing chapter content and story covers for imgchest URLs, downloads and re-hosts them. Admin-only, run manually once.

```typescript
// src/app/api/admin/rehost-migrate/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadToBunny } from "@/lib/bunny";
import { moderateImage } from "@/lib/moderation";
import { generateId } from "@/lib/utils";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const IMGCHEST_REGEX = /https?:\/\/[^"'\s]*imgchest\.com[^"'\s]*/g;

async function rehostUrl(imageUrl: string, userId: string): Promise<{ cdnUrl: string; blocked: boolean }> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);

  const buffer = new Uint8Array(await response.arrayBuffer());
  const urlExt = imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const isVideo = ["mp4", "webm", "mov"].includes(urlExt);

  if (!isVideo) {
    const modResult = await moderateImage(buffer);
    if (modResult.blocked) {
      return { cdnUrl: "", blocked: true };
    }
  }

  const fileName = `${generateId()}.${urlExt}`;
  const folder = `imports/${userId}`;
  const { url: cdnUrl } = await uploadToBunny(buffer, fileName, folder);
  return { cdnUrl, blocked: false };
}

function replaceUrlsInJson(obj: unknown, urlMap: Map<string, string>): unknown {
  if (typeof obj === "string") {
    let result = obj;
    for (const [original, replacement] of urlMap) {
      if (result === original) return replacement;
      result = result.replaceAll(original, replacement);
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replaceUrlsInJson(item, urlMap));
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceUrlsInJson(value, urlMap);
    }
    return result;
  }
  return obj;
}

export async function POST() {
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const log: string[] = [];
    let successCount = 0;
    let failCount = 0;
    let blockedCount = 0;
    let chaptersUpdated = 0;
    let coversUpdated = 0;

    // 1. Migrate chapter content
    const { data: chapters } = await supabase
      .from("chapter_content")
      .select("id, chapter_id, content_json, chapters!inner(story_id, stories!inner(creator_id))")
      .limit(1000);

    if (chapters) {
      for (const row of chapters) {
        const json = JSON.stringify(row.content_json || {});
        const imgchestUrls = [...new Set(json.match(IMGCHEST_REGEX) || [])];
        if (imgchestUrls.length === 0) continue;

        const creatorId = (row as Record<string, unknown> & { chapters: { stories: { creator_id: string } } }).chapters?.stories?.creator_id || "unknown";
        const urlMap = new Map<string, string>();

        for (const url of imgchestUrls) {
          try {
            const { cdnUrl, blocked } = await rehostUrl(url, creatorId);
            if (blocked) {
              blockedCount++;
              log.push(`BLOCKED: ${url}`);
            } else {
              urlMap.set(url, cdnUrl);
              successCount++;
            }
          } catch (err) {
            failCount++;
            log.push(`FAIL: ${url} - ${err instanceof Error ? err.message : "unknown"}`);
          }
        }

        if (urlMap.size > 0) {
          const updatedJson = replaceUrlsInJson(row.content_json, urlMap);
          await supabase
            .from("chapter_content")
            .update({ content_json: updatedJson })
            .eq("id", row.id);
          chaptersUpdated++;
        }
      }
    }

    // 2. Migrate story cover images
    const { data: stories } = await supabase
      .from("stories")
      .select("id, creator_id, cover_image_url")
      .like("cover_image_url", "%imgchest%");

    if (stories) {
      for (const story of stories) {
        if (!story.cover_image_url) continue;
        try {
          const { cdnUrl, blocked } = await rehostUrl(story.cover_image_url, story.creator_id);
          if (!blocked && cdnUrl) {
            await supabase
              .from("stories")
              .update({ cover_image_url: cdnUrl })
              .eq("id", story.id);
            coversUpdated++;
            successCount++;
          } else if (blocked) {
            blockedCount++;
            log.push(`BLOCKED cover: story ${story.id}`);
          }
        } catch (err) {
          failCount++;
          log.push(`FAIL cover: story ${story.id} - ${err instanceof Error ? err.message : "unknown"}`);
        }
      }
    }

    return NextResponse.json({
      summary: {
        imagesRehosted: successCount,
        imagesFailed: failCount,
        imagesBlocked: blockedCount,
        chaptersUpdated,
        coversUpdated,
      },
      log,
    });
  } catch (err) {
    console.error("[Rehost migrate] Error:", err);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/admin/rehost-migrate/route.ts
git commit -m "feat: add admin migration endpoint to re-host existing imgchest images"
```

---

### Task 4: Add Taboo Content Fiction Disclaimer

**Files:**
- Modify: `src/app/story/[slug]/[chapter]/page.tsx`
- Modify: `src/app/story/[slug]/page.tsx`

**Step 1: Add disclaimer to chapter reader page**

In `src/app/story/[slug]/[chapter]/page.tsx`, add a disclaimer banner after the chapter header section and before the chapter content section. Insert after the closing `</div>` of the chapter header (after line 239) and before the `{/* ---- Chapter content ---- */}` comment (line 241):

```tsx
      {/* ---- Taboo fiction disclaimer ---- */}
      {story.category?.slug === "taboo" && (
        <div className="max-w-3xl mx-auto px-4 mb-4">
          <div className="text-xs text-muted text-center py-2 px-4 bg-surface border border-border rounded-lg">
            This is a work of fiction. All characters depicted are 18 years of age or older.
          </div>
        </div>
      )}
```

**Step 2: Add disclaimer to story overview page**

In `src/app/story/[slug]/page.tsx`, add the same disclaimer near the top of the story info section, after the story title/description area. Find the story metadata section and add:

```tsx
{story.category?.slug === "taboo" && (
  <div className="text-xs text-muted text-center py-2 px-4 bg-surface border border-border rounded-lg">
    This is a work of fiction. All characters depicted are 18 years of age or older.
  </div>
)}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/app/story/[slug]/[chapter]/page.tsx src/app/story/[slug]/page.tsx
git commit -m "feat: add fiction disclaimer banner on taboo-category stories"
```

---

### Task 5: Update Terms of Service

**Files:**
- Modify: `src/app/terms/page.tsx`

**Step 1: Add taboo content policy section**

In `src/app/terms/page.tsx`, add a new subsection within the Content Standards section (section 5, after the existing prohibited content list at line 127 and before the tagging paragraph at line 128). Insert:

```tsx
          <p>
            <strong>Permitted Adult Fiction Categories:</strong> Erovel permits a wide range of
            fictional adult content, including taboo and incest-themed fiction, subject to the
            following mandatory requirements:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              All characters depicted in sexual or romantic contexts must be explicitly established
              as eighteen (18) years of age or older within the content.
            </li>
            <li>
              All content must be clearly presented and understood as fiction.
            </li>
            <li>
              The Platform will automatically display a fiction and age disclaimer on all content
              published under the Taboo category.
            </li>
            <li>
              Creators who publish taboo content must accurately categorize it under the Taboo
              category and apply appropriate tags to ensure readers can make informed choices.
            </li>
          </ol>
          <p>
            Violation of these requirements — particularly any implication that characters are
            under 18 — will result in immediate content removal and account termination.
          </p>
```

Also update the "Last updated" date to April 3, 2026.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/terms/page.tsx
git commit -m "feat: add taboo content policy section to Terms of Service"
```

---

### Task 6: Fix Tag Persistence

**Files:**
- Modify: `src/lib/supabase/queries.ts`
- Modify: `src/app/dashboard/stories/new/page.tsx`
- Modify: `src/app/dashboard/stories/[id]/edit/page.tsx`

**Step 1: Add tag persistence functions to queries.ts**

Add these functions to `src/lib/supabase/queries.ts`:

```typescript
/** Persist tags for a story — creates missing tags, links all to story */
export async function saveStoryTags(storyId: string, tagNames: string[]): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  if (!supabase || tagNames.length === 0) return;

  // Normalize tag names
  const normalized = tagNames.map(t => t.trim().toLowerCase()).filter(Boolean);
  if (normalized.length === 0) return;

  // Remove existing story_tags
  await supabase.from("story_tags").delete().eq("story_id", storyId);

  // Upsert tags (create if not exist)
  for (const name of normalized) {
    const slug = name.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Try to find existing tag
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .single();

    let tagId: string;
    if (existing) {
      tagId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("tags")
        .insert({ name, slug })
        .select("id")
        .single();
      if (!created) continue;
      tagId = created.id;
    }

    // Link tag to story
    await supabase.from("story_tags").insert({ story_id: storyId, tag_id: tagId });
  }
}
```

**Step 2: Call `saveStoryTags` in story creation page**

In `src/app/dashboard/stories/new/page.tsx`, find where the story is created and chapters are saved. After story creation succeeds and before navigating away, add:

```typescript
// Save tags
if (tags.length > 0) {
  await saveStoryTags(story.id, tags);
}
```

Import `saveStoryTags` from `@/lib/supabase/queries`.

**Step 3: Call `saveStoryTags` in story edit page**

In `src/app/dashboard/stories/[id]/edit/page.tsx`, find the save/update handler. After story update succeeds, add the same call:

```typescript
// Save tags
await saveStoryTags(storyId, tags);
```

Import `saveStoryTags` from `@/lib/supabase/queries`.

**Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/lib/supabase/queries.ts src/app/dashboard/stories/new/page.tsx src/app/dashboard/stories/[id]/edit/page.tsx
git commit -m "fix: persist tags to database on story creation and edit"
```

---

### Task 7: Integration Test & Deploy

**Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run the build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Final commit if any fixups needed**

**Step 4: Deploy**

Run: `git push origin master && vercel --prod`

**Step 5: Run migration for existing content**

After deploy, trigger the migration endpoint:

```bash
curl -X POST https://www.erovel.com/api/admin/rehost-migrate
```

Review the output for any failures or blocked images.
