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
  if (!orgId) throw new Error("No organization context found");
  
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
    select: {
      id: true,
      name: true,
      contactPerson: true,
      mobile: true,
      email: true,
      siteAddress: true,
      capacityKw: true,
      estimatedValue: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      quotes: {
        select: {
          id: true,
          projectName: true,
          quotedValue: true,
          status: true,
          updatedAt: true,
        }
      }
    }
  });
}

export async function convertLeadToProject(leadId: string) {
    const { orgId } = await validateSalesAccess();
    if (!orgId) throw new Error("No organization context found");
    
    return await prisma.lead.update({
        where: { id: leadId, organizationId: orgId },
        data: { status: LeadStatus.CONVERTED }
    });
}

export async function initiatePreliminarySurvey(leadId: string) {
    const { user, orgId } = await validateSalesAccess();
    if (!orgId) throw new Error("No organization context found");

    const lead = await prisma.lead.findUnique({
        where: { id: leadId, organizationId: orgId }
    });

    if (!lead) throw new Error("Lead not found");

    // Run in transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Update Lead Status
        await tx.lead.update({
            where: { id: leadId },
            data: { status: LeadStatus.SITE_VISIT_SCHEDULED }
        });

        // 2. Create Project (Preliminary Site Survey)
        const project = await tx.project.create({
            data: {
                name: `[PRELIM] ${lead.name}`,
                clientName: lead.contactPerson || lead.name,
                address: lead.siteAddress || null,
                dcCapacity: lead.capacityKw ? `${lead.capacityKw} kWp` : "0 kWp",
                primaryContactName: lead.contactPerson || null,
                primaryContactMobile: lead.mobile || null,
                organizationId: orgId,
                currentDepartment: "ENGINEERING",
                stage: "SITE_SURVEY",
                createdByUserId: user.id
            }
        });

        // 3. Create Handoff Log
        await tx.handoffLog.create({
            data: {
                projectId: project.id,
                fromDept: "SALES",
                toDept: "ENGINEERING",
                fromStage: "PROSPECT",
                toStage: "SITE_SURVEY",
                userId: user.id,
                comment: "Preliminary Site Survey initiated for quoting purposes.",
                organizationId: orgId
            }
        });

        return project;
    });

    revalidatePath("/dashboard/sales/leads");
    revalidatePath("/dashboard/engineering/survey");
    return result;
}

export async function getSurveyTrackingLeads() {
    const { user, orgId } = await validateSalesAccess();
    if (!orgId) return [];

    return await prisma.lead.findMany({
        where: {
            organizationId: orgId,
            assignedToId: user.id,
            status: LeadStatus.SITE_VISIT_SCHEDULED
        },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            name: true,
            contactPerson: true,
            mobile: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            quotes: {
                select: {
                    id: true,
                    projectName: true,
                    quotedValue: true,
                    status: true,
                }
            }
        }
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
  if (!orgId) throw new Error("No organization context found");
  
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
    select: {
      id: true,
      projectName: true,
      clientName: true,
      capacityKw: true,
      quotedValue: true,
      status: true,
      fileUrl: true,
      createdAt: true,
      updatedAt: true,
      lead: {
        select: {
          id: true,
          name: true,
          mobile: true,
        }
      }
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
    select: {
      id: true,
      name: true,
      clientName: true,
      stage: true,
      currentDepartment: true,
      updatedAt: true,
      createdAt: true,
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
        }
      }
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
            select: { id: true, name: true, status: true, updatedAt: true },
            take: 5
        }),
        prisma.quote.findMany({
            where: { organizationId: orgId, assignedToId: user.id },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, projectName: true, status: true, updatedAt: true },
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
