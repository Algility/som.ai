import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Archivo, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "The official AI platform for School of Mentors — built on 160+ millionaire and billionaire interviews from School of Hard Knocks by James and Jack Dumoulin. Free and Pro plans at schoolofmentors.app.";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://schoolofmentors.app"
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default:
      "School of Mentors AI | Official App for the #1 Entrepreneurship Community",
    template: "%s | School of Mentors AI",
  },
  description: siteDescription,
  alternates: {
    canonical: "https://schoolofmentors.app",
  },
  openGraph: {
    type: "website",
    url: "https://schoolofmentors.app",
    title:
      "School of Mentors AI | Official App for the #1 Entrepreneurship Community",
    description: siteDescription,
    siteName: "School of Mentors AI",
    images: [
      {
        url: "/logo.png",
        width: 2048,
        height: 2048,
        alt: "School of Mentors AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "School of Mentors AI | Official App for the #1 Entrepreneurship Community",
    description: siteDescription,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1a1a",
};

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakarta.variable} ${archivo.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
