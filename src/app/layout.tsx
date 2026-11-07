import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { appConfig } from "@/config/app";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { appearanceInitScript } from "@/features/appearance/theme-store";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full font-sans antialiased",
        "font-sans",
        inter.variable,
      )}
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          id="abg-appearance-init"
          dangerouslySetInnerHTML={{ __html: appearanceInitScript }}
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
