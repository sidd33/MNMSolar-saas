import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OwnerDashboardContent } from "@/components/dashboard/OwnerDashboardContent";
import { ProjectIntakeDialog } from "@/components/dashboard/ProjectIntakeDialog";

/**
 * OWNER DASHBOARD: SaaS Command Center
 * This page uses the 'Universal Nexus Pattern'. 
 * Initial data loading and background sync are handled by the OwnerNexusProvider
 * at the layout level, ensuring zero-latency navigation and state-of-the-art UI.
 */
export default function OwnerDashboard() {
  return (
    <DashboardShell 
      title="SaaS Command Center" 
      subtitle="Operational intelligence and pipeline oversight for MNMSOLAR."
      headerActions={<ProjectIntakeDialog />}
    >
      <OwnerDashboardContent />
    </DashboardShell>
  );
}
