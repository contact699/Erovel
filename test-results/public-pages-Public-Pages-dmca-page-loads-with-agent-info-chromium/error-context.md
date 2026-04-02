# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public Pages >> dmca page loads with agent info
- Location: e2e\public-pages.spec.ts:56:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('DMCA Policy')
Expected: visible
Error: strict mode violation: getByText('DMCA Policy') resolved to 2 elements:
    1) <h1 class="text-3xl font-bold mb-6">DMCA Policy</h1> aka getByRole('heading', { name: 'DMCA Policy' })
    2) <a href="/dmca" class="hover:text-foreground transition-colors">DMCA Policy</a> aka getByRole('link', { name: 'DMCA Policy' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('DMCA Policy')

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
        - heading "DMCA Policy" [level=1] [ref=e51]
        - generic [ref=e52]:
          - paragraph [ref=e53]: "Last updated: April 2, 2026"
          - generic [ref=e54]:
            - heading "Copyright Infringement Notice" [level=2] [ref=e55]
            - paragraph [ref=e56]: Erovel ("17816600 Canada Inc.") respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe that content hosted on our platform infringes your copyright, you may submit a takedown notice to our designated agent.
          - generic [ref=e57]:
            - heading "Designated DMCA Agent" [level=2] [ref=e58]
            - generic [ref=e59]:
              - paragraph [ref=e60]: Robert Chiarello
              - paragraph [ref=e61]: 17816600 Canada Inc.
              - paragraph [ref=e62]: 3534 Bank St
              - paragraph [ref=e63]: Gloucester, ON K1T 3W3, Canada
              - paragraph [ref=e64]: "Email: contact@growyoursb.com"
              - paragraph [ref=e65]: DMCA Registration No. DMCA-1071086
          - generic [ref=e66]:
            - heading "Filing a DMCA Notice" [level=2] [ref=e67]
            - paragraph [ref=e68]: "To file a valid DMCA takedown notice, please provide the following information in writing:"
            - list [ref=e69]:
              - listitem [ref=e70]: A physical or electronic signature of the copyright owner or authorized agent.
              - listitem [ref=e71]: Identification of the copyrighted work claimed to have been infringed.
              - listitem [ref=e72]: Identification of the material that is claimed to be infringing, with enough detail to allow us to locate the material (e.g., the URL of the page).
              - listitem [ref=e73]: Your contact information, including name, address, telephone number, and email.
              - listitem [ref=e74]: A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.
              - listitem [ref=e75]: A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on behalf of the owner.
          - generic [ref=e76]:
            - heading "Counter-Notification" [level=2] [ref=e77]
            - paragraph [ref=e78]: "If you believe your content was removed in error, you may file a counter-notification with the same designated agent. The counter-notification must include:"
            - list [ref=e79]:
              - listitem [ref=e80]: Your physical or electronic signature.
              - listitem [ref=e81]: Identification of the material that was removed and where it appeared.
              - listitem [ref=e82]: A statement under penalty of perjury that you have a good faith belief the material was removed by mistake or misidentification.
              - listitem [ref=e83]: Your name, address, telephone number, and a statement consenting to jurisdiction of the federal court in your district.
          - generic [ref=e84]:
            - heading "Repeat Infringers" [level=2] [ref=e85]
            - paragraph [ref=e86]: In accordance with the DMCA, Erovel will terminate the accounts of users who are determined to be repeat infringers. We reserve the right to remove any content and terminate any account at our discretion.
    - contentinfo [ref=e87]:
      - generic [ref=e88]:
        - generic [ref=e89]:
          - generic [ref=e90]:
            - heading "Erovel" [level=3] [ref=e91]
            - paragraph [ref=e92]: A platform for adult fiction creators and readers. Stories that ignite.
          - generic [ref=e93]:
            - heading "Browse" [level=3] [ref=e94]
            - list [ref=e95]:
              - listitem [ref=e96]:
                - link "All Stories" [ref=e97] [cursor=pointer]:
                  - /url: /browse
              - listitem [ref=e98]:
                - link "Romance" [ref=e99] [cursor=pointer]:
                  - /url: /browse/romance
              - listitem [ref=e100]:
                - link "Fantasy" [ref=e101] [cursor=pointer]:
                  - /url: /browse/fantasy
              - listitem [ref=e102]:
                - link "Chat Stories" [ref=e103] [cursor=pointer]:
                  - /url: /browse?format=chat
          - generic [ref=e104]:
            - heading "Creators" [level=3] [ref=e105]
            - list [ref=e106]:
              - listitem [ref=e107]:
                - link "Why Erovel?" [ref=e108] [cursor=pointer]:
                  - /url: /creators
              - listitem [ref=e109]:
                - link "Become a Creator" [ref=e110] [cursor=pointer]:
                  - /url: /signup
              - listitem [ref=e111]:
                - link "Creator Dashboard" [ref=e112] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e113]:
                - link "Import from imgchest" [ref=e114] [cursor=pointer]:
                  - /url: /dashboard/import
          - generic [ref=e115]:
            - heading "Legal" [level=3] [ref=e116]
            - list [ref=e117]:
              - listitem [ref=e118]:
                - link "Terms of Service" [ref=e119] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e120]:
                - link "Privacy Policy" [ref=e121] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e122]:
                - link "DMCA Policy" [ref=e123] [cursor=pointer]:
                  - /url: /dmca
              - listitem [ref=e124]:
                - link "2257 Compliance" [ref=e125] [cursor=pointer]:
                  - /url: /2257
              - listitem [ref=e126]:
                - link "Refund Policy" [ref=e127] [cursor=pointer]:
                  - /url: /refund
              - listitem [ref=e128]:
                - link "Contact" [ref=e129] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e130]: © 2026 Erovel. All rights reserved. You must be 18+ to use this platform.
  - alert [ref=e131]
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
> 58  |     await expect(page.getByText("DMCA Policy")).toBeVisible();
      |                                                 ^ Error: expect(locator).toBeVisible() failed
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