import { getInventoryItems, getAllocations } from "@/lib/actions/inventory";
import { getReturnHistory } from "@/lib/actions/returns";
import { InventoryTable } from "@/components/workspace/InventoryTable";
import { ReturnsTable } from "@/components/workspace/ReturnsTable";
import { AllocationsTable } from "@/components/workspace/AllocationsTable";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const authObj = await auth(); 
  
  if (!authObj.userId) redirect("/login");
  
  const organizationId = authObj.orgId || "default_org";

  const { data: initialItems } = await getInventoryItems(organizationId);
  const { data: returns } = await getReturnHistory(organizationId);
  const { data: allocations } = await getAllocations(organizationId);

  // Fetch active projects for allocation dropdown
  const activeProjects = await prisma.project.findMany({
    where: { 
      organizationId, 
      stage: { not: "FINAL_HANDOVER" } 
    },
    select: { id: true, name: true, clientName: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <DashboardShell 
      title="INVENTORY HUB"
      subtitle="Manage materials, modules, and track stock counts."
    >
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 lg:p-8">
        <Tabs defaultValue="inventory" className="w-full">
          <div className="flex justify-between items-center mb-6 overflow-x-auto pb-2">
            <TabsList className="bg-slate-100/50 p-1 min-w-max">
              <TabsTrigger value="inventory" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Stock Inventory</TabsTrigger>
              <TabsTrigger value="allocations" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Project Allocations</TabsTrigger>
              <TabsTrigger value="returns" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Material Returns</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inventory" className="mt-0 outline-none">
            <InventoryTable initialItems={initialItems || []} organizationId={organizationId} activeProjects={activeProjects} />
          </TabsContent>

          <TabsContent value="allocations" className="mt-0 outline-none">
            <AllocationsTable allocations={allocations || []} />
          </TabsContent>

          <TabsContent value="returns" className="mt-0 outline-none">
            <ReturnsTable 
              returns={returns || []} 
              inventoryItems={initialItems || []} 
              activeProjects={activeProjects} 
              organizationId={organizationId}
              userId={authObj.userId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
