"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { syncUserAndOrg } from "@/app/actions/sync";
import { PipelineStage } from "@prisma/client";

/**
 * Security middleware for Accounts actions
 * Verifies authentication, role (EMPLOYEE), and department (ACCOUNTS)
 */
async function validateAccountsAccess() {
  const { userId, orgId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const metadata = (sessionClaims as any)?.publicMetadata || {};
  let role = (metadata.role as string)?.toUpperCase();
  let department = (metadata.department as string)?.toUpperCase();
  let name = (sessionClaims as any)?.full_name || (sessionClaims as any)?.name;
  const sessionOrgId = orgId || (metadata.orgId as string);

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
      return { user: { id: userId, name }, orgId: sessionOrgId, isAccounts: false, isOwner: true };
  }

  if (role !== "EMPLOYEE" || department !== "ACCOUNTS") {
    throw new Error(`Access Denied: Accounts Department Only (Found: ${department || 'None'})`);
  }

  return { user: { id: userId, name }, orgId: sessionOrgId, isAccounts: true, isOwner: false };
}

export async function getAccountsDashboardStats() {
    const { orgId } = await validateAccountsAccess();
    if (!orgId) return { totalRevenue: 0, collectedRevenue: 0, pendingAdvances: 0 };

    const activeQuotes = await prisma.quote.findMany({
        where: {
            organizationId: orgId,
            status: { in: ['SENT', 'APPROVED', 'CONVERTED'] }
        }
    });

    let totalRevenue = 0;
    activeQuotes.forEach(q => {
        totalRevenue += (q.quotedValue || 0);
    });

    const projects = await prisma.project.findMany({
        where: { organizationId: orgId },
        select: { amountCollected: true }
    });

    let collectedRevenue = 0;
    projects.forEach(p => {
        collectedRevenue += (p.amountCollected || 0);
    });

    const pendingAdvances = await prisma.project.count({
        where: {
            organizationId: orgId,
            paymentStatusAdvance: false,
            stage: { in: ['SITE_SURVEY', 'DETAILED_ENGG', 'WORK_ORDER'] }
        }
    });

    return {
        totalRevenue,
        collectedRevenue,
        pendingAdvances
    };
}

export async function getPendingAdvancesQueue() {
    const { orgId } = await validateAccountsAccess();
    if (!orgId) return [];

    return await prisma.project.findMany({
        where: {
            organizationId: orgId,
            paymentStatusAdvance: false,
            stage: { in: ['SITE_SURVEY', 'DETAILED_ENGG', 'WORK_ORDER'] }
        },
        include: {
            lead: { select: { name: true, estimatedValue: true } },
            claimedBy: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });
}

export async function getMaterialClearanceQueue() {
    const { orgId } = await validateAccountsAccess();
    if (!orgId) return [];

    return await prisma.project.findMany({
        where: {
            organizationId: orgId,
            paymentStatusMaterial: false,
            stage: { in: ['HANDOVER_TO_EXECUTION', 'MATERIAL_PROCUREMENT'] }
        },
        include: {
            claimedBy: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });
}

export async function getFinalSettlementQueue() {
    const { orgId } = await validateAccountsAccess();
    if (!orgId) return [];

    return await prisma.project.findMany({
        where: {
            organizationId: orgId,
            paymentStatusFinal: false,
            stage: { in: ['AC_DC_INSTALLATION', 'NET_METERING', 'FINAL_HANDOVER'] }
        },
        include: {
            claimedBy: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });
}

export async function verifyPaymentAction(projectId: string, milestone: 'ADVANCE' | 'MATERIAL' | 'FINAL', amount: number, note: string) {
    const { user, orgId } = await validateAccountsAccess();
    if (!orgId) throw new Error("No organization context found");

    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId }
    });

    if (!project) throw new Error("Project not found");

    const dataToUpdate: any = {};
    if (milestone === 'ADVANCE') dataToUpdate.paymentStatusAdvance = true;
    if (milestone === 'MATERIAL') dataToUpdate.paymentStatusMaterial = true;
    if (milestone === 'FINAL') dataToUpdate.paymentStatusFinal = true;

    if (amount > 0) {
        dataToUpdate.amountCollected = { increment: amount };
    }

    if (note) {
        const existingNote = project.accountsNote || "";
        const timestamp = new Date().toLocaleString();
        dataToUpdate.accountsNote = existingNote + `\n[${timestamp} - ${user.name}] ${milestone} Verification: ${note}`;
    }

    await prisma.project.update({
        where: { id: projectId, organizationId: orgId },
        data: dataToUpdate
    });

    await prisma.auditLog.create({
        data: {
            action: `VERIFIED_PAYMENT_${milestone}`,
            userId: user.id,
            organizationId: orgId,
            newValue: `Amount: ${amount}`,
            taskId: null
        }
    });

    // We can also trigger pusher updates here if needed

    revalidatePath('/dashboard/accounts');
    return { success: true };
}

export async function getAccountsNexus() {
    const { user, orgId } = await validateAccountsAccess();
    if (!user || !orgId) return null;

    const [stats, advances, materials, finals] = await Promise.all([
        getAccountsDashboardStats(),
        getPendingAdvancesQueue(),
        getMaterialClearanceQueue(),
        getFinalSettlementQueue()
    ]);

    return { 
        loaded: true,
        stats,
        queues: {
            advances,
            materials,
            finals
        }
    };
}
