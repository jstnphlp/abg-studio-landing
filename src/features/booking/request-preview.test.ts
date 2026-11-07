import { describe, expect, it } from "vitest";
import { photoSchema, previewSchema } from "./request-preview";

describe("booking preview", () => {
  const request = {
    date: "2026-11-10",
    name: " Alex ",
    time: "10:30",
    note: "French tips",
  };
  it("validates the date-first request and trims the name", () => {
    expect(previewSchema("2026-11-07").parse(request).name).toBe("Alex");
    expect(previewSchema("2026-11-11").safeParse(request).success).toBe(false);
    expect(
      previewSchema("2026-11-07").safeParse({ ...request, date: "2026-02-30" })
        .success,
    ).toBe(false);
    expect(
      previewSchema("2026-11-07").safeParse({ ...request, time: "25:00" })
        .success,
    ).toBe(false);
  });
  it("accepts photos and rejects excessive, oversized, or unsupported files", () => {
    const photo = new File(["demo"], "nails.jpg", { type: "image/jpeg" });
    expect(photoSchema.safeParse([photo]).success).toBe(true);
    expect(photoSchema.safeParse(Array(5).fill(photo)).success).toBe(false);
    expect(
      photoSchema.safeParse([
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", {
          type: "image/png",
        }),
      ]).success,
    ).toBe(false);
    expect(
      photoSchema.safeParse([
        new File(["<svg/>"], "image.svg", { type: "image/svg+xml" }),
      ]).success,
    ).toBe(false);
  });
});
