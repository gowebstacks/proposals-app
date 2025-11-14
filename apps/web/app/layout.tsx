import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  },
  twitter: {
    card: "summary",
    title: "Login – Webstacks",
    description: "Sign in to your Webstacks account.",
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
      </body>
    </html>
  );
}
