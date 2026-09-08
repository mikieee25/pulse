import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PULSE | EUMB ICT Equipment System",
  description: "Personnel & Unit Lifecycle System for Equipment",
  icons: {
    icon: "/pulseicon.svg",
    apple: "/pulseicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="font-sans h-full bg-canvas text-paper overflow-hidden">
        {children}
      </body>
    </html>
  );
}
