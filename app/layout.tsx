import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Apay Digital - Codes & Abonnements Instantanés",
  description: "Netflix Premium 4K à 3 500 FCFA. Free Fire, PSN, Xbox. Codes en 5 min. Paiement Mobile Money au Congo.",
  icons: {
    icon: "/favicon.png",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
