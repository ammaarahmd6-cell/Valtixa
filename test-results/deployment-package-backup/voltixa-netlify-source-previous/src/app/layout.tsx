import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Voltixa — Powering Your Digital Lifestyle",
    template: "%s | Voltixa",
  },
  description:
    "Authentic electronics, official warranty and nationwide delivery across Pakistan.",
  keywords: [
    "electronics Pakistan",
    "mobiles",
    "laptops",
    "smart watches",
    "Voltixa",
  ],
  openGraph: {
    title: "Voltixa",
    description: "Powering Your Digital Lifestyle",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={geist.variable}>
      <body className="min-h-screen bg-surface font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
