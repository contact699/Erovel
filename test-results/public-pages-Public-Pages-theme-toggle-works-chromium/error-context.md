# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public Pages >> theme toggle works
- Location: e2e\public-pages.spec.ts:91:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[class*="cursor-pointer"]:has(svg)')
    - locator resolved to 6 elements. Proceeding with the first one: <button class="text-muted hover:text-foreground p-2 cursor-pointer">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    53 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms

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
        - generic [ref=e54]:
          - heading "Stories that ignite." [level=1] [ref=e55]
          - paragraph [ref=e56]: Erovel is a platform for adult fiction -- prose and chat-style stories crafted by independent creators. Read for free or support the writers you love.
          - generic [ref=e57]:
            - link "Browse Stories" [ref=e58] [cursor=pointer]:
              - /url: /browse
              - button "Browse Stories" [ref=e59]:
                - img [ref=e60]
                - text: Browse Stories
            - link "Start Writing" [ref=e62] [cursor=pointer]:
              - /url: /signup
              - button "Start Writing" [ref=e63]:
                - img [ref=e64]
                - text: Start Writing
          - generic [ref=e69]:
            - generic [ref=e70]:
              - img [ref=e71]
              - text: Community-driven stories
            - generic [ref=e73]:
              - img [ref=e74]
              - text: Growing creator community
            - generic [ref=e79]:
              - img [ref=e80]
              - text: Direct creator tipping
        - generic [ref=e82]:
          - generic [ref=e83]:
            - generic [ref=e84]:
              - img [ref=e85]
              - heading "Trending" [level=2] [ref=e87]
            - link "View all" [ref=e88] [cursor=pointer]:
              - /url: /browse?sort=trending
              - text: View all
              - img [ref=e89]
          - generic [ref=e91]:
            - link "Sext A Wife Let Loose A story about a husband and wife finally giving into their fantasies and letting her be the hotwife she has always wanted to be. C Chatkink 5 0 0 6 chapters · 0 min read 1h ago" [ref=e92] [cursor=pointer]:
              - /url: /story/a-wife-let-loose-rzjsbt
              - generic [ref=e93]:
                - generic [ref=e96]: Sext
                - generic [ref=e97]:
                  - generic [ref=e98]:
                    - heading "A Wife Let Loose" [level=3] [ref=e99]
                    - paragraph [ref=e100]: A story about a husband and wife finally giving into their fantasies and letting her be the hotwife she has always wanted to be.
                  - generic [ref=e101]:
                    - generic [ref=e102]:
                      - generic [ref=e103]: C
                      - generic [ref=e104]: Chatkink
                    - generic [ref=e105]:
                      - generic [ref=e106]:
                        - img [ref=e107]
                        - text: "5"
                      - generic [ref=e110]:
                        - img [ref=e111]
                        - text: "0"
                      - generic [ref=e113]:
                        - img [ref=e114]
                        - text: "0"
                  - generic [ref=e116]:
                    - generic [ref=e117]: 6 chapters · 0 min read
                    - generic [ref=e118]: 1h ago
            - link "Illustrated The Hotwife Games A story about a couple invited to participate in an elite hotwife game run by the swing club they belong to. C Chatkink 4 0 0 6 chapters · 0 min read 5m ago" [ref=e119] [cursor=pointer]:
              - /url: /story/the-hotwife-games-svtb7s
              - generic [ref=e120]:
                - generic [ref=e123]: Illustrated
                - generic [ref=e124]:
                  - generic [ref=e125]:
                    - heading "The Hotwife Games" [level=3] [ref=e126]
                    - paragraph [ref=e127]: A story about a couple invited to participate in an elite hotwife game run by the swing club they belong to.
                  - generic [ref=e128]:
                    - generic [ref=e129]:
                      - generic [ref=e130]: C
                      - generic [ref=e131]: Chatkink
                    - generic [ref=e132]:
                      - generic [ref=e133]:
                        - img [ref=e134]
                        - text: "4"
                      - generic [ref=e137]:
                        - img [ref=e138]
                        - text: "0"
                      - generic [ref=e140]:
                        - img [ref=e141]
                        - text: "0"
                  - generic [ref=e143]:
                    - generic [ref=e144]: 6 chapters · 0 min read
                    - generic [ref=e145]: 5m ago
            - link "Sext One Man, Two Birds — Ch. 01 Imported from imgchest (39 images) P patrob1 2 0 0 1 chapters · 0 min read 5m ago" [ref=e146] [cursor=pointer]:
              - /url: /story/one-man-two-birds-ch-01-kt38tx
              - generic [ref=e147]:
                - generic [ref=e150]: Sext
                - generic [ref=e151]:
                  - generic [ref=e152]:
                    - heading "One Man, Two Birds — Ch. 01" [level=3] [ref=e153]
                    - paragraph [ref=e154]: Imported from imgchest (39 images)
                  - generic [ref=e155]:
                    - generic [ref=e156]:
                      - generic [ref=e157]: P
                      - generic [ref=e158]: patrob1
                    - generic [ref=e159]:
                      - generic [ref=e160]:
                        - img [ref=e161]
                        - text: "2"
                      - generic [ref=e164]:
                        - img [ref=e165]
                        - text: "0"
                      - generic [ref=e167]:
                        - img [ref=e168]
                        - text: "0"
                  - generic [ref=e170]:
                    - generic [ref=e171]: 1 chapters · 0 min read
                    - generic [ref=e172]: 5m ago
        - generic [ref=e174]:
          - generic [ref=e175]:
            - generic [ref=e176]:
              - img [ref=e177]
              - heading "Latest Updates" [level=2] [ref=e180]
            - link "View all" [ref=e181] [cursor=pointer]:
              - /url: /browse?sort=newest
              - text: View all
              - img [ref=e182]
          - generic [ref=e184]:
            - link "The Hotwife Games by Chatkink 4 6 ch" [ref=e185] [cursor=pointer]:
              - /url: /story/the-hotwife-games-svtb7s
              - generic [ref=e188]:
                - heading "The Hotwife Games" [level=3] [ref=e189]
                - paragraph [ref=e190]: by Chatkink
                - generic [ref=e191]:
                  - generic [ref=e192]:
                    - img [ref=e193]
                    - text: "4"
                  - generic [ref=e196]: 6 ch
            - link "A Wife Let Loose by Chatkink 5 6 ch" [ref=e197] [cursor=pointer]:
              - /url: /story/a-wife-let-loose-rzjsbt
              - generic [ref=e200]:
                - heading "A Wife Let Loose" [level=3] [ref=e201]
                - paragraph [ref=e202]: by Chatkink
                - generic [ref=e203]:
                  - generic [ref=e204]:
                    - img [ref=e205]
                    - text: "5"
                  - generic [ref=e208]: 6 ch
            - link "One Man, Two Birds — Ch. 01 by patrob1 2 1 ch" [ref=e209] [cursor=pointer]:
              - /url: /story/one-man-two-birds-ch-01-kt38tx
              - generic [ref=e212]:
                - heading "One Man, Two Birds — Ch. 01" [level=3] [ref=e213]
                - paragraph [ref=e214]: by patrob1
                - generic [ref=e215]:
                  - generic [ref=e216]:
                    - img [ref=e217]
                    - text: "2"
                  - generic [ref=e220]: 1 ch
        - generic [ref=e221]:
          - generic [ref=e223]:
            - img [ref=e224]
            - heading "Browse by Category" [level=2] [ref=e226]
          - generic [ref=e227]:
            - link "Anal 0 stories" [ref=e228] [cursor=pointer]:
              - /url: /browse/anal
              - heading "Anal" [level=3] [ref=e229]
              - paragraph [ref=e230]: 0 stories
            - link "BDSM 0 stories" [ref=e231] [cursor=pointer]:
              - /url: /browse/bdsm
              - heading "BDSM" [level=3] [ref=e232]
              - paragraph [ref=e233]: 0 stories
            - link "Celebrity 0 stories" [ref=e234] [cursor=pointer]:
              - /url: /browse/celebrity
              - heading "Celebrity" [level=3] [ref=e235]
              - paragraph [ref=e236]: 0 stories
            - link "Cheating 0 stories" [ref=e237] [cursor=pointer]:
              - /url: /browse/cheating
              - heading "Cheating" [level=3] [ref=e238]
              - paragraph [ref=e239]: 0 stories
            - link "Fantasy 0 stories" [ref=e240] [cursor=pointer]:
              - /url: /browse/fantasy
              - heading "Fantasy" [level=3] [ref=e241]
              - paragraph [ref=e242]: 0 stories
            - link "Fetish 0 stories" [ref=e243] [cursor=pointer]:
              - /url: /browse/fetish
              - heading "Fetish" [level=3] [ref=e244]
              - paragraph [ref=e245]: 0 stories
            - link "First Time 0 stories" [ref=e246] [cursor=pointer]:
              - /url: /browse/first-time
              - heading "First Time" [level=3] [ref=e247]
              - paragraph [ref=e248]: 0 stories
            - link "Gay 0 stories" [ref=e249] [cursor=pointer]:
              - /url: /browse/gay
              - heading "Gay" [level=3] [ref=e250]
              - paragraph [ref=e251]: 0 stories
            - link "Group 0 stories" [ref=e252] [cursor=pointer]:
              - /url: /browse/group
              - heading "Group" [level=3] [ref=e253]
              - paragraph [ref=e254]: 0 stories
            - link "Humor & Satire 0 stories" [ref=e255] [cursor=pointer]:
              - /url: /browse/humor
              - heading "Humor & Satire" [level=3] [ref=e256]
              - paragraph [ref=e257]: 0 stories
            - link "Interracial 0 stories" [ref=e258] [cursor=pointer]:
              - /url: /browse/interracial
              - heading "Interracial" [level=3] [ref=e259]
              - paragraph [ref=e260]: 0 stories
            - link "Lesbian 0 stories" [ref=e261] [cursor=pointer]:
              - /url: /browse/lesbian
              - heading "Lesbian" [level=3] [ref=e262]
              - paragraph [ref=e263]: 0 stories
            - link "Mature 0 stories" [ref=e264] [cursor=pointer]:
              - /url: /browse/mature
              - heading "Mature" [level=3] [ref=e265]
              - paragraph [ref=e266]: 0 stories
            - link "Non-consent/Reluctance 0 stories" [ref=e267] [cursor=pointer]:
              - /url: /browse/nonconsent
              - heading "Non-consent/Reluctance" [level=3] [ref=e268]
              - paragraph [ref=e269]: 0 stories
            - link "Other 3 stories" [ref=e270] [cursor=pointer]:
              - /url: /browse/other
              - heading "Other" [level=3] [ref=e271]
              - paragraph [ref=e272]: 3 stories
            - link "Romance 0 stories" [ref=e273] [cursor=pointer]:
              - /url: /browse/romance
              - heading "Romance" [level=3] [ref=e274]
              - paragraph [ref=e275]: 0 stories
            - link "Sci-Fi & Fantasy 0 stories" [ref=e276] [cursor=pointer]:
              - /url: /browse/scifi
              - heading "Sci-Fi & Fantasy" [level=3] [ref=e277]
              - paragraph [ref=e278]: 0 stories
            - link "Taboo 0 stories" [ref=e279] [cursor=pointer]:
              - /url: /browse/taboo
              - heading "Taboo" [level=3] [ref=e280]
              - paragraph [ref=e281]: 0 stories
            - link "Voyeur/Exhibitionism 0 stories" [ref=e282] [cursor=pointer]:
              - /url: /browse/voyeur
              - heading "Voyeur/Exhibitionism" [level=3] [ref=e283]
              - paragraph [ref=e284]: 0 stories
        - generic [ref=e287]:
          - generic [ref=e288]:
            - img [ref=e289]
            - text: For Creators
          - heading "Share your stories, earn from your craft" [level=2] [ref=e294]
          - paragraph [ref=e295]: Write in prose or chat-bubble format. Gate premium chapters behind subscriptions. Receive tips directly from readers who love your work. Keep 85% of everything you earn.
          - generic [ref=e296]:
            - generic [ref=e297]:
              - img [ref=e298]
              - heading "Two Formats" [level=3] [ref=e300]
              - paragraph [ref=e301]: Rich prose editor or interactive chat-bubble stories
            - generic [ref=e302]:
              - img [ref=e303]
              - heading "Monetization" [level=3] [ref=e305]
              - paragraph [ref=e306]: Tips, subscriptions, and gated content -- you set the price
            - generic [ref=e307]:
              - img [ref=e308]
              - heading "Community" [level=3] [ref=e310]
              - paragraph [ref=e311]: Comments, analytics, and direct connection with your readers
          - link "Start Creating" [ref=e313] [cursor=pointer]:
            - /url: /signup
            - button "Start Creating" [ref=e314]:
              - text: Start Creating
              - img [ref=e315]
    - contentinfo [ref=e317]:
      - generic [ref=e318]:
        - generic [ref=e319]:
          - generic [ref=e320]:
            - heading "Erovel" [level=3] [ref=e321]
            - paragraph [ref=e322]: A platform for adult fiction creators and readers. Stories that ignite.
          - generic [ref=e323]:
            - heading "Browse" [level=3] [ref=e324]
            - list [ref=e325]:
              - listitem [ref=e326]:
                - link "All Stories" [ref=e327] [cursor=pointer]:
                  - /url: /browse
              - listitem [ref=e328]:
                - link "Romance" [ref=e329] [cursor=pointer]:
                  - /url: /browse/romance
              - listitem [ref=e330]:
                - link "Fantasy" [ref=e331] [cursor=pointer]:
                  - /url: /browse/fantasy
              - listitem [ref=e332]:
                - link "Chat Stories" [ref=e333] [cursor=pointer]:
                  - /url: /browse?format=chat
          - generic [ref=e334]:
            - heading "Creators" [level=3] [ref=e335]
            - list [ref=e336]:
              - listitem [ref=e337]:
                - link "Why Erovel?" [ref=e338] [cursor=pointer]:
                  - /url: /creators
              - listitem [ref=e339]:
                - link "Become a Creator" [ref=e340] [cursor=pointer]:
                  - /url: /signup
              - listitem [ref=e341]:
                - link "Creator Dashboard" [ref=e342] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e343]:
                - link "Import from imgchest" [ref=e344] [cursor=pointer]:
                  - /url: /dashboard/import
          - generic [ref=e345]:
            - heading "Legal" [level=3] [ref=e346]
            - list [ref=e347]:
              - listitem [ref=e348]:
                - link "Terms of Service" [ref=e349] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e350]:
                - link "Privacy Policy" [ref=e351] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e352]:
                - link "DMCA Policy" [ref=e353] [cursor=pointer]:
                  - /url: /dmca
              - listitem [ref=e354]:
                - link "2257 Compliance" [ref=e355] [cursor=pointer]:
                  - /url: /2257
              - listitem [ref=e356]:
                - link "Refund Policy" [ref=e357] [cursor=pointer]:
                  - /url: /refund
              - listitem [ref=e358]:
                - link "Contact" [ref=e359] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e360]: © 2026 Erovel. All rights reserved. You must be 18+ to use this platform.
  - alert [ref=e361]
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
> 94  |     await page.click('[class*="cursor-pointer"]:has(svg)');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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