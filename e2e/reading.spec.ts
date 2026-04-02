import { test, expect } from "@playwright/test";
import { bypassAgeGate, createTestUser, deleteTestUser, login, SUPABASE_URL, SERVICE_ROLE_KEY } from "./helpers";

let reader: { email: string; password: string; username: string; userId: string };

test.beforeAll(async () => {
  reader = await createTestUser("reader", Date.now().toString());
});

test.afterAll(async () => {
  if (reader?.userId) await deleteTestUser(reader.userId);
});

test.describe("Reading Experience", () => {
  test.beforeEach(async ({ page }) => {
    await bypassAgeGate(page);
  });

  test("story page loads with story content", async ({ page }) => {
    // Navigate to browse and click first story
    await page.goto("/browse");
    await page.waitForTimeout(2000);
    const storyCard = page.locator("[href*='/story/']").first();
    if (await storyCard.isVisible()) {
      await storyCard.click();
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("chapter reader loads", async ({ page }) => {
    // Try to load a known story
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    });
    const stories = await res.json();
    if (stories.length > 0) {
      await page.goto(`/story/${stories[0].slug}/1`);
      await page.waitForTimeout(2000);
      // Should see chapter content area
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("lightbox opens on image click", async ({ page }) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    });
    const stories = await res.json();
    if (stories.length > 0) {
      await page.goto(`/story/${stories[0].slug}/1`);
      await page.waitForTimeout(3000);
      const img = page.locator("img[src*='imgchest']").first();
      if (await img.isVisible()) {
        await img.click();
        // Lightbox should appear
        await expect(page.locator("[class*='fixed'][class*='z-']")).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test("bookmarks page requires auth", async ({ page }) => {
    await page.goto("/bookmarks");
    await expect(page.getByText(/log in/i)).toBeVisible();
  });

  test("reading history page requires auth", async ({ page }) => {
    await page.goto("/reading-history");
    await expect(page.getByText(/log in/i)).toBeVisible();
  });

  test("comment form requires auth", async ({ page }) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    });
    const stories = await res.json();
    if (stories.length > 0) {
      await page.goto(`/story/${stories[0].slug}`);
      await page.waitForTimeout(2000);
      await expect(page.getByText(/log in to comment/i)).toBeVisible();
    }
  });

  test("authenticated user can see comment form", async ({ page }) => {
    await login(page, reader.email, reader.password);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    });
    const stories = await res.json();
    if (stories.length > 0) {
      await page.goto(`/story/${stories[0].slug}`);
      await page.waitForTimeout(2000);
      await expect(page.locator("textarea")).toBeVisible();
    }
  });

  test("search works", async ({ page }) => {
    await page.goto("/search");
    await page.fill('#search', 'wife');
    await page.click("text=Search");
    await page.waitForTimeout(2000);
    // Should show results or no results message
    const hasResults = await page.getByText(/result/i).isVisible();
    const hasNoResults = await page.getByText(/no stories found/i).isVisible();
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test("creator profile page loads", async ({ page }) => {
    // Get a creator username
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=username&role=eq.creator&limit=1`, {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    });
    const profiles = await res.json();
    if (profiles.length > 0) {
      await page.goto(`/creator/${profiles[0].username}`);
      await expect(page.getByText("Stories")).toBeVisible();
      await expect(page.getByText("About")).toBeVisible();
    }
  });

  test("share button is present on story page", async ({ page }) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    });
    const stories = await res.json();
    if (stories.length > 0) {
      await page.goto(`/story/${stories[0].slug}`);
      await page.waitForTimeout(2000);
      // Share button should exist
      await expect(page.locator("button[title*='Share'], button[title*='Copy']")).toBeVisible();
    }
  });
});
