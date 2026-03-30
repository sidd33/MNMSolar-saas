import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Montserrat, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OrganizationSync } from "@/components/auth/OrganizationSync";
import { getSidebarStats } from "@/app/actions/dashboard";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stats = await getSidebarStats();

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}
        >
          <Toaster position="top-right" expand={false} richColors />
          <OrganizationSync />
          <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            <Sidebar stats={stats || {}} />
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative transition-all duration-300">
              <Header />
              <div className="p-6 lg:p-8">
                {children}
              </div>
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

