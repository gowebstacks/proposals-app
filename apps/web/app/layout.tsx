import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SegmentScript from "@/lib/analytics/SegmentScript";
import PostHogScript from "@/lib/analytics/PostHogScript";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Login – Webstacks",
  description: "Sign in to your Webstacks account.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Login – Webstacks",
    description: "Sign in to your Webstacks account.",
    type: "website",
    siteName: "Webstacks",
    images: [
      {
        url: "/login-opengraph.png",
        width: 1200,
        height: 630,
        alt: "Webstacks Login",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login – Webstacks",
    description: "Sign in to your Webstacks account.",
    images: ["/login-opengraph.png"],
  },
  other: {
    "theme-color": "#FFFFFF",
    "color-scheme": "light",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <SegmentScript />
        <PostHogScript />
      </body>
    </html>
  );
}
