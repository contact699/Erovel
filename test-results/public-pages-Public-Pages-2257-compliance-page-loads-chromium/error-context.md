# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public Pages >> 2257 compliance page loads
- Location: e2e\public-pages.spec.ts:63:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('2257')
Expected: visible
Error: strict mode violation: getByText('2257') resolved to 5 elements:
    1) <h1 class="text-3xl font-bold mb-6">18 U.S.C. 2257 Compliance Statement</h1> aka getByRole('heading', { name: 'U.S.C. 2257 Compliance Statement' })
    2) <p>All visual content appearing on Erovel is user-ge…</p> aka getByText('All visual content appearing')
    3) <p>Records required pursuant to 18 U.S.C. 2257 and 2…</p> aka getByText('Records required pursuant to')
    4) <p>Erovel is not the primary producer of any visual …</p> aka getByText('Erovel is not the primary')
    5) <a href="/2257" class="hover:text-foreground transition-colors">2257 Compliance</a> aka getByRole('link', { name: 'Compliance' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('2257')

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
        - heading "18 U.S.C. 2257 Compliance Statement" [level=1] [ref=e51]
        - generic [ref=e52]:
          - paragraph [ref=e53]: "Last updated: April 2, 2026"
          - generic [ref=e54]:
            - heading "Custodian of Records" [level=2] [ref=e55]
            - generic [ref=e56]:
              - paragraph [ref=e57]: Robert Chiarello
              - paragraph [ref=e58]: 17816600 Canada Inc.
              - paragraph [ref=e59]: 3534 Bank St
              - paragraph [ref=e60]: Gloucester, ON K1T 3W3, Canada
              - paragraph [ref=e61]: "Email: contact@growyoursb.com"
          - generic [ref=e62]:
            - heading "User-Generated Content" [level=2] [ref=e63]
            - paragraph [ref=e64]: All visual content appearing on Erovel is user-generated. Erovel, operated by 17816600 Canada Inc., does not produce any of the visual content hosted on the platform. Creators are the primary producers of all content they upload and are solely responsible for maintaining their own records as required by 18 U.S.C. 2257 and 28 C.F.R. 75.
          - generic [ref=e65]:
            - heading "Identity Verification" [level=2] [ref=e66]
            - paragraph [ref=e67]: All creators are required to verify their identity through Veriff, a third-party identity verification service, before they are permitted to publish any content on the platform. As part of this verification process, creators certify that all individuals depicted in their content are over 18 years of age.
          - generic [ref=e68]:
            - heading "Record-Keeping" [level=2] [ref=e69]
            - paragraph [ref=e70]: Records required pursuant to 18 U.S.C. 2257 and 28 C.F.R. 75 are maintained by the custodian of records identified above. The platform maintains verification records for all creators who publish content on Erovel, including proof of identity verification and age certification.
          - generic [ref=e71]:
            - heading "Primary Producer Responsibility" [level=2] [ref=e72]
            - paragraph [ref=e73]: Erovel is not the primary producer of any visual content hosted on the platform. Creators who upload content are the primary producers and bear full responsibility for compliance with 18 U.S.C. 2257, including the obligation to maintain their own records verifying the age and identity of all individuals depicted in their content.
          - generic [ref=e74]:
            - heading "Exemption Statement" [level=2] [ref=e75]
            - paragraph [ref=e76]: Erovel qualifies for the exemption under 28 C.F.R. 75.1(c)(4) as it does not produce the content hosted on the platform. The platform operates solely as a hosting service for user-generated content and does not direct, create, or otherwise participate in the production of any visual depictions hosted on the service.
    - contentinfo [ref=e77]:
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]:
            - heading "Erovel" [level=3] [ref=e81]
            - paragraph [ref=e82]: A platform for adult fiction creators and readers. Stories that ignite.
          - generic [ref=e83]:
            - heading "Browse" [level=3] [ref=e84]
            - list [ref=e85]:
              - listitem [ref=e86]:
                - link "All Stories" [ref=e87] [cursor=pointer]:
                  - /url: /browse
              - listitem [ref=e88]:
                - link "Romance" [ref=e89] [cursor=pointer]:
                  - /url: /browse/romance
              - listitem [ref=e90]:
                - link "Fantasy" [ref=e91] [cursor=pointer]:
                  - /url: /browse/fantasy
              - listitem [ref=e92]:
                - link "Chat Stories" [ref=e93] [cursor=pointer]:
                  - /url: /browse?format=chat
          - generic [ref=e94]:
            - heading "Creators" [level=3] [ref=e95]
            - list [ref=e96]:
              - listitem [ref=e97]:
                - link "Why Erovel?" [ref=e98] [cursor=pointer]:
                  - /url: /creators
              - listitem [ref=e99]:
                - link "Become a Creator" [ref=e100] [cursor=pointer]:
                  - /url: /signup
              - listitem [ref=e101]:
                - link "Creator Dashboard" [ref=e102] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e103]:
                - link "Import from imgchest" [ref=e104] [cursor=pointer]:
                  - /url: /dashboard/import
          - generic [ref=e105]:
            - heading "Legal" [level=3] [ref=e106]
            - list [ref=e107]:
              - listitem [ref=e108]:
                - link "Terms of Service" [ref=e109] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e110]:
                - link "Privacy Policy" [ref=e111] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e112]:
                - link "DMCA Policy" [ref=e113] [cursor=pointer]:
                  - /url: /dmca
              - listitem [ref=e114]:
                - link "2257 Compliance" [ref=e115] [cursor=pointer]:
                  - /url: /2257
              - listitem [ref=e116]:
                - link "Refund Policy" [ref=e117] [cursor=pointer]:
                  - /url: /refund
              - listitem [ref=e118]:
                - link "Contact" [ref=e119] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e120]: © 2026 Erovel. All rights reserved. You must be 18+ to use this platform.
  - alert [ref=e121]
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
> 65  |     await expect(page.getByText("2257")).toBeVisible();
      |                                          ^ Error: expect(locator).toBeVisible() failed
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