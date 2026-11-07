import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";
import {
  APPEARANCE_KEY,
  appearanceInitScript,
  getAppearance,
} from "../theme-store";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.abgTheme = "light";
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.abgTheme;
});

it("toggles an accessible switch and remembers the choice", () => {
  render(<ThemeToggle />);
  const toggle = screen.getByRole("switch", { name: "Dark mode" });
  expect(toggle).toHaveAttribute("aria-checked", "false");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-checked", "true");
  expect(getAppearance()).toBe("dark");
  expect(localStorage.getItem(APPEARANCE_KEY)).toBe("dark");
  fireEvent.click(toggle);
  expect(getAppearance()).toBe("light");
  expect(localStorage.getItem(APPEARANCE_KEY)).toBe("light");
});

it("handles another tab changing or clearing the stored theme", () => {
  render(<ThemeToggle />);
  fireEvent(
    window,
    new StorageEvent("storage", { key: APPEARANCE_KEY, newValue: "dark" }),
  );
  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  fireEvent(
    window,
    new StorageEvent("storage", { key: "unrelated", newValue: "light" }),
  );
  expect(getAppearance()).toBe("dark");
  fireEvent(window, new StorageEvent("storage", { key: null, newValue: null }));
  expect(getAppearance()).toBe("light");
});

it("still switches when browser storage is unavailable", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage blocked");
  });
  render(<ThemeToggle />);
  fireEvent.click(screen.getByRole("switch"));
  expect(getAppearance()).toBe("dark");
});

it("initializes only supported saved choices before rendering", () => {
  localStorage.setItem(APPEARANCE_KEY, "dark");
  new Function(appearanceInitScript)();
  expect(getAppearance()).toBe("dark");
  localStorage.setItem(APPEARANCE_KEY, "invalid-value");
  new Function(appearanceInitScript)();
  expect(getAppearance()).toBe("light");
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Storage blocked");
  });
  expect(() => new Function(appearanceInitScript)()).not.toThrow();
  expect(getAppearance()).toBe("light");
});
