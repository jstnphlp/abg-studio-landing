import { z } from "zod";

const appearanceSchema = z.enum(["light", "dark"]);
export type Appearance = z.infer<typeof appearanceSchema>;
export const APPEARANCE_KEY = "abg-appearance";
const CHANGE_EVENT = "abg-appearance-change";

/** Runs before body paint; only portfolio CSS responds to this namespaced flag. */
export const appearanceInitScript = `(()=>{let t="light";try{if(localStorage.getItem("${APPEARANCE_KEY}")==="dark")t="dark"}catch{}document.documentElement.dataset.abgTheme=t})()`;

export function getAppearance(): Appearance {
  return (
    appearanceSchema.safeParse(document.documentElement.dataset.abgTheme)
      .data ?? "light"
  );
}
export function getServerAppearance(): Appearance {
  return "light";
}

export function setAppearance(appearance: Appearance): void {
  const value = appearanceSchema.parse(appearance);
  document.documentElement.dataset.abgTheme = value;
  try {
    localStorage.setItem(APPEARANCE_KEY, value);
  } catch {
    /* The switch still works without storage. */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeAppearance(listener: () => void): () => void {
  function storageChanged(event: StorageEvent) {
    if (event.key !== APPEARANCE_KEY && event.key !== null) return;
    document.documentElement.dataset.abgTheme =
      appearanceSchema.safeParse(event.newValue).data ?? "light";
    listener();
  }
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", storageChanged);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", storageChanged);
  };
}
