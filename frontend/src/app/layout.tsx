import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

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
    <html lang="en" className="h-full">
      <body className="bg-[#18181A] text-white h-full flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          <Sidebar />
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
