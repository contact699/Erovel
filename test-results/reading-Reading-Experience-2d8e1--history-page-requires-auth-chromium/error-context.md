# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reading.spec.ts >> Reading Experience >> reading history page requires auth
- Location: e2e\reading.spec.ts:66:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/log in/i)
Expected: visible
Error: strict mode violation: getByText(/log in/i) resolved to 3 elements:
    1) <button class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-foreground hover:bg-surface-hover px-3 py-1.5 text-sm">Log in</button> aka getByRole('banner').getByRole('button', { name: 'Log in' })
    2) <p class="text-muted mb-6">Log in to see your reading history.</p> aka getByText('Log in to see your reading')
    3) <button class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-accent text-white hover:bg-accent-hover px-4 py-2 text-sm">Log in</button> aka getByRole('main').getByRole('button', { name: 'Log in' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/log in/i)

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { bypassAgeGate, createTestUser, deleteTestUser, login, SUPABASE_URL, SERVICE_ROLE_KEY } from "./helpers";
  3   | 
  4   | let reader: { email: string; password: string; username: string; userId: string };
  5   | 
  6   | test.beforeAll(async () => {
  7   |   reader = await createTestUser("reader", Date.now().toString());
  8   | });
  9   | 
  10  | test.afterAll(async () => {
  11  |   if (reader?.userId) await deleteTestUser(reader.userId);
  12  | });
  13  | 
  14  | test.describe("Reading Experience", () => {
  15  |   test.beforeEach(async ({ page }) => {
  16  |     await bypassAgeGate(page);
  17  |   });
  18  | 
  19  |   test("story page loads with story content", async ({ page }) => {
  20  |     // Navigate to browse and click first story
  21  |     await page.goto("/browse");
  22  |     await page.waitForTimeout(2000);
  23  |     const storyCard = page.locator("[href*='/story/']").first();
  24  |     if (await storyCard.isVisible()) {
  25  |       await storyCard.click();
  26  |       await expect(page.locator("main")).toBeVisible();
  27  |     }
  28  |   });
  29  | 
  30  |   test("chapter reader loads", async ({ page }) => {
  31  |     // Try to load a known story
  32  |     const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
  33  |       headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  34  |     });
  35  |     const stories = await res.json();
  36  |     if (stories.length > 0) {
  37  |       await page.goto(`/story/${stories[0].slug}/1`);
  38  |       await page.waitForTimeout(2000);
  39  |       // Should see chapter content area
  40  |       await expect(page.locator("main")).toBeVisible();
  41  |     }
  42  |   });
  43  | 
  44  |   test("lightbox opens on image click", async ({ page }) => {
  45  |     const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
  46  |       headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  47  |     });
  48  |     const stories = await res.json();
  49  |     if (stories.length > 0) {
  50  |       await page.goto(`/story/${stories[0].slug}/1`);
  51  |       await page.waitForTimeout(3000);
  52  |       const img = page.locator("img[src*='imgchest']").first();
  53  |       if (await img.isVisible()) {
  54  |         await img.click();
  55  |         // Lightbox should appear
  56  |         await expect(page.locator("[class*='fixed'][class*='z-']")).toBeVisible({ timeout: 3000 });
  57  |       }
  58  |     }
  59  |   });
  60  | 
  61  |   test("bookmarks page requires auth", async ({ page }) => {
  62  |     await page.goto("/bookmarks");
  63  |     await expect(page.getByText(/log in/i)).toBeVisible();
  64  |   });
  65  | 
  66  |   test("reading history page requires auth", async ({ page }) => {
  67  |     await page.goto("/reading-history");
> 68  |     await expect(page.getByText(/log in/i)).toBeVisible();
      |                                             ^ Error: expect(locator).toBeVisible() failed
  69  |   });
  70  | 
  71  |   test("comment form requires auth", async ({ page }) => {
  72  |     const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
  73  |       headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  74  |     });
  75  |     const stories = await res.json();
  76  |     if (stories.length > 0) {
  77  |       await page.goto(`/story/${stories[0].slug}`);
  78  |       await page.waitForTimeout(2000);
  79  |       await expect(page.getByText(/log in to comment/i)).toBeVisible();
  80  |     }
  81  |   });
  82  | 
  83  |   test("authenticated user can see comment form", async ({ page }) => {
  84  |     await login(page, reader.email, reader.password);
  85  |     const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
  86  |       headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  87  |     });
  88  |     const stories = await res.json();
  89  |     if (stories.length > 0) {
  90  |       await page.goto(`/story/${stories[0].slug}`);
  91  |       await page.waitForTimeout(2000);
  92  |       await expect(page.locator("textarea")).toBeVisible();
  93  |     }
  94  |   });
  95  | 
  96  |   test("search works", async ({ page }) => {
  97  |     await page.goto("/search");
  98  |     await page.fill('#search', 'wife');
  99  |     await page.click("text=Search");
  100 |     await page.waitForTimeout(2000);
  101 |     // Should show results or no results message
  102 |     const hasResults = await page.getByText(/result/i).isVisible();
  103 |     const hasNoResults = await page.getByText(/no stories found/i).isVisible();
  104 |     expect(hasResults || hasNoResults).toBeTruthy();
  105 |   });
  106 | 
  107 |   test("creator profile page loads", async ({ page }) => {
  108 |     // Get a creator username
  109 |     const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=username&role=eq.creator&limit=1`, {
  110 |       headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  111 |     });
  112 |     const profiles = await res.json();
  113 |     if (profiles.length > 0) {
  114 |       await page.goto(`/creator/${profiles[0].username}`);
  115 |       await expect(page.getByText("Stories")).toBeVisible();
  116 |       await expect(page.getByText("About")).toBeVisible();
  117 |     }
  118 |   });
  119 | 
  120 |   test("share button is present on story page", async ({ page }) => {
  121 |     const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=slug&status=eq.published&limit=1`, {
  122 |       headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  123 |     });
  124 |     const stories = await res.json();
  125 |     if (stories.length > 0) {
  126 |       await page.goto(`/story/${stories[0].slug}`);
  127 |       await page.waitForTimeout(2000);
  128 |       // Share button should exist
  129 |       await expect(page.locator("button[title*='Share'], button[title*='Copy']")).toBeVisible();
  130 |     }
  131 |   });
  132 | });
  133 | 
```