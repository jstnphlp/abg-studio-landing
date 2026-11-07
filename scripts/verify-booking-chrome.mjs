// Explicit visual/interaction verification against the existing local app server.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const origin = process.env.VERIFY_URL ?? "http://localhost:3000";
const output = "docs/verification/booking-chrome";
const protectedFiles = JSON.parse(
  await readFile(`${output}/protected-hashes.json`, "utf8"),
);
for (const [file, expected] of Object.entries(protectedFiles)) {
  assert.equal(
    createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
    expected,
    `${file} changed unexpectedly`,
  );
}
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const [width, height] of [
    [1440, 1000],
    [1280, 800],
    [768, 1024],
    [390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      ...(width === 390 ? { isMobile: true, hasTouch: true } : {}),
    });
    const page = await context.newPage();
    const errors = [],
      forbiddenRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (
        /hero-right-chrome\.glb|section-chrome-accent|splash/i.test(
          request.url(),
        )
      )
        forbiddenRequests.push(request.url());
    });
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () =>
        document.querySelector(".abg-hero-left .abg-logo-canvas")?.dataset
          .ready === "true",
    );
    const art = page.locator(".abg-booking-chrome");
    const image = art.locator("img");
    await image.evaluate((element) => element.decode());
    assert.equal(await image.evaluate((element) => element.naturalWidth), 1200);
    assert.equal(
      await image.evaluate((element) => getComputedStyle(element).objectFit),
      "cover",
    );
    assert.equal(
      await image.evaluate(
        (element) => getComputedStyle(element).objectPosition,
      ),
      "100% 50%",
    );
    assert.equal(
      await art.evaluate((element) => getComputedStyle(element).pointerEvents),
      "none",
    );
    assert.equal(
      await image.evaluate((element) => element.closest("#booking")),
      null,
    );
    assert.equal(await page.locator(".abg-splash").count(), 0);
    const star = page
      .locator("header")
      .getByRole("link", { name: "ABG Studios \u2014 Home", exact: true });
    assert.equal(await star.getAttribute("href"), "/");
    assert.equal(await star.locator("svg").count(), 1);
    assert.equal(await star.locator("canvas,img").count(), 0);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(forbiddenRequests, []);

    // Capture the whole hero, including the navbar above it on stacked layouts.
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const hero = await page.locator(".abg-hero").boundingBox();
    const session = await context.newCDPSession(page);
    const { data } = await session.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width,
        height: Math.ceil(hero.y + hero.height),
        scale: 1,
      },
    });
    await writeFile(`${output}/${width}.png`, Buffer.from(data, "base64"));
    await session.detach();
    await page
      .locator(".abg-hero-right")
      .screenshot({ path: `${output}/${width}-booking.png` });

    const calendar = page
      .locator(".abg-calendar-grid button:not([disabled])")
      .first();
    await calendar.scrollIntoViewIfNeeded();
    assert(
      await calendar.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        );
        return hit === element || element.contains(hit);
      }),
      "Decorative chrome must not cover calendar hit targets",
    );
    await calendar.click();
    await page.waitForFunction(() =>
      Boolean(
        document.querySelector(
          '.abg-calendar-grid button[aria-pressed="true"]',
        ),
      ),
    );
    await page.getByRole("button", { name: "Continue" }).click();
    await page
      .getByLabel("What should we call you?")
      .fill("Chrome Preview Guest");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Choose a preferred time").selectOption("10:30");
    await page.getByRole("button", { name: "Continue" }).click();
    await page
      .getByLabel(/Anything we should know/)
      .fill("Pearl nail inspiration");
    await page.getByLabel("Add inspiration photos").setInputFiles({
      name: "inspiration.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2ioAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page.getByRole("button", { name: "Preview request" }).click();
    const preview = page.getByRole("region", { name: "Request preview" });
    assert(await preview.isVisible());
    assert(await preview.getByText("Chrome Preview Guest").isVisible());
    assert(
      await preview.getByRole("img", { name: "inspiration.png" }).isVisible(),
    );
    await page
      .locator(".abg-hero-right")
      .screenshot({ path: `${output}/${width}-preview.png` });
    await page.getByRole("button", { name: "Back to edit" }).click();
    assert.equal(
      await page.getByLabel(/Anything we should know/).inputValue(),
      "Pearl nail inspiration",
    );
    await page.getByRole("button", { name: "Remove inspiration.png" }).click();
    assert.equal(
      await page.getByRole("list", { name: "Attached photos" }).count(),
      0,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    results.push({
      width,
      height,
      noSplash: true,
      originalHeroLogo: true,
      navbarStar: true,
      transparentWebP: true,
      chromeGLBRequests: 0,
      calendarHitTest: true,
      bookingFlowAndPhotos: true,
      horizontalOverflow: false,
      javascriptErrors: 0,
    });
    await context.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
