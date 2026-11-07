import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const output = "docs/verification/black-chrome";
const hashes = JSON.parse(
  await readFile(`${output}/protected-hashes.json`, "utf8"),
);
for (const [file, hash] of Object.entries(hashes))
  assert.equal(
    createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
    hash,
    file,
  );
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const mode of [
    "desktop",
    "mobile",
    "reduced-motion",
    "webgl-unavailable",
    "model-failure",
  ]) {
    const context = await browser.newContext({
      viewport:
        mode === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
      ...(mode === "mobile" ? { isMobile: true, hasTouch: true } : {}),
      ...(mode === "reduced-motion" ? { reducedMotion: "reduce" } : {}),
    });
    await context.addInitScript(
      ({ noWebGL }) => {
        window.__chromeDraws = 0;
        const original = HTMLCanvasElement.prototype.getContext;
        const contexts = new WeakSet();
        HTMLCanvasElement.prototype.getContext = function (...args) {
          if (noWebGL && String(args[0]).includes("webgl")) return null;
          const value = original.apply(this, args);
          if (
            value &&
            String(args[0]).includes("webgl") &&
            !contexts.has(value)
          ) {
            contexts.add(value);
            const draw = value.drawElements;
            value.drawElements = function (...params) {
              window.__chromeDraws++;
              return draw.apply(this, params);
            };
          }
          return value;
        };
      },
      { noWebGL: mode === "webgl-unavailable" },
    );
    const page = await context.newPage();
    const errors = [],
      modelRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.url().endsWith("/brand/abg-logo.glb"))
        modelRequests.push(request.url());
    });
    if (mode === "model-failure")
      await page.route("**/brand/abg-logo.glb", (route) =>
        route.abort("failed"),
      );
    await page.goto(process.env.VERIFY_URL ?? "http://localhost:3000", {
      waitUntil: "networkidle",
    });
    const failure = mode === "webgl-unavailable" || mode === "model-failure";
    if (failure) {
      await page.getByText("Static logo preview", { exact: true }).waitFor();
      assert(await page.locator(".abg-logo-fallback").isVisible());
      await page
        .locator(".abg-logo-fallback")
        .evaluate((image) => image.decode());
    } else {
      await page.waitForFunction(
        () =>
          document.querySelector(".abg-logo-canvas")?.dataset.ready === "true",
      );
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(150);
      assert.equal(await page.locator(".abg-logo-fallback").isVisible(), false);
      assert.equal(modelRequests.length, 1);
      await page.waitForTimeout(100);
      const before = await page.evaluate(() => window.__chromeDraws);
      await page.waitForTimeout(250);
      const after = await page.evaluate(() => window.__chromeDraws);
      if (mode === "reduced-motion")
        assert.equal(after, before, "Reduced motion stops moving reflections");
      else assert(after > before, "Studio reflections move slowly");
      if (mode === "desktop") {
        await page.locator("#about").scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
        const paused = await page.evaluate(() => window.__chromeDraws);
        await page.waitForTimeout(250);
        assert.equal(
          await page.evaluate(() => window.__chromeDraws),
          paused,
          "Offscreen renderer pauses",
        );
      }
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `${output}/${mode}.png` });
    if (mode === "mobile")
      await page
        .locator(".abg-hero-left")
        .screenshot({ path: `${output}/mobile-logo.png` });
    assert.equal(await page.locator(".abg-splash").count(), 0);
    assert.equal(await page.locator("header .abg-navbar-star svg").count(), 1);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page
      .locator(".abg-calendar-grid button:not([disabled])")
      .first()
      .click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page
      .getByLabel("What should we call you?")
      .fill("Black Chrome Guest");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Choose a preferred time").selectOption("10:30");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Preview request" }).click();
    assert(
      await page
        .getByRole("region", { name: "Request preview" })
        .getByText("Black Chrome Guest")
        .isVisible(),
    );
    assert.deepEqual(errors, []);
    results.push({
      mode,
      originalAssetsUnchanged: true,
      fallbackWorks: failure,
      bookingWorks: true,
      javascriptErrors: 0,
      noOverflow: true,
    });
    await context.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
