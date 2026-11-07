import { z } from "zod";

export const preferredTimes = [
  "09:00",
  "10:30",
  "12:00",
  "13:30",
  "15:00",
  "16:30",
] as const;
export const photoSchema = z
  .array(
    z
      .file()
      .max(5 * 1024 * 1024, "Each photo must be 5 MB or smaller.")
      .mime(
        ["image/jpeg", "image/png", "image/webp"],
        "Choose JPG, PNG, or WebP photos.",
      ),
  )
  .max(4, "You can attach up to 4 photos.");

export function previewSchema(minimumDate: string) {
  return z.object({
    date: z.iso
      .date()
      .refine((date) => date >= minimumDate, "Choose today or a future date."),
    name: z.string().trim().min(2, "Please enter your name.").max(80),
    time: z.enum(preferredTimes, { error: "Choose a preferred time." }),
    note: z.string().trim().max(400),
  });
}
