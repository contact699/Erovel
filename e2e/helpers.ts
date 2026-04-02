import { Page } from "@playwright/test";

export const SUPABASE_URL = "https://vduycybyipwaxxiagvhc.supabase.co";
export const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkdXljeWJ5aXB3YXh4aWFndmhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc4Mjg5OSwiZXhwIjoyMDkwMzU4ODk5fQ.Rm0H_aoD0FLcc_T_9OP9cCTmt-Y3TKj8yRqeycWHewM";

export async function bypassAgeGate(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "auth-store",
      JSON.stringify({
        state: {
          user: null,
          isAuthenticated: false,
          isAgeVerified: true,
          hydrated: true,
          loading: false,
          error: null,
        },
        version: 0,
      })
    );
  });
  await page.reload();
  await page.waitForTimeout(500);
}

export async function login(page: Page, email: string, password: string) {
  await bypassAgeGate(page);
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

export async function createTestUser(
  role: "reader" | "creator" | "admin",
  suffix: string
) {
  const email = `e2e-${role}-${suffix}@test.erovel.com`;
  const password = "TestPass123!";
  const username = `e2e_${role}_${suffix}`;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: `E2E ${role}`, role },
    }),
  });

  const data = await res.json();

  if (role === "creator" && data.id) {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.id}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ is_verified: true }),
    });
  }

  return { email, password, username, userId: data.id };
}

export async function deleteTestUser(userId: string) {
  if (!userId) return;
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
}
