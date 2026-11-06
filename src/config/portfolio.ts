/**
 * ABG Studios public-facing visual template.
 *
 * This file contains DEMO copy and categories, not verified studio services,
 * prices, inventory, contact details, or appointment availability.
 *
 * The public hero uses a dependency-free WebGL renderer with an SVG fallback.
 * See public/brand/chrome-logo.js and public/brand/abg-logo-fallback.svg.
 */
export const portfolio = {
  studioName: "ABG Studios",
  location: "Manila, Philippines",
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
