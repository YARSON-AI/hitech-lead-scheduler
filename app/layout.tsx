import type { Metadata } from "next";
import { Fredoka, Heebo, Rubik } from "next/font/google";
import { bookingSystem } from "@/lib/env/mode";
import "./globals.css";
import "./hti.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

const rubik = Rubik({
  variable: "--f-rubik",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--f-fredoka",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "תיאום פגישות - הייטק סוכנות לביטוח",
  description: "מערכת תיאום פגישות עם סוכני ביטוח",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const engine = bookingSystem() === "engine";
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} ${rubik.variable} ${fredoka.variable} antialiased ${engine ? "hti" : ""}`}>{children}</body>
    </html>
  );
}
