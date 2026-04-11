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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}
      >
        <ClerkProvider>
          <Toaster position="top-right" expand={false} richColors />
          <Suspense fallback={null}>
            <OrganizationSync />
          </Suspense>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

