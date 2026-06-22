import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { UnreadProvider } from "@/contexts/UnreadContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import Fab from "@/components/ui/Fab";
import ToastProvider from "@/components/ui/ToastProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nidora — Find Verified Homes Directly",
  description:
    "Nidora is a modern rental marketplace for flats, family rentals, bachelor pads, sublets, and rooms in Bangladesh, India, and Pakistan. Browse verified listings and connect directly with owners.",
  keywords: [
    "rental",
    "flat",
    "room",
    "sublet",
    "bachelor",
    "family",
    "rent",
    "Bangladesh",
    "India",
    "Pakistan",
    "Dhaka",
    "verified",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-surface-900">
        <AuthProvider>
          <UnreadProvider>
          <ToastProvider />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <BottomNav />
            <Fab />
          </div>
          </UnreadProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
