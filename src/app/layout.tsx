// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: " Blog-App",
  description: "Share your stories, connect with readers, and discover amazing content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Navbar/>
          {/* Main content area that grows */}
          <main className="flex-grow">
            {children}
          </main>
          
          {/* Footer at the bottom */}
          <Footer />
        </div>
      </body>
    </html>
  );
}