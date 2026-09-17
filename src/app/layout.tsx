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

const themeScript = `try{var t=localStorage.getItem("pulse-theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.classList.remove("light")}}catch(e){}`;

export const metadata: Metadata = {
  title: "PULSE | EUMB ICT Equipment System",
  description: "Personnel & Unit Lifecycle System for Equipment",
  robots: { index: false, follow: false },
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
      className={`${inter.variable} ${geistMono.variable} h-full antialiased light`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans h-full bg-canvas text-paper overflow-hidden">
        {children}
      </body>
    </html>
  );
}
