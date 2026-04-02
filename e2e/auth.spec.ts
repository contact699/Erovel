import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser, login } from "./helpers";

let testReader: { email: string; password: string; username: string; userId: string };

test.beforeAll(async () => {
  testReader = await createTestUser("reader", Date.now().toString());
});

test.afterAll(async () => {
  if (testReader?.userId) await deleteTestUser(testReader.userId);
});

test.describe("Authentication", () => {
  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("Create your account")).toBeVisible();
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("login with valid credentials", async ({ page }) => {
    await login(page, testReader.email, testReader.password);
    await expect(page).toHaveURL("/");
    // Should see logout button or user menu
    await expect(page.getByText("Logout")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "fake@fake.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/Invalid|incorrect|error/i)).toBeVisible({ timeout: 5000 });
  });

  test("logout works", async ({ page }) => {
    await login(page, testReader.email, testReader.password);
    await page.click("text=Logout");
    await expect(page.getByText("Log in")).toBeVisible();
  });

  test("age gate appears on first visit", async ({ page, context }) => {
    await context.clearCookies();
    // Clear localStorage
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText("Age Verification Required")).toBeVisible();
  });

  test("age gate accepts valid age", async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.fill('input[placeholder="MM"]', "01");
    await page.fill('input[placeholder="DD"]', "15");
    await page.fill('input[placeholder="YYYY"]', "1990");
    await page.click("text=Enter");
    await expect(page.getByText("Age Verification Required")).not.toBeVisible();
  });

  test("age gate rejects underage", async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.fill('input[placeholder="MM"]', "01");
    await page.fill('input[placeholder="DD"]', "15");
    await page.fill('input[placeholder="YYYY"]', "2015");
    await page.click("text=Enter");
    await expect(page.getByText("must be 18")).toBeVisible();
  });
});
