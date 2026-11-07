// Explicit restoration checks against the already-running local dev server.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";

const origin = process.env.VERIFY_URL ?? "http://localhost:3000";
const output = "docs/verification/hero-restored";
await mkdir(output, { recursive: true });
const hashes = JSON.parse(await readFile("docs/verification/restore-protected-hashes.json", "utf8"));
for (const [file, expected] of Object.entries(hashes)) {
  const hash = createHash("sha256").update(await readFile(file)).digest("hex");
  assert.equal(hash, expected, `${file} must remain unchanged`);
}
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const name of ["desktop", "mobile", "reduced-motion", "webgl-unavailable"]) {
    const context = await browser.newContext({
      viewport: name === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      ...(name === "mobile" ? { isMobile: true, hasTouch: true } : {}),
      ...(name === "reduced-motion" ? { reducedMotion: "reduce" } : {}),
    });
    if (name === "webgl-unavailable") {
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (...args) {
          return String(args[0]).includes("webgl") ? null : original.apply(this, args);
        };
      });
    }
    const page = await context.newPage();
    const errors = [], modelRequests = [], removedAssetRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.url().endsWith("/brand/abg-logo.glb")) modelRequests.push(request.url());
      if (request.url().includes("abg-logo-splash")) removedAssetRequests.push(request.url());
    });
    if (name === "desktop") await page.route("**/brand/abg-logo.glb", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3500)); await route.continue();
    });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator(".abg-splash,.abg-experience-site,[inert]").count(), 0);
    assert.notEqual(await page.evaluate(() => document.documentElement.style.overflow), "hidden");
    const brand = page.locator("header").getByRole("link", { name: "ABG Studios \u2014 Home", exact: true });
    assert.equal(await brand.getAttribute("href"), "/");
    assert.equal(await brand.locator("svg").count(), 1);
    assert.equal(await brand.locator("canvas,img,.abg-brand-script").count(), 0);
    assert.equal(await brand.locator("svg").evaluate((element) => element.getBoundingClientRect().width), 36);
    if (name === "desktop") {
      // Booking responds while the model request is deliberately still pending.
      // The calendar is server-rendered; wait for client effects, not GLB readiness.
      await page.locator(".abg-hero-left canvas").waitFor();
      assert.deepEqual(errors, []);
      await page.locator(".abg-calendar-grid button:not([disabled])").first().click();
      await page.waitForFunction(() => Boolean(document.querySelector('.abg-calendar-grid button[aria-pressed="true"]')));
      await page.getByRole("button", { name: "Continue" }).click();
      await page.getByLabel("What should we call you?").fill("Preserved Guest");
    }
    if (name === "webgl-unavailable") {
      await page.getByText("3D logo unavailable on this device.", { exact: true }).waitFor();
      assert(await page.getByRole("group", { name: "Preferred date" }).isVisible());
    } else {
      await page.waitForFunction(() => document.querySelector(".abg-hero-left .abg-logo-canvas")?.dataset.ready === "true", undefined, { timeout: 30000 });
      assert.equal(await page.locator(".abg-hero-left canvas").count(), 1);
      assert.equal(modelRequests.length, 1);
      assert((await page.locator(".abg-hero-left .abg-live-logo").boundingBox()).width > 250);
    }
    if (name === "desktop") {
      assert.equal(await page.getByLabel("What should we call you?").inputValue(), "Preserved Guest");
      await page.getByRole("button", { name: "Continue" }).click();
      await page.getByLabel("Choose a preferred time").selectOption("10:30");
      await page.getByRole("button", { name: "Continue" }).click();
      await page.getByRole("button", { name: "Preview request" }).click();
      assert(await page.getByRole("region", { name: "Request preview" }).isVisible());
      await page.getByRole("button", { name: "Back to edit" }).click();
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await page.getByRole("button", { name: "Back", exact: true }).click();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(removedAssetRequests, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `${output}/${name}.png` });
    results.push({ name, noOverlay: true, starSize: 36, homepageLink: true, modelRequests: modelRequests.length, javascriptErrors: errors.length });
    await context.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
