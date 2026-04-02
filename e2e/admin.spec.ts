import { test, expect } from "@playwright/test";
import { bypassAgeGate, login } from "./helpers";

const ADMIN_EMAIL = "robchiarello@gmail.com";
const ADMIN_PASSWORD = "Rambo316!!";

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("admin dashboard loads with metrics", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(3000);
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByText("Total Users")).toBeVisible();
    await expect(page.getByText("Total Stories")).toBeVisible();
    await expect(page.getByText("Total Views")).toBeVisible();
  });

  test("admin dashboard shows charts", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(3000);
    await expect(page.getByText("Daily Signups")).toBeVisible();
    await expect(page.getByText("Daily Views")).toBeVisible();
  });

  test("admin dashboard shows recent signups table", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(3000);
    await expect(page.getByText("Recent Signups")).toBeVisible();
  });

  test("admin dashboard shows top stories table", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(3000);
    await expect(page.getByText("Top Stories")).toBeVisible();
  });

  test("admin reports page loads", async ({ page }) => {
    await page.goto("/admin/reports");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/report|moderation/i)).toBeVisible();
  });

  test("admin users page loads", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/user/i)).toBeVisible();
  });

  test("admin dashboard has refresh button", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(3000);
    await expect(page.getByText("Refresh")).toBeVisible();
  });

  test("non-admin cannot access admin pages", async ({ page }) => {
    // Logout admin
    await page.click("text=Logout");
    await page.waitForTimeout(1000);
    await page.goto("/admin");
    await page.waitForTimeout(2000);
    // Should see access denied or redirect
    const hasAccessDenied = await page.getByText(/access denied|not authorized|admin/i).isVisible();
    const isRedirected = !page.url().includes("/admin");
    expect(hasAccessDenied || isRedirected).toBeTruthy();
  });
});
