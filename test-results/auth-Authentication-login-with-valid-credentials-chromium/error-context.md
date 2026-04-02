# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> login with valid credentials
- Location: e2e\auth.spec.ts:30:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "https://erovel.com/"
Received: "https://www.erovel.com/"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "https://www.erovel.com/"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { createTestUser, deleteTestUser, login } from "./helpers";
  3  | 
  4  | let testReader: { email: string; password: string; username: string; userId: string };
  5  | 
  6  | test.beforeAll(async () => {
  7  |   testReader = await createTestUser("reader", Date.now().toString());
  8  | });
  9  | 
  10 | test.afterAll(async () => {
  11 |   if (testReader?.userId) await deleteTestUser(testReader.userId);
  12 | });
  13 | 
  14 | test.describe("Authentication", () => {
  15 |   test("signup page loads", async ({ page }) => {
  16 |     await page.goto("/signup");
  17 |     await expect(page.getByText("Create your account")).toBeVisible();
  18 |     await expect(page.locator("#username")).toBeVisible();
  19 |     await expect(page.locator("#email")).toBeVisible();
  20 |     await expect(page.locator("#password")).toBeVisible();
  21 |   });
  22 | 
  23 |   test("login page loads", async ({ page }) => {
  24 |     await page.goto("/login");
  25 |     await expect(page.getByText("Welcome back")).toBeVisible();
  26 |     await expect(page.locator("#email")).toBeVisible();
  27 |     await expect(page.locator("#password")).toBeVisible();
  28 |   });
  29 | 
  30 |   test("login with valid credentials", async ({ page }) => {
  31 |     await login(page, testReader.email, testReader.password);
> 32 |     await expect(page).toHaveURL("/");
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  33 |     // Should see logout button or user menu
  34 |     await expect(page.getByText("Logout")).toBeVisible();
  35 |   });
  36 | 
  37 |   test("login with invalid credentials shows error", async ({ page }) => {
  38 |     await page.goto("/login");
  39 |     await page.fill('input[type="email"]', "fake@fake.com");
  40 |     await page.fill('input[type="password"]', "wrongpassword");
  41 |     await page.click('button[type="submit"]');
  42 |     await expect(page.getByText(/Invalid|incorrect|error/i)).toBeVisible({ timeout: 5000 });
  43 |   });
  44 | 
  45 |   test("logout works", async ({ page }) => {
  46 |     await login(page, testReader.email, testReader.password);
  47 |     await page.click("text=Logout");
  48 |     await expect(page.getByText("Log in")).toBeVisible();
  49 |   });
  50 | 
  51 |   test("age gate appears on first visit", async ({ page, context }) => {
  52 |     await context.clearCookies();
  53 |     // Clear localStorage
  54 |     await page.goto("/");
  55 |     await page.evaluate(() => localStorage.clear());
  56 |     await page.reload();
  57 |     await expect(page.getByText("Age Verification Required")).toBeVisible();
  58 |   });
  59 | 
  60 |   test("age gate accepts valid age", async ({ page }) => {
  61 |     await page.evaluate(() => localStorage.clear());
  62 |     await page.reload();
  63 |     await page.fill('input[placeholder="MM"]', "01");
  64 |     await page.fill('input[placeholder="DD"]', "15");
  65 |     await page.fill('input[placeholder="YYYY"]', "1990");
  66 |     await page.click("text=Enter");
  67 |     await expect(page.getByText("Age Verification Required")).not.toBeVisible();
  68 |   });
  69 | 
  70 |   test("age gate rejects underage", async ({ page }) => {
  71 |     await page.evaluate(() => localStorage.clear());
  72 |     await page.reload();
  73 |     await page.fill('input[placeholder="MM"]', "01");
  74 |     await page.fill('input[placeholder="DD"]', "15");
  75 |     await page.fill('input[placeholder="YYYY"]', "2015");
  76 |     await page.click("text=Enter");
  77 |     await expect(page.getByText("must be 18")).toBeVisible();
  78 |   });
  79 | });
  80 | 
```