# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public Pages >> contact page loads
- Location: e2e\public-pages.spec.ts:73:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Contact')
Expected: visible
Error: strict mode violation: getByText('Contact') resolved to 4 elements:
    1) <h1 class="text-3xl font-bold mb-6">Contact & Support</h1> aka getByRole('heading', { name: 'Contact & Support' })
    2) <a href="mailto:contact@growyoursb.com" class="underline hover:no-underline">contact@growyoursb.com</a> aka getByRole('link', { name: 'contact@growyoursb.com' }).first()
    3) <a href="mailto:contact@growyoursb.com" class="text-foreground underline hover:no-underline">contact@growyoursb.com</a> aka getByRole('link', { name: 'contact@growyoursb.com' }).nth(1)
    4) <a href="/contact" class="hover:text-foreground transition-colors">Contact</a> aka getByRole('link', { name: 'Contact', exact: true })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Contact')

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
        - heading "Contact & Support" [level=1] [ref=e51]
        - generic [ref=e52]:
          - paragraph [ref=e53]: Erovel is operated by 17816600 Canada Inc. If you need assistance, have a question, or need to report an issue, we are here to help.
          - generic [ref=e54]:
            - heading "Business Information" [level=2] [ref=e55]
            - generic [ref=e56]:
              - paragraph [ref=e57]: Robert Chiarello
              - paragraph [ref=e58]: 17816600 Canada Inc.
              - paragraph [ref=e59]: 3534 Bank St
              - paragraph [ref=e60]: Gloucester, ON K1T 3W3, Canada
              - paragraph [ref=e61]:
                - text: "Email:"
                - link "contact@growyoursb.com" [ref=e62] [cursor=pointer]:
                  - /url: mailto:contact@growyoursb.com
          - generic [ref=e63]:
            - heading "Support Email" [level=2] [ref=e64]
            - paragraph [ref=e65]:
              - text: For all inquiries, reach us at
              - link "contact@growyoursb.com" [ref=e66] [cursor=pointer]:
                - /url: mailto:contact@growyoursb.com
              - text: . We aim to respond to all messages within 48 hours.
          - generic [ref=e67]:
            - heading "How Can We Help?" [level=2] [ref=e68]
            - paragraph [ref=e69]: "We handle the following categories of inquiries:"
            - list [ref=e70]:
              - listitem [ref=e71]: General Inquiries— Questions about Erovel, how the platform works, or general feedback.
              - listitem [ref=e72]:
                - text: Billing & Payment Issues— Charges, refunds, subscription management, or payment method questions. See our
                - link "Refund Policy" [ref=e73] [cursor=pointer]:
                  - /url: /refund
                - text: for details.
              - listitem [ref=e74]: Content Reports— Report content that violates our terms of service, community guidelines, or applicable law.
              - listitem [ref=e75]:
                - text: DMCA Notices— Copyright infringement claims and counter-notifications. See our
                - link "DMCA Policy" [ref=e76] [cursor=pointer]:
                  - /url: /dmca
                - text: for filing instructions.
              - listitem [ref=e77]: Creator Support— Help with creator accounts, verification, payouts, or content management.
          - generic [ref=e78]:
            - heading "Response Time" [level=2] [ref=e79]
            - paragraph [ref=e80]: We strive to respond to all inquiries within 48 hours. During periods of high volume, response times may be slightly longer. For urgent matters such as unauthorized account access, please indicate the urgency in your subject line.
          - generic [ref=e81]:
            - heading "Related Policies" [level=2] [ref=e82]
            - list [ref=e83]:
              - listitem [ref=e84]:
                - link "DMCA Policy" [ref=e85] [cursor=pointer]:
                  - /url: /dmca
                - text: — Copyright infringement and takedown procedures.
              - listitem [ref=e86]:
                - link "Refund & Cancellation Policy" [ref=e87] [cursor=pointer]:
                  - /url: /refund
                - text: — Refunds, cancellations, and billing disputes.
              - listitem [ref=e88]:
                - link "Terms of Service" [ref=e89] [cursor=pointer]:
                  - /url: /terms
                - text: — Platform usage terms and conditions.
              - listitem [ref=e90]:
                - link "Privacy Policy" [ref=e91] [cursor=pointer]:
                  - /url: /privacy
                - text: — How we handle your data.
    - contentinfo [ref=e92]:
      - generic [ref=e93]:
        - generic [ref=e94]:
          - generic [ref=e95]:
            - heading "Erovel" [level=3] [ref=e96]
            - paragraph [ref=e97]: A platform for adult fiction creators and readers. Stories that ignite.
          - generic [ref=e98]:
            - heading "Browse" [level=3] [ref=e99]
            - list [ref=e100]:
              - listitem [ref=e101]:
                - link "All Stories" [ref=e102] [cursor=pointer]:
                  - /url: /browse
              - listitem [ref=e103]:
                - link "Romance" [ref=e104] [cursor=pointer]:
                  - /url: /browse/romance
              - listitem [ref=e105]:
                - link "Fantasy" [ref=e106] [cursor=pointer]:
                  - /url: /browse/fantasy
              - listitem [ref=e107]:
                - link "Chat Stories" [ref=e108] [cursor=pointer]:
                  - /url: /browse?format=chat
          - generic [ref=e109]:
            - heading "Creators" [level=3] [ref=e110]
            - list [ref=e111]:
              - listitem [ref=e112]:
                - link "Why Erovel?" [ref=e113] [cursor=pointer]:
                  - /url: /creators
              - listitem [ref=e114]:
                - link "Become a Creator" [ref=e115] [cursor=pointer]:
                  - /url: /signup
              - listitem [ref=e116]:
                - link "Creator Dashboard" [ref=e117] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e118]:
                - link "Import from imgchest" [ref=e119] [cursor=pointer]:
                  - /url: /dashboard/import
          - generic [ref=e120]:
            - heading "Legal" [level=3] [ref=e121]
            - list [ref=e122]:
              - listitem [ref=e123]:
                - link "Terms of Service" [ref=e124] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e125]:
                - link "Privacy Policy" [ref=e126] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e127]:
                - link "DMCA Policy" [ref=e128] [cursor=pointer]:
                  - /url: /dmca
              - listitem [ref=e129]:
                - link "2257 Compliance" [ref=e130] [cursor=pointer]:
                  - /url: /2257
              - listitem [ref=e131]:
                - link "Refund Policy" [ref=e132] [cursor=pointer]:
                  - /url: /refund
              - listitem [ref=e133]:
                - link "Contact" [ref=e134] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e135]: © 2026 Erovel. All rights reserved. You must be 18+ to use this platform.
  - alert [ref=e136]
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
> 75  |     await expect(page.getByText("Contact")).toBeVisible();
      |                                             ^ Error: expect(locator).toBeVisible() failed
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