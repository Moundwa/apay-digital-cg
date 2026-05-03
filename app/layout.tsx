import type { Metadata } from "next";
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
  title: "Apay Digital - Codes & Abonnements Instantanés",
  description: "Netflix Premium 4K à 3 500 FCFA. Free Fire, PSN, Xbox. Codes en 5 min. Paiement Mobile Money au Congo.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Apay Digital v1.5",
    description: "Netflix, Free Fire, PSN, Xbox. Codes instantanés 7j/7",
    url: "https://apay-digital-cg.store",
    siteName: "Apay Digital",
    locale: "fr_CG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
