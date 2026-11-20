import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DZone — Everyday tech, made better",
    template: "%s | DZone",
  },
  description: "Discover everyday tech, electronics and accessories at DZone Sri Lanka.",
  applicationName: "DZone",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
