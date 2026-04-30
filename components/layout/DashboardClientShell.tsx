"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
// Dynamically import Sidebar and Header with SSR disabled to prevent Clerk context errors during SSR
const Sidebar = dynamic(() => import("./Sidebar").then(mod => mod.Sidebar), { ssr: false });
const Header = dynamic(() => import("./Header").then(mod => mod.Header), { ssr: false });

export function DashboardClientShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative transition-all duration-300">
        <Header />
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
