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
        {/* Skip link — visually hidden until focused. Lets keyboard
            users bypass the dashboard sidebar's 7+ nav links. Targets
            the <main id='main'> in the dashboard / auth layouts. */}
        <a
          href='#main'
          className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring'
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
