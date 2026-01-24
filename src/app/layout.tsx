import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phantom Tracker",
  description:
    "Track phantom pain patterns and discover correlations with weather, lunar cycles, and environmental factors",
  keywords: [
    "phantom pain",
    "pain tracker",
    "weather correlation",
    "amputee",
    "pain management",
  ],
  authors: [{ name: "Phantom Tracker" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Phantom Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className='dark'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position='top-center' richColors closeButton />
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
