# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reading.spec.ts >> Reading Experience >> authenticated user can see comment form
- Location: e2e\reading.spec.ts:83:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
    - locator resolved to <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-accent text-white hover:bg-accent-hover px-6 py-3 text-base w-full">Log in</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p class="text-sm font-medium">Enter your date of birth</p> from <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span class="text-3xl font-bold tracking-tight">Erovel</span> from <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> subtree intercepts pointer events
  12 × retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p class="text-sm font-medium">Enter your date of birth</p> from <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <span class="text-3xl font-bold tracking-tight">Erovel</span> from <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <span class="text-3xl font-bold tracking-tight">Erovel</span> from <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p class="text-sm font-medium">Enter your date of birth</p> from <div class="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Test source

```ts
  1  | import { Page } from "@playwright/test";
  2  | 
  3  | export const SUPABASE_URL = "https://vduycybyipwaxxiagvhc.supabase.co";
  4  | export const SERVICE_ROLE_KEY =
  5  |   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkdXljeWJ5aXB3YXh4aWFndmhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc4Mjg5OSwiZXhwIjoyMDkwMzU4ODk5fQ.Rm0H_aoD0FLcc_T_9OP9cCTmt-Y3TKj8yRqeycWHewM";
  6  | 
  7  | export async function bypassAgeGate(page: Page) {
  8  |   await page.goto("/");
  9  |   await page.evaluate(() => {
  10 |     localStorage.setItem(
  11 |       "auth-store",
  12 |       JSON.stringify({
  13 |         state: {
  14 |           user: null,
  15 |           isAuthenticated: false,
  16 |           isAgeVerified: true,
  17 |           hydrated: true,
  18 |           loading: false,
  19 |           error: null,
  20 |         },
  21 |         version: 0,
  22 |       })
  23 |     );
  24 |   });
  25 |   await page.reload();
  26 |   await page.waitForTimeout(500);
  27 | }
  28 | 
  29 | export async function login(page: Page, email: string, password: string) {
  30 |   await bypassAgeGate(page);
  31 |   await page.goto("/login");
  32 |   await page.fill('input[type="email"]', email);
  33 |   await page.fill('input[type="password"]', password);
> 34 |   await page.click('button[type="submit"]');
     |              ^ Error: page.click: Test timeout of 30000ms exceeded.
  35 |   await page.waitForTimeout(3000);
  36 | }
  37 | 
  38 | export async function createTestUser(
  39 |   role: "reader" | "creator" | "admin",
  40 |   suffix: string
  41 | ) {
  42 |   const email = `e2e-${role}-${suffix}@test.erovel.com`;
  43 |   const password = "TestPass123!";
  44 |   const username = `e2e_${role}_${suffix}`;
  45 | 
  46 |   const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  47 |     method: "POST",
  48 |     headers: {
  49 |       apikey: SERVICE_ROLE_KEY,
  50 |       Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  51 |       "Content-Type": "application/json",
  52 |     },
  53 |     body: JSON.stringify({
  54 |       email,
  55 |       password,
  56 |       email_confirm: true,
  57 |       user_metadata: { username, display_name: `E2E ${role}`, role },
  58 |     }),
  59 |   });
  60 | 
  61 |   const data = await res.json();
  62 | 
  63 |   if (role === "creator" && data.id) {
  64 |     await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.id}`, {
  65 |       method: "PATCH",
  66 |       headers: {
  67 |         apikey: SERVICE_ROLE_KEY,
  68 |         Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  69 |         "Content-Type": "application/json",
  70 |         Prefer: "return=minimal",
  71 |       },
  72 |       body: JSON.stringify({ is_verified: true }),
  73 |     });
  74 |   }
  75 | 
  76 |   return { email, password, username, userId: data.id };
  77 | }
  78 | 
  79 | export async function deleteTestUser(userId: string) {
  80 |   if (!userId) return;
  81 |   await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
  82 |     method: "DELETE",
  83 |     headers: {
  84 |       apikey: SERVICE_ROLE_KEY,
  85 |       Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  86 |     },
  87 |   });
  88 | }
  89 | 
```