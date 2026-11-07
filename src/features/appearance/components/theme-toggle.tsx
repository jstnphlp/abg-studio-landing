"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  getAppearance,
  getServerAppearance,
  setAppearance,
  subscribeAppearance,
} from "../theme-store";

export function ThemeToggle() {
  const appearance = useSyncExternalStore(
    subscribeAppearance,
    getAppearance,
    getServerAppearance,
  );
  const dark = appearance === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-label="Dark mode"
      aria-checked={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="abg-theme-toggle"
      onClick={() => setAppearance(dark ? "light" : "dark")}
    >
      <Sun size={14} aria-hidden="true" />
      <span className="abg-switch-track" aria-hidden="true">
        <span className="abg-switch-thumb" />
      </span>
      <Moon size={14} aria-hidden="true" />
    </button>
  );
}
