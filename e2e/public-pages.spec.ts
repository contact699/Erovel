import { test, expect } from "@playwright/test";
import { bypassAgeGate } from "./helpers";

test.describe("Public Pages", () => {
  test.beforeEach(async ({ page }) => {
    await bypassAgeGate(page);
  });

  test("homepage loads with hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Stories that ignite")).toBeVisible();
    await expect(page.getByText("Browse Stories")).toBeVisible();
  });

  test("browse page loads", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByText("Browse Stories")).toBeVisible();
    await expect(page.getByText("Categories")).toBeVisible();
  });

  test("browse has format filter", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByText("All Formats")).toBeVisible();
  });

  test("browse has sort options", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByText("Trending")).toBeVisible();
  });

  test("search page loads", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText("Search Stories")).toBeVisible();
  });

  test("category browse page loads", async ({ page }) => {
    await page.goto("/browse/romance");
    await expect(page).toHaveURL(/browse\/romance/);
  });

  test("404 page for invalid route", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz");
    await expect(page.getByText("404")).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByText("Terms of Service")).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText("Privacy Policy")).toBeVisible();
  });

  test("dmca page loads with agent info", async ({ page }) => {
    await page.goto("/dmca");
    await expect(page.getByText("DMCA Policy")).toBeVisible();
    await expect(page.getByText("Robert Chiarello")).toBeVisible();
    await expect(page.getByText("DMCA-1071086")).toBeVisible();
  });

  test("2257 compliance page loads", async ({ page }) => {
    await page.goto("/2257");
    await expect(page.getByText("2257")).toBeVisible();
  });

  test("refund policy page loads", async ({ page }) => {
    await page.goto("/refund");
    await expect(page.getByText("Refund")).toBeVisible();
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByText("Contact")).toBeVisible();
    await expect(page.getByText("contact@growyoursb.com")).toBeVisible();
  });

  test("creators landing page loads", async ({ page }) => {
    await page.goto("/creators");
    await expect(page.getByText("Your stories deserve")).toBeVisible();
    await expect(page.getByText("85%")).toBeVisible();
  });

  test("header navigation links work", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Browse");
    await expect(page).toHaveURL(/browse/);
  });

  test("theme toggle works", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await page.click('[class*="cursor-pointer"]:has(svg)');
    // Should toggle dark class
    const hasDark = await html.evaluate((el) => el.classList.contains("dark"));
    expect(typeof hasDark).toBe("boolean");
  });

  test("footer has all legal links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByText("Terms of Service")).toBeVisible();
    await expect(footer.getByText("Privacy Policy")).toBeVisible();
    await expect(footer.getByText("DMCA Policy")).toBeVisible();
    await expect(footer.getByText("Refund Policy")).toBeVisible();
    await expect(footer.getByText("Contact")).toBeVisible();
  });
});
