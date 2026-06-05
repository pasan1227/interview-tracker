import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Mono is used only on the marketing landing (`/`) and on a couple of
// product-preview eyebrows. preload:false keeps the .woff2 off the
// critical path for dashboard navigations; the browser still fetches it
// the moment something on the page reads `var(--font-geist-mono)`.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "InterviewPro — A quieter way to hire.",
  description: "An interview operations system for teams who treat hiring as craft.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
