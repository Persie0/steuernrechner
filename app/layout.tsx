import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {UstProvider} from "./components/UstProvider";
import {BookkeepingProvider} from "./components/BookkeepingProvider";
import Shell from "./components/Shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Steuernrechner Österreich",
  description: "Lokale Einnahmen-Ausgaben-Rechnung und Steuerübersicht für österreichische Einzelunternehmen.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UstProvider>
          <BookkeepingProvider>
            <Shell>{children}</Shell>
          </BookkeepingProvider>
        </UstProvider>
      </body>
    </html>
  );
}
