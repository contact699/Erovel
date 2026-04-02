import { test, expect } from "@playwright/test";
import { SUPABASE_URL, SERVICE_ROLE_KEY } from "./helpers";

test.describe("API Endpoints", () => {
  test("GET /api/veriff/webhook returns status", async ({ request }) => {
    const res = await request.get("/api/veriff/webhook");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toContain("active");
  });

  test("POST /api/import requires URL", async ({ request }) => {
    const res = await request.post("/api/import", {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/import validates imgchest URL", async ({ request }) => {
    const res = await request.post("/api/import", {
      data: { url: "https://example.com/not-imgchest" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid imgchest URL");
  });

  test("POST /api/import fetches valid imgchest gallery", async ({ request }) => {
    const res = await request.post("/api/import", {
      data: { url: "https://imgchest.com/p/9p4n8gl5l4n" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.images).toBeDefined();
    expect(body.images.length).toBeGreaterThan(0);
    expect(body.title).toBeDefined();
  });

  test("GET /api/admin/stats returns data", async ({ request }) => {
    const res = await request.get("/api/admin/stats");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.counts).toBeDefined();
    expect(body.counts.totalUsers).toBeGreaterThanOrEqual(0);
  });

  test("GET /api/cron/publish returns result", async ({ request }) => {
    const res = await request.get("/api/cron/publish");
    expect(res.status()).toBe(200);
  });

  test("POST /api/upload requires auth", async ({ request }) => {
    const res = await request.post("/api/upload");
    // Should return 401 or 503
    expect([401, 503]).toContain(res.status());
  });

  test("POST /api/moderate requires auth", async ({ request }) => {
    const res = await request.post("/api/moderate", {
      data: { urls: ["https://example.com/test.jpg"] },
    });
    expect([401, 503]).toContain(res.status());
  });

  test("Supabase stories endpoint is accessible", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=id&status=eq.published&limit=1`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    expect(res.status).toBe(200);
  });

  test("Supabase categories are seeded", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,name&order=name`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    expect(res.status).toBe(200);
    const cats = await res.json();
    expect(cats.length).toBeGreaterThan(10);
    expect(cats.find((c: { id: string }) => c.id === "romance")).toBeDefined();
  });

  test("robots.txt is accessible", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text.toLowerCase()).toContain("user-agent");
    expect(text.toLowerCase()).toContain("sitemap");
  });

  test("sitemap.xml is accessible", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("urlset");
    expect(text).toContain("erovel.com");
  });

  test("manifest.json is accessible", async ({ request }) => {
    const res = await request.get("/manifest.json");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Erovel");
    expect(body.display).toBe("standalone");
  });
});
