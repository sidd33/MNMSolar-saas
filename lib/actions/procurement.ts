"use server";

import { prisma } from "@/lib/prisma";
import { currentUser, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { syncUserAndOrg } from "@/app/actions/sync";

/**
 * Security middleware for Procurement actions
 * Verifies authentication, role, and department
 */
async function validateProcurementAccess() {
  const { userId, orgId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const metadata = (sessionClaims as any)?.publicMetadata || {};
  let role = (metadata.role as string)?.toUpperCase();
  let department = (metadata.department as string)?.toUpperCase();
  let name = (sessionClaims as any)?.full_name || (sessionClaims as any)?.name;
  const sessionOrgId = orgId || (metadata.orgId as string);

  // HYBRID HARDENING: Fallback to DB if session claims are missing
  if (!role || !department || !name) {
    const sync = await syncUserAndOrg();
    if (sync?.user) {
      role = role || (sync.user.role as string)?.toUpperCase();
      department = department || (sync.user.department as string)?.toUpperCase();
      name = name || sync.user.name || "Employee";
    }
  }

  name = name || "Employee";

  if (role === "OWNER" || role === "SUPER_ADMIN") {
      return { user: { id: userId, name }, orgId: sessionOrgId, isProcurement: false, isOwner: true };
  }

  const allowedDepts = ["PROCUREMENT", "EXECUTION"]; // Execution might still view some parts? But primarily PROCUREMENT
  const currentDept = department?.toUpperCase() || "";

  if (role !== "EMPLOYEE" || (!allowedDepts.includes(currentDept) && currentDept !== "PROCUREMENT")) {
    throw new Error(`Access Denied: Procurement Access Required (Found: ${currentDept || 'None'})`);
  }

  return { user: { id: userId, name }, orgId: sessionOrgId, isProcurement: true, isOwner: false };
}

export async function getProcurementQueue() {
  const { orgId } = await validateProcurementAccess();
  if (!orgId) return [];

  return await prisma.project.findMany({
      where: {
          organizationId: orgId,
          stage: {
              in: ['HANDOVER_TO_EXECUTION', 'MATERIAL_PROCUREMENT', 'STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION', 'NET_METERING']
          }
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
      select: {
          id: true,
          name: true,
          stage: true,
          executionStage: true,
          updatedAt: true,
          clientName: true,
          executionMetadata: true,
          claimedByUserId: true,
          claimedAt: true,
          claimedBy: { select: { id: true, name: true, email: true } }
      }
  });
}

export async function getProcurementDashboardStats(providedOrgId?: string) {
    const orgId = providedOrgId || (await validateProcurementAccess()).orgId;
    if (!orgId) return { bomReview: 0, poPending: 0, materialInTransit: 0, delivered: 0 };

    const [bomReview, materialInTransit, poPendingCount] = await Promise.all([
        prisma.project.count({ where: { organizationId: orgId, stage: 'HANDOVER_TO_EXECUTION' } }),
        prisma.project.count({ where: { organizationId: orgId, stage: 'MATERIAL_PROCUREMENT' } }),
        prisma.purchaseOrder ? prisma.purchaseOrder.count({ where: { organizationId: orgId, status: 'PENDING' } }) : Promise.resolve(0)
    ]);

    return {
        bomReview: bomReview,
        poPending: poPendingCount, 
        materialInTransit: materialInTransit,
        delivered: Math.floor(materialInTransit / 2) // Keep mock for now
    };
}

export async function getProcurementNexus() {
    const { orgId } = await validateProcurementAccess();
    if (!orgId) return { stats: { bomReview: 0, poPending: 0, materialInTransit: 0, delivered: 0 }, projects: [] };

    const [stats, projects] = await Promise.all([
        getProcurementDashboardStats(orgId),
        getProcurementQueue()
    ]);

    return { stats, projects };
}

export async function getProcurementProjectDetail(projectId: string) {
    const { orgId } = await validateProcurementAccess();
    if (!orgId) return null;

    return await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId },
        select: {
            id: true,
            name: true,
            stage: true,
            currentDepartment: true,
            sanctionedLoad: true,
            updatedAt: true,
            clientName: true,
            projectFiles: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });
}

export async function logChallanReceipt(projectId: string, challanData: { expectedDeliveryDate?: string, challanNumber?: string, items?: any[] }) {
    const { orgId, user } = await validateProcurementAccess();
    if (!orgId) throw new Error("Unauthorized");

    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId },
        select: { executionMetadata: true }
    });

    const currentMetadata = (project?.executionMetadata as any) || {};
    
    const updatedMetadata = {
        ...currentMetadata,
        logistics: {
            ...(currentMetadata.logistics || {}),
            ...challanData,
            status: 'DISPATCHED', // Procurement dispatches it
            dispatchedBy: user.name,
            dispatchedAt: new Date().toISOString()
        }
    };

    const result = await prisma.project.update({
        where: { id: projectId, organizationId: orgId },
        data: { executionMetadata: updatedMetadata },
    });

    revalidatePath(`/dashboard/procurement`);
    return result;
}

export async function createPurchaseOrder(projectId: string, vendorName: string, orderType: string, amount: number, items: any[]) {
    const { orgId } = await validateProcurementAccess();
    if (!orgId) throw new Error("Unauthorized");

    const po = await prisma.purchaseOrder.create({
        data: {
            projectId,
            vendorName,
            orderType,
            amount,
            items,
            organizationId: orgId
        }
    });
    revalidatePath(`/dashboard/procurement`);
    return po;
}

export async function createMaterialReleaseNote(projectId: string, mrnNumber: string, items: any[], vehicleNumber?: string, driverName?: string) {
    const { orgId, user } = await validateProcurementAccess();
    if (!orgId) throw new Error("Unauthorized");

    const mrn = await prisma.materialReleaseNote.create({
        data: {
            projectId,
            mrnNumber,
            items,
            vehicleNumber,
            driverName,
            dispatchedBy: user.id,
            organizationId: orgId
        }
    });
    revalidatePath(`/dashboard/procurement`);
    return mrn;
}

export async function logChallan(projectId: string, challanNumber: string, type: 'INWARD' | 'RETURN', items: any[]) {
    const { orgId, user } = await validateProcurementAccess();
    if (!orgId) throw new Error("Unauthorized");

    const challan = await prisma.challan.create({
        data: {
            projectId,
            challanNumber,
            type,
            items,
            loggedByUserId: user.id,
            organizationId: orgId
        }
    });
    revalidatePath(`/dashboard/procurement`);
    return challan;
}

export async function getPurchaseOrders(projectId?: string) {
    const { orgId } = await validateProcurementAccess();
    if (!orgId) return [];

    return await prisma.purchaseOrder.findMany({
        where: {
            organizationId: orgId,
            ...(projectId ? { projectId } : {})
        },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    });
}
