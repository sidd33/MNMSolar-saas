import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getSidebarStats } from "@/app/actions/dashboard";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const stats = await getSidebarStats();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar stats={stats || {}} />
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative transition-all duration-300">
        <Header />
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

