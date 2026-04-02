# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Dashboard >> admin dashboard shows recent signups table
- Location: e2e\admin.spec.ts:28:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
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

# Page snapshot

```yaml
- generic [ref=e1]:
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
      - generic [ref=e51]:
        - generic [ref=e52]:
          - generic [ref=e53]:
            - img [ref=e54]
            - generic [ref=e56]: Erovel
          - heading "Welcome back" [level=1] [ref=e57]
          - paragraph [ref=e58]: Sign in to continue reading and creating
        - generic [ref=e60]:
          - generic [ref=e61]:
            - generic [ref=e62]: Email
            - textbox "Email" [ref=e63]:
              - /placeholder: you@example.com
              - text: robchiarello@gmail.com
          - generic [ref=e64]:
            - generic [ref=e65]: Password
            - textbox "Password" [active] [ref=e66]:
              - /placeholder: Enter your password
              - text: Rambo316!!
          - button "Log in" [ref=e67] [cursor=pointer]
        - paragraph [ref=e68]:
          - text: Don't have an account?
          - link "Sign up" [ref=e69] [cursor=pointer]:
            - /url: /signup
    - contentinfo [ref=e70]:
      - generic [ref=e71]:
        - generic [ref=e72]:
          - generic [ref=e73]:
            - heading "Erovel" [level=3] [ref=e74]
            - paragraph [ref=e75]: A platform for adult fiction creators and readers. Stories that ignite.
          - generic [ref=e76]:
            - heading "Browse" [level=3] [ref=e77]
            - list [ref=e78]:
              - listitem [ref=e79]:
                - link "All Stories" [ref=e80] [cursor=pointer]:
                  - /url: /browse
              - listitem [ref=e81]:
                - link "Romance" [ref=e82] [cursor=pointer]:
                  - /url: /browse/romance
              - listitem [ref=e83]:
                - link "Fantasy" [ref=e84] [cursor=pointer]:
                  - /url: /browse/fantasy
              - listitem [ref=e85]:
                - link "Chat Stories" [ref=e86] [cursor=pointer]:
                  - /url: /browse?format=chat
          - generic [ref=e87]:
            - heading "Creators" [level=3] [ref=e88]
            - list [ref=e89]:
              - listitem [ref=e90]:
                - link "Why Erovel?" [ref=e91] [cursor=pointer]:
                  - /url: /creators
              - listitem [ref=e92]:
                - link "Become a Creator" [ref=e93] [cursor=pointer]:
                  - /url: /signup
              - listitem [ref=e94]:
                - link "Creator Dashboard" [ref=e95] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e96]:
                - link "Import from imgchest" [ref=e97] [cursor=pointer]:
                  - /url: /dashboard/import
          - generic [ref=e98]:
            - heading "Legal" [level=3] [ref=e99]
            - list [ref=e100]:
              - listitem [ref=e101]:
                - link "Terms of Service" [ref=e102] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e103]:
                - link "Privacy Policy" [ref=e104] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e105]:
                - link "DMCA Policy" [ref=e106] [cursor=pointer]:
                  - /url: /dmca
              - listitem [ref=e107]:
                - link "2257 Compliance" [ref=e108] [cursor=pointer]:
                  - /url: /2257
              - listitem [ref=e109]:
                - link "Refund Policy" [ref=e110] [cursor=pointer]:
                  - /url: /refund
              - listitem [ref=e111]:
                - link "Contact" [ref=e112] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e113]: © 2026 Erovel. All rights reserved. You must be 18+ to use this platform.
  - alert [ref=e114]
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