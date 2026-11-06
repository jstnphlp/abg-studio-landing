/**
 * ABG Studios public-facing visual template.
 *
 * This file contains DEMO copy and categories, not verified studio services,
 * prices, inventory, contact details, or appointment availability.
 *
 * Once Blender exports are ready, place the assets under /public/brand/ and
 * point chromeLogoVideo and chromeLogoPoster to their public URL paths.
 */
export const portfolio = {
  studioName: "ABG Studios",
  location: "Manila, Philippines",
  chromeLogoVideo: null as string | null,
  chromeLogoPoster: null as string | null,
  services: [
    {
      number: "01",
      title: "Nail artistry",
      description: "An expressive canvas for the smallest details.",
      note: "SERVICE PLACEHOLDER",
    },
    {
      number: "02",
      title: "Sculpted sets",
      description: "Shape, dimension, and a considered finish.",
      note: "SERVICE PLACEHOLDER",
    },
    {
      number: "03",
      title: "The finishing touch",
      description: "Beautifully simple, deliberately polished.",
      note: "SERVICE PLACEHOLDER",
    },
  ],
  projects: [
    { number: "01", title: "Liquid study", category: "Chrome / Editorial", art: "liquid" },
    { number: "02", title: "Soft structure", category: "Form / Texture", art: "soft" },
    { number: "03", title: "After hours", category: "Light / Contrast", art: "night" },
  ],
} as const;
