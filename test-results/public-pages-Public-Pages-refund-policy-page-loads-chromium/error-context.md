# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public Pages >> refund policy page loads
- Location: e2e\public-pages.spec.ts:68:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Refund')
Expected: visible
Error: strict mode violation: getByText('Refund') resolved to 10 elements:
    1) <h1 class="text-3xl font-bold mb-6">Refund & Cancellation Policy</h1> aka getByRole('heading', { name: 'Refund & Cancellation Policy' })
    2) <p>Erovel is operated by 17816600 Canada Inc. (Rober…</p> aka getByText('Erovel is operated by')
    3) <h2 class="text-lg font-semibold text-foreground">Digital Goods (Non-Refundable)</h2> aka getByRole('heading', { name: 'Digital Goods (Non-Refundable)' })
    4) <p>Tips and one-time story purchases are non-refunda…</p> aka getByText('Tips and one-time story')
    5) <p>You may cancel your subscription at any time. Upo…</p> aka getByText('You may cancel your')
    6) <p>…</p> aka getByText('If you believe you have been')
    7) <h2 class="text-lg font-semibold text-foreground">Refund Exceptions</h2> aka getByRole('heading', { name: 'Refund Exceptions' })
    8) <p>Refunds may be issued in the following circumstan…</p> aka getByText('Refunds may be issued in the')
    9) <p>Approved refunds are processed within 5–10 busine…</p> aka getByText('Approved refunds are')
    10) <a href="/refund" class="hover:text-foreground transition-colors">Refund Policy</a> aka getByRole('link', { name: 'Refund Policy' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Refund')

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
        - heading "Refund & Cancellation Policy" [level=1] [ref=e51]
        - generic [ref=e52]:
          - paragraph [ref=e53]: "Last updated: April 2, 2026"
          - paragraph [ref=e54]: Erovel is operated by 17816600 Canada Inc. (Robert Chiarello, 3534 Bank St, Gloucester, ON K1T 3W3, Canada). This policy outlines our refund and cancellation terms for all purchases made on the platform.
          - generic [ref=e55]:
            - heading "Digital Goods (Non-Refundable)" [level=2] [ref=e56]
            - paragraph [ref=e57]: Tips and one-time story purchases are non-refundable. These are digital goods that are delivered immediately upon purchase. By completing a purchase, you acknowledge that the digital content is made available to you instantly and that you waive any right of withdrawal or refund for these transactions.
          - generic [ref=e58]:
            - heading "Subscriptions" [level=2] [ref=e59]
            - paragraph [ref=e60]: You may cancel your subscription at any time. Upon cancellation, you will retain access to the subscribed content until the end of your current billing period. No prorated refunds are issued for the remaining time in a billing cycle.
          - generic [ref=e61]:
            - heading "How to Cancel" [level=2] [ref=e62]
            - paragraph [ref=e63]: "You can cancel your subscription in two ways:"
            - list [ref=e64]:
              - listitem [ref=e65]: Through your account settings under the "Subscriptions" section.
              - listitem [ref=e66]:
                - text: By contacting our support team at
                - link "contact@growyoursb.com" [ref=e67] [cursor=pointer]:
                  - /url: mailto:contact@growyoursb.com
                - text: .
          - generic [ref=e68]:
            - heading "Billing Errors" [level=2] [ref=e69]
            - paragraph [ref=e70]:
              - text: If you believe you have been charged incorrectly, please contact our support team within 30 days of the charge at
              - link "contact@growyoursb.com" [ref=e71] [cursor=pointer]:
                - /url: mailto:contact@growyoursb.com
              - text: . We will review the charge and, if a billing error is confirmed, issue a refund accordingly.
          - generic [ref=e72]:
            - heading "Refund Exceptions" [level=2] [ref=e73]
            - paragraph [ref=e74]: "Refunds may be issued in the following circumstances:"
            - list [ref=e75]:
              - listitem [ref=e76]: Confirmed billing errors (e.g., incorrect amount charged).
              - listitem [ref=e77]: Duplicate charges for the same transaction.
              - listitem [ref=e78]: Unauthorized transactions (charges made without your consent).
          - generic [ref=e79]:
            - heading "Processing Time" [level=2] [ref=e80]
            - paragraph [ref=e81]: Approved refunds are processed within 5–10 business days. The time it takes for the refund to appear on your statement may vary depending on your payment provider.
          - generic [ref=e82]:
            - heading "Chargebacks" [level=2] [ref=e83]
            - paragraph [ref=e84]: We encourage you to contact our support team before initiating a dispute or chargeback with your bank or payment provider. We are committed to resolving billing issues promptly and fairly. Filing a fraudulent chargeback (i.e., disputing a legitimate charge) may result in the termination of your account.
          - generic [ref=e85]:
            - heading "Contact for Billing Issues" [level=2] [ref=e86]
            - generic [ref=e87]:
              - paragraph [ref=e88]: 17816600 Canada Inc.
              - paragraph [ref=e89]: 3534 Bank St, Gloucester, ON K1T 3W3, Canada
              - paragraph [ref=e90]:
                - text: "Email:"
                - link "contact@growyoursb.com" [ref=e91] [cursor=pointer]:
                  - /url: mailto:contact@growyoursb.com
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
> 70  |     await expect(page.getByText("Refund")).toBeVisible();
      |                                            ^ Error: expect(locator).toBeVisible() failed
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