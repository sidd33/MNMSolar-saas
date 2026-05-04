import { ReactNode } from "react";
import { GlobalUIProvider } from "@/components/dashboard/GlobalUIProvider";
import { DashboardNexusProvider } from "@/components/dashboard/DashboardNexusProvider";
import { DashboardClientShell } from "@/components/layout/DashboardClientShell";
import { currentUser } from "@clerk/nextjs/server";
import { getOwnerDashboardData } from "@/app/actions/dashboard";
import { getEngineeringNexus } from "@/lib/actions/engineering";
import { getExecutionNexus } from "@/lib/actions/execution";

/**
 * DASHBOARD LAYOUT: Zero-Latency Hybrid Shell
 * This layout fetches the initial operational data completely Server-Side,
 * injecting it natively into the Client Context to bypass loading skeletons.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const role = (user?.publicMetadata as any)?.role || null;
  const department = (user?.publicMetadata as any)?.department || null;

  let initialData = null;
  
  if (user) {
    if (role === 'OWNER' || role === 'SUPER_ADMIN') {
        initialData = await getOwnerDashboardData();
    } else if (department === 'ENGINEERING') {
        initialData = await getEngineeringNexus();
    } else if (department === 'EXECUTION') {
        initialData = await getExecutionNexus();
    } else {
        initialData = await getOwnerDashboardData(); // Fallback to safe structure
    }
  }

  return (
    <DashboardNexusProvider initialData={initialData} userId={user?.id || null} role={role} department={department}>
      <GlobalUIProvider userId={user?.id || null}>
        <DashboardClientShell>
          {children}
        </DashboardClientShell>
      </GlobalUIProvider>
    </DashboardNexusProvider>
  );
}
