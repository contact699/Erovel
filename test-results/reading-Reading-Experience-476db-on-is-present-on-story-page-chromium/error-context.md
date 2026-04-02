# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reading.spec.ts >> Reading Experience >> share button is present on story page
- Location: e2e\reading.spec.ts:120:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button[title*=\'Share\'], button[title*=\'Copy\']')
Expected: visible
Error: strict mode violation: locator('button[title*=\'Share\'], button[title*=\'Copy\']') resolved to 3 elements:
    1) <button title="Share on X" class="p-2 text-muted hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-surface-hover">…</button> aka getByRole('button', { name: 'Share on X' })
    2) <button title="Share on Reddit" class="p-2 text-muted hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-surface-hover">…</button> aka getByRole('button', { name: 'Share on Reddit' })
    3) <button title="Share" class="text-muted hover:text-foreground transition-colors cursor-pointer p-1">…</button> aka getByRole('button', { name: 'Share', exact: true })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button[title*=\'Share\'], button[title*=\'Copy\']')

```

# Test source

```ts
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
  68  |     await expect(page.getByText(/log in/i)).toBeVisible();
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
> 129 |       await expect(page.locator("button[title*='Share'], button[title*='Copy']")).toBeVisible();
      |                                                                                   ^ Error: expect(locator).toBeVisible() failed
  130 |     }
  131 |   });
  132 | });
  133 | 
```