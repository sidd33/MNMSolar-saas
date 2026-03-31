"use server";

import { prisma } from "@/lib/prisma";
import { currentUser, auth } from "@clerk/nextjs/server";
import { LeadStatus, QuoteStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Security middleware for Sales actions
 * Verifies authentication, role (EMPLOYEE), and department (SALES)
 */
async function validateSalesAccess() {
  const { orgId } = await auth();
  const user = await currentUser();
  
  if (!user) throw new Error("Unauthorized");

  const metadata = user.publicMetadata as any;
  const role = metadata?.role;
  const department = metadata?.department;

  if (role === "OWNER" || role === "SUPER_ADMIN") {
      return { user, orgId, isSales: false, isOwner: true };
  }

  if (role !== "EMPLOYEE" || department !== "SALES") {
    throw new Error("Access Denied: Sales Department Only");
  }

  return { user, orgId, isSales: true, isOwner: false };
}

// --- LEADS ---

export async function createLead(data: any) {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  const lead = await prisma.lead.create({
    data: {
      ...data,
      assignedToId: user.id,
      organizationId: orgId,
    },
  });

  revalidatePath("/dashboard/sales/leads");
  return lead;
}

export async function updateLead(id: string, data: any) {
  const { orgId } = await validateSalesAccess();
  
  const lead = await prisma.lead.update({
    where: { id, organizationId: orgId },
    data,
  });

  revalidatePath("/dashboard/sales/leads");
  return lead;
}

export async function getMyLeads() {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) return [];

  return await prisma.lead.findMany({
    where: { 
        organizationId: orgId,
        assignedToId: user.id
    },
    orderBy: { updatedAt: 'desc' },
    include: {
        quotes: true
    }
  });
}

export async function convertLeadToProject(leadId: string) {
    const { orgId } = await validateSalesAccess();
    
    return await prisma.lead.update({
        where: { id: leadId, organizationId: orgId },
        data: { status: LeadStatus.CONVERTED }
    });
}

// --- QUOTES ---

export async function createQuote(data: any) {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  const quote = await prisma.quote.create({
    data: {
      ...data,
      assignedToId: user.id,
      organizationId: orgId,
    },
  });

  revalidatePath("/dashboard/sales/quotes");
  return quote;
}

export async function updateQuote(id: string, data: any) {
  const { orgId } = await validateSalesAccess();
  
  const quote = await prisma.quote.update({
    where: { id, organizationId: orgId },
    data,
  });

  revalidatePath("/dashboard/sales/quotes");
  return quote;
}

export async function getMyQuotes() {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) return [];

  return await prisma.quote.findMany({
    where: { 
        organizationId: orgId,
        assignedToId: user.id
    },
    orderBy: { updatedAt: 'desc' },
    include: {
        lead: true
    }
  });
}

// --- PROJECTS ---

export async function getMyProjects() {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) return [];

  return await prisma.project.findMany({
    where: { 
        organizationId: orgId,
        createdByUserId: user.id
    },
    orderBy: { createdAt: 'desc' },
    include: {
        tasks: true
    }
  });
}

export async function getSalesDashboardStats() {
    const { user, orgId } = await validateSalesAccess();
    if (!orgId) return { leads: 0, activeQuotes: 0, projects: 0 };

    const [leadsCount, quotesCount, projectsCount] = await Promise.all([
        prisma.lead.count({ where: { organizationId: orgId, assignedToId: user.id } }),
        prisma.quote.count({ 
            where: { 
                organizationId: orgId, 
                assignedToId: user.id,
                status: { in: [QuoteStatus.SENT, QuoteStatus.NEGOTIATING] }
            } 
        }),
        prisma.project.count({ where: { organizationId: orgId, createdByUserId: user.id } })
    ]);

    return {
        leads: leadsCount,
        activeQuotes: quotesCount,
        projects: projectsCount
    };
}

export async function getRecentSalesActivity() {
    const { user, orgId } = await validateSalesAccess();
    if (!orgId) return [];

    const [leads, quotes] = await Promise.all([
        prisma.lead.findMany({
            where: { organizationId: orgId, assignedToId: user.id },
            orderBy: { updatedAt: 'desc' },
            take: 5
        }),
        prisma.quote.findMany({
            where: { organizationId: orgId, assignedToId: user.id },
            orderBy: { updatedAt: 'desc' },
            take: 5
        })
    ]);

    // Merge and sort
    const activity = [
        ...leads.map(l => ({ ...l, type: 'LEAD' })),
        ...quotes.map(q => ({ ...q, type: 'QUOTE' }))
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5);

    return activity;
}
