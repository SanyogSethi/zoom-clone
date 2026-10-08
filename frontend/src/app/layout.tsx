import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "zoom-clone-scalerAI-assessment",
  description: "Zoom Clone ScalerAI SDE Assessment by sanyog-sethi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1C1C1C] text-zoom-text-primary min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
