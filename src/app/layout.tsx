import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blog Admin — MWX",
  description: "Panel de administración de blogs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>{children}</body>
    </html>
  );
}
