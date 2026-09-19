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

const metadataBase = (() => {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
})();

const description =
  "PULSE is the EUMB ICT Personnel & Unit Lifecycle System for secure equipment, personnel, and lifecycle management.";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "PULSE | EUMB ICT Equipment System",
    template: "%s | PULSE",
  },
  description,
  applicationName: "PULSE",
  referrer: "strict-origin-when-cross-origin",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "PULSE",
    title: "PULSE | EUMB ICT Equipment System",
    description,
  },
  twitter: {
    card: "summary",
    title: "PULSE | EUMB ICT Equipment System",
    description,
  },
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
