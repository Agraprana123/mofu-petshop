import type { Metadata } from "next";
import { Nunito_Sans, Rubik } from "next/font/google";
import "./globals.css";

const bodyFont = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

const displayFont = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MOFU Petshop & Care",
  description: "Sistem kasir dan manajemen stok MOFU Petshop & Care",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
