import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LK Ledger Book", template: "%s · LK Ledger Book" },
  description: "Secure business finance, supplier ledger, and daily cash accountability.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#123f2d" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<Toaster richColors position="top-right" /></body></html>;
}
