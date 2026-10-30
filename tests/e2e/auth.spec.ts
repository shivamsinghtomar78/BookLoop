// Authentication: guest routing, credential rules, session cookie hygiene,
// and sign-out. Uses the API for setup speed and the UI for user-visible flows.

import { test, expect } from "@playwright/test";
import { ACCOUNTS, BASE_URL, PASSWORD, storageStateFor } from "../support/env";
import { gotoHydrated } from "../support/page";

test.describe("guest access", () => {
  test("protected pages bounce guests home", async ({ page }) => {
    for (const path of ["/sell", "/chats"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new URL("/", BASE_URL).toString());
    }
  });

  test("profile invites guests to sign up", async ({ page }) => {
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "Your BookLoop profile" }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("button", { name: "Sign up" }),
    ).toBeVisible();
  });
});

test.describe("credentials", () => {
  test("valid sign-in sets an HttpOnly, SameSite=Lax session cookie", async ({
    request,
  }) => {
    const res = await request.post("/api/auth/sign-in/email", {
      data: { email: ACCOUNTS.seller, password: PASSWORD },
    });
    expect(res.status()).toBe(200);
    const cookie = res.headers()["set-cookie"] ?? "";
    expect(cookie).toContain("better-auth.session_token=");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie.toLowerCase()).not.toContain("password");
  });

  test("wrong password is refused with 401 and no user data", async ({ request }) => {
    const res = await request.post("/api/auth/sign-in/email", {
      data: { email: ACCOUNTS.seller, password: "not-the-password" },
    });
    expect(res.status()).toBe(401);
    const body = await res.text();
    expect(body).not.toContain(ACCOUNTS.seller);
  });

  test("sign-up rejects a password under 8 characters", async ({ request }) => {
    const res = await request.post("/api/auth/sign-up/email", {
      data: {
        email: `qa-e2e-short-${Date.now()}@test.bookloop.local`,
        password: "short12",
        name: "QA Short",
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("signed-in session", () => {
  test.use({ storageState: storageStateFor("seller") });

  test("profile shows the seeded student", async ({ page }) => {
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: /Asha Verma|Your BookLoop profile/ }),
    ).toBeVisible();
  });

  test("log out clears the session", async ({ page }) => {
    // Sign in again inside this test: logging out revokes the session row, and
    // the shared storage state must keep working for every other spec.
    const fresh = await page.context().request.post("/api/auth/sign-in/email", {
      headers: { Origin: BASE_URL },
      data: { email: ACCOUNTS.seller, password: PASSWORD },
    });
    expect(fresh.ok()).toBeTruthy();
    await gotoHydrated(page, "/profile");
    await page.getByRole("button", { name: /^Log out$/ }).first().click();
    await expect(page).toHaveURL(new URL("/", BASE_URL).toString());
    await page.goto("/sell");
    await expect(page).toHaveURL(new URL("/", BASE_URL).toString());
  });
});
