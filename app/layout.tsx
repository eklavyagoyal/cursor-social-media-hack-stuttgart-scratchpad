import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * Same two faces, same files as legacy-web: Archivo carries everything and
 * JetBrains Mono carries the labels. Self-hosted rather than fetched from Google
 * — it matches the rest of the fleet, and a build here never depends on a font
 * CDN being reachable.
 */
const archivo = localFont({
  src: [
    { path: "../public/fonts/archivo-400.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/archivo-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/archivo-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
});

const jbmono = localFont({
  src: [
    { path: "../public/fonts/jetbrains-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/jetbrains-mono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vorgabe → Dreh → Post",
  description:
    "Ein Link, ein Thema, 30 Sekunden Handyvideo — fertig geschnittener Reel mit Untertiteln.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      className={`${archivo.variable} ${jbmono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
