// Security: headers, auth boundaries, cross-origin writes, upload limits,
// admin gating, and output escaping.

import { test, expect } from "@playwright/test";
import { ACCOUNTS, PASSWORD, storageStateFor } from "../support/env";

test.describe("response headers", () => {
  test("baseline hardening headers are present", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["permissions-policy"]).toContain("microphone=()");
    expect(h["cross-origin-opener-policy"]).toBe("same-origin");
    expect(h["content-security-policy-report-only"]).toContain("default-src 'self'");
    expect(h["x-powered-by"]).toBeUndefined();
  });
});

test.describe("auth boundaries", () => {
  test("cross-origin sign-in is refused", async ({ request }) => {
    const res = await request.post("/api/auth/sign-in/email", {
      headers: { Origin: "https://evil.example" },
      data: { email: ACCOUNTS.seller, password: PASSWORD },
    });
    expect(res.status()).toBe(403);
  });

  test("photo upload requires a session", async ({ request }) => {
    const res = await request.post("/api/photos", {
      multipart: {
        photos: { name: "x.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not-a-jpeg") },
      },
    });
    expect(res.status()).toBe(401);
  });

  test("photo upload refuses foreign origins", async ({ request }) => {
    const res = await request.post("/api/photos", {
      headers: { Origin: "https://evil.example" },
      multipart: {
        photos: { name: "x.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not-a-jpeg") },
      },
    });
    expect(res.status()).toBe(403);
  });

  test("chat token requires a session", async ({ request }) => {
    const res = await request.get("/api/chat-token");
    expect(res.status()).toBe(401);
  });
});

test.describe("photo service", () => {
  test("unknown or malformed ids are 404", async ({ request }) => {
    expect((await request.get("/api/photos/not-a-uuid")).status()).toBe(404);
    expect(
      (await request.get("/api/photos/00000000-0000-4000-8000-000000000000")).status(),
    ).toBe(404);
  });
});

test.describe("signed-in boundaries", () => {
  test.use({ storageState: storageStateFor("buyer") });

  test("admin stats is hidden from students", async ({ page }) => {
    const res = await page.goto("/admin/stats");
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("oversized photo upload returns 413", async ({ request }) => {
    const big = Buffer.alloc(5 * 1024 * 1024, 0x42);
    const res = await request.post("/api/photos", {
      multipart: {
        photos: { name: "big.jpg", mimeType: "image/jpeg", buffer: big },
      },
    });
    expect(res.status()).toBe(413);
  });

  test("search output escapes script payloads", async ({ page }) => {
    await page.goto('/search?q=%3Cimg%20src%3Dx%20onerror%3D%22window.__xss%3D1%22%3E');
    const fired = await page.evaluate(() => (window as unknown as { __xss?: number }).__xss);
    expect(fired).toBeUndefined();
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
  });
});
