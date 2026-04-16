import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Montserrat, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { OrganizationSync } from "@/components/auth/OrganizationSync";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MNMSOLAR | Task Manager",
  description: "Internal task management platform for MNMSOLAR employees.",
};

/**
 * ROOT LAYOUT: The Absolute Foundation
 * In Next.js 15, ClerkProvider must wrap the entire tree (including HTML/Body)
 * to prevent 'useUser' context errors during SSR and Streaming.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}
        >
          <Toaster position="top-right" expand={false} richColors />
          <Suspense fallback={null}>
            <OrganizationSync />
          </Suspense>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
