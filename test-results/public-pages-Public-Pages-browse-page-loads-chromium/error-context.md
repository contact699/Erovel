# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public Pages >> browse page loads
- Location: e2e\public-pages.spec.ts:15:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Categories')
Expected: visible
Error: strict mode violation: getByText('Categories') resolved to 3 elements:
    1) <h3 class="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Categories</h3> aka getByRole('heading', { name: 'Categories' })
    2) <button class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer bg-accent/10 text-accent font-medium">All Categories</button> aka getByRole('button', { name: 'All Categories' })
    3) <option value="all">All Categories</option> aka locator('option').filter({ hasText: 'All Categories' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Categories')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "Erovel" [ref=e5] [cursor=pointer]:
          - /url: /
          - img [ref=e6]
          - generic [ref=e8]: Erovel
        - navigation [ref=e9]:
          - link "Browse" [ref=e10] [cursor=pointer]:
            - /url: /browse
          - link "Romance" [ref=e11] [cursor=pointer]:
            - /url: /browse/romance
          - link "Fantasy" [ref=e12] [cursor=pointer]:
            - /url: /browse/fantasy
          - link "Chat Stories" [ref=e13] [cursor=pointer]:
            - /url: /browse?format=chat
        - generic [ref=e14]:
          - button [ref=e15] [cursor=pointer]:
            - img [ref=e16]
          - button [ref=e19] [cursor=pointer]:
            - img [ref=e20]
          - generic [ref=e26]:
            - link "Log in" [ref=e27] [cursor=pointer]:
              - /url: /login
              - button "Log in" [ref=e28]
            - link "Sign up" [ref=e29] [cursor=pointer]:
              - /url: /signup
              - button "Sign up" [ref=e30]
    - main [ref=e31]:
      - generic [ref=e32]:
        - generic [ref=e33]:
          - heading "Browse Stories" [level=1] [ref=e34]
          - paragraph [ref=e35]: Discover stories from our community of creators
        - generic [ref=e36]:
          - complementary [ref=e37]:
            - heading "Categories" [level=3] [ref=e38]
            - navigation [ref=e39]:
              - button "All Categories" [ref=e40] [cursor=pointer]
              - button "Anal 0" [ref=e41] [cursor=pointer]:
                - generic [ref=e42]: Anal
                - generic [ref=e43]: "0"
              - button "BDSM 0" [ref=e44] [cursor=pointer]:
                - generic [ref=e45]: BDSM
                - generic [ref=e46]: "0"
              - button "Celebrity 0" [ref=e47] [cursor=pointer]:
                - generic [ref=e48]: Celebrity
                - generic [ref=e49]: "0"
              - button "Cheating 0" [ref=e50] [cursor=pointer]:
                - generic [ref=e51]: Cheating
                - generic [ref=e52]: "0"
              - button "Fantasy 0" [ref=e53] [cursor=pointer]:
                - generic [ref=e54]: Fantasy
                - generic [ref=e55]: "0"
              - button "Fetish 0" [ref=e56] [cursor=pointer]:
                - generic [ref=e57]: Fetish
                - generic [ref=e58]: "0"
              - button "First Time 0" [ref=e59] [cursor=pointer]:
                - generic [ref=e60]: First Time
                - generic [ref=e61]: "0"
              - button "Gay 0" [ref=e62] [cursor=pointer]:
                - generic [ref=e63]: Gay
                - generic [ref=e64]: "0"
              - button "Group 0" [ref=e65] [cursor=pointer]:
                - generic [ref=e66]: Group
                - generic [ref=e67]: "0"
              - button "Humor & Satire 0" [ref=e68] [cursor=pointer]:
                - generic [ref=e69]: Humor & Satire
                - generic [ref=e70]: "0"
              - button "Interracial 0" [ref=e71] [cursor=pointer]:
                - generic [ref=e72]: Interracial
                - generic [ref=e73]: "0"
              - button "Lesbian 0" [ref=e74] [cursor=pointer]:
                - generic [ref=e75]: Lesbian
                - generic [ref=e76]: "0"
              - button "Mature 0" [ref=e77] [cursor=pointer]:
                - generic [ref=e78]: Mature
                - generic [ref=e79]: "0"
              - button "Non-consent/Reluctance 0" [ref=e80] [cursor=pointer]:
                - generic [ref=e81]: Non-consent/Reluctance
                - generic [ref=e82]: "0"
              - button "Other 3" [ref=e83] [cursor=pointer]:
                - generic [ref=e84]: Other
                - generic [ref=e85]: "3"
              - button "Romance 0" [ref=e86] [cursor=pointer]:
                - generic [ref=e87]: Romance
                - generic [ref=e88]: "0"
              - button "Sci-Fi & Fantasy 0" [ref=e89] [cursor=pointer]:
                - generic [ref=e90]: Sci-Fi & Fantasy
                - generic [ref=e91]: "0"
              - button "Taboo 0" [ref=e92] [cursor=pointer]:
                - generic [ref=e93]: Taboo
                - generic [ref=e94]: "0"
              - button "Voyeur/Exhibitionism 0" [ref=e95] [cursor=pointer]:
                - generic [ref=e96]: Voyeur/Exhibitionism
                - generic [ref=e97]: "0"
          - generic [ref=e98]:
            - generic [ref=e99]:
              - combobox [ref=e102] [cursor=pointer]:
                - option "All Formats" [selected]
                - option "Illustrated Story"
                - option "Sext Story"
              - combobox [ref=e105] [cursor=pointer]:
                - option "Trending" [selected]
                - option "Newest"
                - option "Most Tipped"
              - generic [ref=e106]: 3 stories
            - generic [ref=e107]:
              - link "Sext A Wife Let Loose A story about a husband and wife finally giving into their fantasies and letting her be the hotwife she has always wanted to be. C Chatkink 5 0 0 6 chapters · 0 min read 1h ago" [ref=e108] [cursor=pointer]:
                - /url: /story/a-wife-let-loose-rzjsbt
                - generic [ref=e109]:
                  - generic [ref=e112]: Sext
                  - generic [ref=e113]:
                    - generic [ref=e114]:
                      - heading "A Wife Let Loose" [level=3] [ref=e115]
                      - paragraph [ref=e116]: A story about a husband and wife finally giving into their fantasies and letting her be the hotwife she has always wanted to be.
                    - generic [ref=e117]:
                      - generic [ref=e118]:
                        - generic [ref=e119]: C
                        - generic [ref=e120]: Chatkink
                      - generic [ref=e121]:
                        - generic [ref=e122]:
                          - img [ref=e123]
                          - text: "5"
                        - generic [ref=e126]:
                          - img [ref=e127]
                          - text: "0"
                        - generic [ref=e129]:
                          - img [ref=e130]
                          - text: "0"
                    - generic [ref=e132]:
                      - generic [ref=e133]: 6 chapters · 0 min read
                      - generic [ref=e134]: 1h ago
              - link "Illustrated The Hotwife Games A story about a couple invited to participate in an elite hotwife game run by the swing club they belong to. C Chatkink 4 0 0 6 chapters · 0 min read 3m ago" [ref=e135] [cursor=pointer]:
                - /url: /story/the-hotwife-games-svtb7s
                - generic [ref=e136]:
                  - generic [ref=e139]: Illustrated
                  - generic [ref=e140]:
                    - generic [ref=e141]:
                      - heading "The Hotwife Games" [level=3] [ref=e142]
                      - paragraph [ref=e143]: A story about a couple invited to participate in an elite hotwife game run by the swing club they belong to.
                    - generic [ref=e144]:
                      - generic [ref=e145]:
                        - generic [ref=e146]: C
                        - generic [ref=e147]: Chatkink
                      - generic [ref=e148]:
                        - generic [ref=e149]:
                          - img [ref=e150]
                          - text: "4"
                        - generic [ref=e153]:
                          - img [ref=e154]
                          - text: "0"
                        - generic [ref=e156]:
                          - img [ref=e157]
                          - text: "0"
                    - generic [ref=e159]:
                      - generic [ref=e160]: 6 chapters · 0 min read
                      - generic [ref=e161]: 3m ago
              - link "Sext One Man, Two Birds — Ch. 01 Imported from imgchest (39 images) P patrob1 2 0 0 1 chapters · 0 min read 3m ago" [ref=e162] [cursor=pointer]:
                - /url: /story/one-man-two-birds-ch-01-kt38tx
                - generic [ref=e163]:
                  - generic [ref=e166]: Sext
                  - generic [ref=e167]:
                    - generic [ref=e168]:
                      - heading "One Man, Two Birds — Ch. 01" [level=3] [ref=e169]
                      - paragraph [ref=e170]: Imported from imgchest (39 images)
                    - generic [ref=e171]:
                      - generic [ref=e172]:
                        - generic [ref=e173]: P
                        - generic [ref=e174]: patrob1
                      - generic [ref=e175]:
                        - generic [ref=e176]:
                          - img [ref=e177]
                          - text: "2"
                        - generic [ref=e180]:
                          - img [ref=e181]
                          - text: "0"
                        - generic [ref=e183]:
                          - img [ref=e184]
                          - text: "0"
                    - generic [ref=e186]:
                      - generic [ref=e187]: 1 chapters · 0 min read
                      - generic [ref=e188]: 3m ago
    - contentinfo [ref=e189]:
      - generic [ref=e190]:
        - generic [ref=e191]:
          - generic [ref=e192]:
            - heading "Erovel" [level=3] [ref=e193]
            - paragraph [ref=e194]: A platform for adult fiction creators and readers. Stories that ignite.
          - generic [ref=e195]:
            - heading "Browse" [level=3] [ref=e196]
            - list [ref=e197]:
              - listitem [ref=e198]:
                - link "All Stories" [ref=e199] [cursor=pointer]:
                  - /url: /browse
              - listitem [ref=e200]:
                - link "Romance" [ref=e201] [cursor=pointer]:
                  - /url: /browse/romance
              - listitem [ref=e202]:
                - link "Fantasy" [ref=e203] [cursor=pointer]:
                  - /url: /browse/fantasy
              - listitem [ref=e204]:
                - link "Chat Stories" [ref=e205] [cursor=pointer]:
                  - /url: /browse?format=chat
          - generic [ref=e206]:
            - heading "Creators" [level=3] [ref=e207]
            - list [ref=e208]:
              - listitem [ref=e209]:
                - link "Why Erovel?" [ref=e210] [cursor=pointer]:
                  - /url: /creators
              - listitem [ref=e211]:
                - link "Become a Creator" [ref=e212] [cursor=pointer]:
                  - /url: /signup
              - listitem [ref=e213]:
                - link "Creator Dashboard" [ref=e214] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e215]:
                - link "Import from imgchest" [ref=e216] [cursor=pointer]:
                  - /url: /dashboard/import
          - generic [ref=e217]:
            - heading "Legal" [level=3] [ref=e218]
            - list [ref=e219]:
              - listitem [ref=e220]:
                - link "Terms of Service" [ref=e221] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e222]:
                - link "Privacy Policy" [ref=e223] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e224]:
                - link "DMCA Policy" [ref=e225] [cursor=pointer]:
                  - /url: /dmca
              - listitem [ref=e226]:
                - link "2257 Compliance" [ref=e227] [cursor=pointer]:
                  - /url: /2257
              - listitem [ref=e228]:
                - link "Refund Policy" [ref=e229] [cursor=pointer]:
                  - /url: /refund
              - listitem [ref=e230]:
                - link "Contact" [ref=e231] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e232]: © 2026 Erovel. All rights reserved. You must be 18+ to use this platform.
  - alert [ref=e233]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { bypassAgeGate } from "./helpers";
  3   | 
  4   | test.describe("Public Pages", () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await bypassAgeGate(page);
  7   |   });
  8   | 
  9   |   test("homepage loads with hero section", async ({ page }) => {
  10  |     await page.goto("/");
  11  |     await expect(page.getByText("Stories that ignite")).toBeVisible();
  12  |     await expect(page.getByText("Browse Stories")).toBeVisible();
  13  |   });
  14  | 
  15  |   test("browse page loads", async ({ page }) => {
  16  |     await page.goto("/browse");
  17  |     await expect(page.getByText("Browse Stories")).toBeVisible();
> 18  |     await expect(page.getByText("Categories")).toBeVisible();
      |                                                ^ Error: expect(locator).toBeVisible() failed
  19  |   });
  20  | 
  21  |   test("browse has format filter", async ({ page }) => {
  22  |     await page.goto("/browse");
  23  |     await expect(page.getByText("All Formats")).toBeVisible();
  24  |   });
  25  | 
  26  |   test("browse has sort options", async ({ page }) => {
  27  |     await page.goto("/browse");
  28  |     await expect(page.getByText("Trending")).toBeVisible();
  29  |   });
  30  | 
  31  |   test("search page loads", async ({ page }) => {
  32  |     await page.goto("/search");
  33  |     await expect(page.getByText("Search Stories")).toBeVisible();
  34  |   });
  35  | 
  36  |   test("category browse page loads", async ({ page }) => {
  37  |     await page.goto("/browse/romance");
  38  |     await expect(page).toHaveURL(/browse\/romance/);
  39  |   });
  40  | 
  41  |   test("404 page for invalid route", async ({ page }) => {
  42  |     await page.goto("/nonexistent-page-xyz");
  43  |     await expect(page.getByText("404")).toBeVisible();
  44  |   });
  45  | 
  46  |   test("terms page loads", async ({ page }) => {
  47  |     await page.goto("/terms");
  48  |     await expect(page.getByText("Terms of Service")).toBeVisible();
  49  |   });
  50  | 
  51  |   test("privacy page loads", async ({ page }) => {
  52  |     await page.goto("/privacy");
  53  |     await expect(page.getByText("Privacy Policy")).toBeVisible();
  54  |   });
  55  | 
  56  |   test("dmca page loads with agent info", async ({ page }) => {
  57  |     await page.goto("/dmca");
  58  |     await expect(page.getByText("DMCA Policy")).toBeVisible();
  59  |     await expect(page.getByText("Robert Chiarello")).toBeVisible();
  60  |     await expect(page.getByText("DMCA-1071086")).toBeVisible();
  61  |   });
  62  | 
  63  |   test("2257 compliance page loads", async ({ page }) => {
  64  |     await page.goto("/2257");
  65  |     await expect(page.getByText("2257")).toBeVisible();
  66  |   });
  67  | 
  68  |   test("refund policy page loads", async ({ page }) => {
  69  |     await page.goto("/refund");
  70  |     await expect(page.getByText("Refund")).toBeVisible();
  71  |   });
  72  | 
  73  |   test("contact page loads", async ({ page }) => {
  74  |     await page.goto("/contact");
  75  |     await expect(page.getByText("Contact")).toBeVisible();
  76  |     await expect(page.getByText("contact@growyoursb.com")).toBeVisible();
  77  |   });
  78  | 
  79  |   test("creators landing page loads", async ({ page }) => {
  80  |     await page.goto("/creators");
  81  |     await expect(page.getByText("Your stories deserve")).toBeVisible();
  82  |     await expect(page.getByText("85%")).toBeVisible();
  83  |   });
  84  | 
  85  |   test("header navigation links work", async ({ page }) => {
  86  |     await page.goto("/");
  87  |     await page.click("text=Browse");
  88  |     await expect(page).toHaveURL(/browse/);
  89  |   });
  90  | 
  91  |   test("theme toggle works", async ({ page }) => {
  92  |     await page.goto("/");
  93  |     const html = page.locator("html");
  94  |     await page.click('[class*="cursor-pointer"]:has(svg)');
  95  |     // Should toggle dark class
  96  |     const hasDark = await html.evaluate((el) => el.classList.contains("dark"));
  97  |     expect(typeof hasDark).toBe("boolean");
  98  |   });
  99  | 
  100 |   test("footer has all legal links", async ({ page }) => {
  101 |     await page.goto("/");
  102 |     const footer = page.locator("footer");
  103 |     await expect(footer.getByText("Terms of Service")).toBeVisible();
  104 |     await expect(footer.getByText("Privacy Policy")).toBeVisible();
  105 |     await expect(footer.getByText("DMCA Policy")).toBeVisible();
  106 |     await expect(footer.getByText("Refund Policy")).toBeVisible();
  107 |     await expect(footer.getByText("Contact")).toBeVisible();
  108 |   });
  109 | });
  110 | 
```