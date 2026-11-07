// Capture the production renderer at rest: no materials or geometry duplicated.
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  await page.addInitScript(
    (appearance) => {
      localStorage.setItem("abg-appearance", appearance);
    },
    process.env.CAPTURE_APPEARANCE === "dark" ? "dark" : "light",
  );
  await page.goto(process.env.VERIFY_URL ?? "http://localhost:3000", {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(
    () => document.querySelector(".abg-logo-canvas")?.dataset.ready === "true",
  );
  await page.addStyleTag({
    content: `html,body,.abg-site,.abg-hero,.abg-hero-left{background:transparent!important;background-image:none!important;} .abg-stars,.abg-site-noise,header,.abg-hero-right,.abg-hero-kicker,.abg-hero-lower{visibility:hidden!important;} .abg-hero-left .abg-live-logo{position:fixed!important;inset:0 auto auto 0!important;width:1200px!important;height:808px!important;min-height:0!important;margin:0!important;}`,
  });
  await page.waitForTimeout(150);
  await page.locator(".abg-logo-canvas canvas").screenshot({
    path:
      process.env.CAPTURE_OUTPUT ??
      "docs/verification/logo-refinement/fallback.png",
    omitBackground: true,
  });
} finally {
  await browser.close();
}
