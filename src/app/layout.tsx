import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import AppProviders from "@/components/AppProviders";
import AppShell from "@/components/AppShell";
import "./globals.scss";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lịch sinh hoạt",
  description: "Nhắc nhở lịch sinh hoạt cá nhân hàng ngày",
  applicationName: "Lịch sinh hoạt",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Sinh hoạt",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
