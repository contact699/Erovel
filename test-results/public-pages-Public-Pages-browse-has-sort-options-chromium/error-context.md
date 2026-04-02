# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public Pages >> browse has sort options
- Location: e2e\public-pages.spec.ts:26:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByText('Trending')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Trending')
    9 × locator resolved to <option value="trending">Trending</option>
      - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e6]
        - generic [ref=e8]: Erovel
      - generic [ref=e9]:
        - heading "Age Verification Required" [level=1] [ref=e10]
        - paragraph [ref=e11]: This website contains adult content. You must be 18 years or older to enter.
      - generic [ref=e12]:
        - paragraph [ref=e13]: Enter your date of birth
        - generic [ref=e14]:
          - textbox "MM" [ref=e15]
          - textbox "DD" [ref=e16]
          - textbox "YYYY" [ref=e17]
        - button "Enter" [ref=e18] [cursor=pointer]
      - paragraph [ref=e19]:
        - text: By entering, you confirm you are 18+ and agree to our
        - link "Terms of Service" [ref=e20] [cursor=pointer]:
          - /url: /terms
        - text: .
    - banner [ref=e21]:
      - generic [ref=e22]:
        - link "Erovel" [ref=e23] [cursor=pointer]:
          - /url: /
          - img [ref=e24]
          - generic [ref=e26]: Erovel
        - navigation [ref=e27]:
          - link "Browse" [ref=e28] [cursor=pointer]:
            - /url: /browse
          - link "Romance" [ref=e29] [cursor=pointer]:
            - /url: /browse/romance
          - link "Fantasy" [ref=e30] [cursor=pointer]:
            - /url: /browse/fantasy
          - link "Chat Stories" [ref=e31] [cursor=pointer]:
            - /url: /browse?format=chat
        - generic [ref=e32]:
          - button [ref=e33] [cursor=pointer]:
            - img [ref=e34]
          - button [ref=e37] [cursor=pointer]:
            - img [ref=e38]
          - generic [ref=e44]:
            - link "Log in" [ref=e45] [cursor=pointer]:
              - /url: /login
              - button "Log in" [ref=e46]
            - link "Sign up" [ref=e47] [cursor=pointer]:
              - /url: /signup
              - button "Sign up" [ref=e48]
    - main [ref=e49]:
      - generic [ref=e50]:
        - generic [ref=e51]:
          - heading "Browse Stories" [level=1] [ref=e52]
          - paragraph [ref=e53]: Discover stories from our community of creators
        - generic [ref=e54]:
          - complementary [ref=e55]:
            - heading "Categories" [level=3] [ref=e56]
            - navigation [ref=e57]:
              - button "All Categories" [ref=e58] [cursor=pointer]
              - button "Anal 0" [ref=e59] [cursor=pointer]:
                - generic [ref=e60]: Anal
                - generic [ref=e61]: "0"
              - button "BDSM 0" [ref=e62] [cursor=pointer]:
                - generic [ref=e63]: BDSM
                - generic [ref=e64]: "0"
              - button "Celebrity 0" [ref=e65] [cursor=pointer]:
                - generic [ref=e66]: Celebrity
                - generic [ref=e67]: "0"
              - button "Cheating 0" [ref=e68] [cursor=pointer]:
                - generic [ref=e69]: Cheating
                - generic [ref=e70]: "0"
              - button "Fantasy 0" [ref=e71] [cursor=pointer]:
                - generic [ref=e72]: Fantasy
                - generic [ref=e73]: "0"
              - button "Fetish 0" [ref=e74] [cursor=pointer]:
                - generic [ref=e75]: Fetish
                - generic [ref=e76]: "0"
              - button "First Time 0" [ref=e77] [cursor=pointer]:
                - generic [ref=e78]: First Time
                - generic [ref=e79]: "0"
              - button "Gay 0" [ref=e80] [cursor=pointer]:
                - generic [ref=e81]: Gay
                - generic [ref=e82]: "0"
              - button "Group 0" [ref=e83] [cursor=pointer]:
                - generic [ref=e84]: Group
                - generic [ref=e85]: "0"
              - button "Humor & Satire 0" [ref=e86] [cursor=pointer]:
                - generic [ref=e87]: Humor & Satire
                - generic [ref=e88]: "0"
              - button "Interracial 0" [ref=e89] [cursor=pointer]:
                - generic [ref=e90]: Interracial
                - generic [ref=e91]: "0"
              - button "Lesbian 0" [ref=e92] [cursor=pointer]:
                - generic [ref=e93]: Lesbian
                - generic [ref=e94]: "0"
              - button "Mature 0" [ref=e95] [cursor=pointer]:
                - generic [ref=e96]: Mature
                - generic [ref=e97]: "0"
              - button "Non-consent/Reluctance 0" [ref=e98] [cursor=pointer]:
                - generic [ref=e99]: Non-consent/Reluctance
                - generic [ref=e100]: "0"
              - button "Other 3" [ref=e101] [cursor=pointer]:
                - generic [ref=e102]: Other
                - generic [ref=e103]: "3"
              - button "Romance 0" [ref=e104] [cursor=pointer]:
                - generic [ref=e105]: Romance
                - generic [ref=e106]: "0"
              - button "Sci-Fi & Fantasy 0" [ref=e107] [cursor=pointer]:
                - generic [ref=e108]: Sci-Fi & Fantasy
                - generic [ref=e109]: "0"
              - button "Taboo 0" [ref=e110] [cursor=pointer]:
                - generic [ref=e111]: Taboo
                - generic [ref=e112]: "0"
              - button "Voyeur/Exhibitionism 0" [ref=e113] [cursor=pointer]:
                - generic [ref=e114]: Voyeur/Exhibitionism
                - generic [ref=e115]: "0"
          - generic [ref=e116]:
            - generic [ref=e117]:
              - combobox [ref=e120] [cursor=pointer]:
                - option "All Formats" [selected]
                - option "Illustrated Story"
                - option "Sext Story"
              - combobox [ref=e123] [cursor=pointer]:
                - option "Trending" [selected]
                - option "Newest"
                - option "Most Tipped"
              - generic [ref=e124]: 3 stories
            - generic [ref=e125]:
              - link "Sext A Wife Let Loose A story about a husband and wife finally giving into their fantasies and letting her be the hotwife she has always wanted to be. C Chatkink 5 0 0 6 chapters · 0 min read 1h ago" [ref=e126] [cursor=pointer]:
                - /url: /story/a-wife-let-loose-rzjsbt
                - generic [ref=e127]:
                  - generic [ref=e130]: Sext
                  - generic [ref=e131]:
                    - generic [ref=e132]:
                      - heading "A Wife Let Loose" [level=3] [ref=e133]
                      - paragraph [ref=e134]: A story about a husband and wife finally giving into their fantasies and letting her be the hotwife she has always wanted to be.
                    - generic [ref=e135]:
                      - generic [ref=e136]:
                        - generic [ref=e137]: C
                        - generic [ref=e138]: Chatkink
                      - generic [ref=e139]:
                        - generic [ref=e140]:
                          - img [ref=e141]
                          - text: "5"
                        - generic [ref=e144]:
                          - img [ref=e145]
                          - text: "0"
                        - generic [ref=e147]:
                          - img [ref=e148]
                          - text: "0"
                    - generic [ref=e150]:
                      - generic [ref=e151]: 6 chapters · 0 min read
                      - generic [ref=e152]: 1h ago
              - link "Illustrated The Hotwife Games A story about a couple invited to participate in an elite hotwife game run by the swing club they belong to. C Chatkink 4 0 0 6 chapters · 0 min read 3m ago" [ref=e153] [cursor=pointer]:
                - /url: /story/the-hotwife-games-svtb7s
                - generic [ref=e154]:
                  - generic [ref=e157]: Illustrated
                  - generic [ref=e158]:
                    - generic [ref=e159]:
                      - heading "The Hotwife Games" [level=3] [ref=e160]
                      - paragraph [ref=e161]: A story about a couple invited to participate in an elite hotwife game run by the swing club they belong to.
                    - generic [ref=e162]:
                      - generic [ref=e163]:
                        - generic [ref=e164]: C
                        - generic [ref=e165]: Chatkink
                      - generic [ref=e166]:
                        - generic [ref=e167]:
                          - img [ref=e168]
                          - text: "4"
                        - generic [ref=e171]:
                          - img [ref=e172]
                          - text: "0"
                        - generic [ref=e174]:
                          - img [ref=e175]
                          - text: "0"
                    - generic [ref=e177]:
                      - generic [ref=e178]: 6 chapters · 0 min read
                      - generic [ref=e179]: 3m ago
              - link "Sext One Man, Two Birds — Ch. 01 Imported from imgchest (39 images) P patrob1 2 0 0 1 chapters · 0 min read 3m ago" [ref=e180] [cursor=pointer]:
                - /url: /story/one-man-two-birds-ch-01-kt38tx
                - generic [ref=e181]:
                  - generic [ref=e184]: Sext
                  - generic [ref=e185]:
                    - generic [ref=e186]:
                      - heading "One Man, Two Birds — Ch. 01" [level=3] [ref=e187]
                      - paragraph [ref=e188]: Imported from imgchest (39 images)
                    - generic [ref=e189]:
                      - generic [ref=e190]:
                        - generic [ref=e191]: P
                        - generic [ref=e192]: patrob1
                      - generic [ref=e193]:
                        - generic [ref=e194]:
                          - img [ref=e195]
                          - text: "2"
                        - generic [ref=e198]:
                          - img [ref=e199]
                          - text: "0"
                        - generic [ref=e201]:
                          - img [ref=e202]
                          - text: "0"
                    - generic [ref=e204]:
                      - generic [ref=e205]: 1 chapters · 0 min read
                      - generic [ref=e206]: 3m ago
    - contentinfo [ref=e207]:
      - generic [ref=e208]:
        - generic [ref=e209]:
          - generic [ref=e210]:
            - heading "Erovel" [level=3] [ref=e211]
            - paragraph [ref=e212]: A platform for adult fiction creators and readers. Stories that ignite.
          - generic [ref=e213]:
            - heading "Browse" [level=3] [ref=e214]
            - list [ref=e215]:
              - listitem [ref=e216]:
                - link "All Stories" [ref=e217] [cursor=pointer]:
                  - /url: /browse
              - listitem [ref=e218]:
                - link "Romance" [ref=e219] [cursor=pointer]:
                  - /url: /browse/romance
              - listitem [ref=e220]:
                - link "Fantasy" [ref=e221] [cursor=pointer]:
                  - /url: /browse/fantasy
              - listitem [ref=e222]:
                - link "Chat Stories" [ref=e223] [cursor=pointer]:
                  - /url: /browse?format=chat
          - generic [ref=e224]:
            - heading "Creators" [level=3] [ref=e225]
            - list [ref=e226]:
              - listitem [ref=e227]:
                - link "Why Erovel?" [ref=e228] [cursor=pointer]:
                  - /url: /creators
              - listitem [ref=e229]:
                - link "Become a Creator" [ref=e230] [cursor=pointer]:
                  - /url: /signup
              - listitem [ref=e231]:
                - link "Creator Dashboard" [ref=e232] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e233]:
                - link "Import from imgchest" [ref=e234] [cursor=pointer]:
                  - /url: /dashboard/import
          - generic [ref=e235]:
            - heading "Legal" [level=3] [ref=e236]
            - list [ref=e237]:
              - listitem [ref=e238]:
                - link "Terms of Service" [ref=e239] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e240]:
                - link "Privacy Policy" [ref=e241] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e242]:
                - link "DMCA Policy" [ref=e243] [cursor=pointer]:
                  - /url: /dmca
              - listitem [ref=e244]:
                - link "2257 Compliance" [ref=e245] [cursor=pointer]:
                  - /url: /2257
              - listitem [ref=e246]:
                - link "Refund Policy" [ref=e247] [cursor=pointer]:
                  - /url: /refund
              - listitem [ref=e248]:
                - link "Contact" [ref=e249] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e250]: © 2026 Erovel. All rights reserved. You must be 18+ to use this platform.
  - alert [ref=e251]
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
  18  |     await expect(page.getByText("Categories")).toBeVisible();
  19  |   });
  20  | 
  21  |   test("browse has format filter", async ({ page }) => {
  22  |     await page.goto("/browse");
  23  |     await expect(page.getByText("All Formats")).toBeVisible();
  24  |   });
  25  | 
  26  |   test("browse has sort options", async ({ page }) => {
  27  |     await page.goto("/browse");
> 28  |     await expect(page.getByText("Trending")).toBeVisible();
      |                                              ^ Error: expect(locator).toBeVisible() failed
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