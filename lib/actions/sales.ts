"use server";

import { prisma } from "@/lib/prisma";
import { currentUser, auth } from "@clerk/nextjs/server";
import { LeadStatus, QuoteStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Security middleware for Sales actions
 * Verifies authentication, role (EMPLOYEE), and department (SALES)
 */
async function validateSalesAccess() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Resilience: Ensure user and org are synced and get the verified orgId
  const { syncUserAndOrg } = await import("@/app/actions/sync");
  const syncResult = await syncUserAndOrg();
  const orgId = syncResult?.orgId || null;

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

// --- ZOD SCHEMAS ---
const leadSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  siteAddress: z.string().optional(),
  capacityKw: z.number().optional(),
  estimatedValue: z.number().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  notes: z.string().optional()
});

const quoteSchema = z.object({
  leadId: z.string().optional(),
  projectName: z.string().min(1),
  clientName: z.string().min(1),
  capacityKw: z.number().optional(),
  quotedValue: z.number().optional(),
  status: z.nativeEnum(QuoteStatus).optional(),
  notes: z.string().optional(),
  fileUrl: z.string().optional(),
  utFileKey: z.string().optional()
});

// --- LEADS ---

export async function createLead(data: any) {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  const validated = leadSchema.parse(data);

  const lead = await prisma.lead.create({
    data: {
      ...validated,
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
  
  const validated = leadSchema.partial().parse(data);

  const lead = await prisma.lead.update({
    where: { id, organizationId: orgId },
    data: validated,
  });

  revalidatePath("/dashboard/sales/leads");
  return lead;
}

export async function getMyLeads(page: number = 1) {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) return Object.assign([], { page, hasMore: false }) as any;

  const data = await prisma.lead.findMany({
    where: { 
        organizationId: orgId,
        assignedToId: user.id,
        status: { notIn: [LeadStatus.CONVERTED, LeadStatus.LOST, LeadStatus.SITE_VISIT_SCHEDULED, LeadStatus.QUOTE_SENT] }
    },
    take: 50,
    skip: (page - 1) * 50,
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
      lostReason: true,
      lostAt: true,
      lostNote: true,
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

  return Object.assign(data, { page, hasMore: data.length === 50 }) as any;
}

export async function convertLeadToProject(leadId: string, excelData?: any) {
    const { user, orgId } = await validateSalesAccess();
    if (!orgId) throw new Error("No organization context found");
    
    const lead = await prisma.lead.findUnique({
        where: { id: leadId, organizationId: orgId },
        include: { quotes: true }
    });

    if (!lead) throw new Error("Lead not found");

    const approvedQuote = lead.quotes.find(q => q.status === QuoteStatus.CONVERTED);

    // Check for existing preliminary project
    const existingProject = await prisma.project.findFirst({
        where: { leadId: leadId, organizationId: orgId }
    });

    // Technical Gate: Handover Sheet check
    if (existingProject) {
        const handoverSheet = await prisma.projectFile.findFirst({
            where: { 
                projectId: existingProject.id,  
                category: 'HANDOVER_SHEET'
            }
        });
        if (!handoverSheet) {
            throw new Error("Handover Sheet must be uploaded before converting to a full project.");
        }
    } else {
        // If no project exists yet, they might need to upload it to the lead? 
        // But the flow says it's created at "Site survey scheduled".
        // If they skipped that, we'll allow creation but usually it should exist.
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Update Lead Status
        await tx.lead.update({
            where: { id: leadId },
            data: { status: LeadStatus.CONVERTED }
        });

        // 2. Create or Update Project
        const projectCount = await tx.project.count({ where: { organizationId: orgId } });
        const projCode = `PROJ-${1000 + projectCount + 1}`;
        
        const projectData = {
            name: (existingProject && !existingProject.isPreliminary) 
                ? existingProject.name 
                : `[${projCode}] ${excelData?.clientName || lead.name}`,
            clientName: excelData?.clientName || lead.contactPerson || lead.name,
            address: excelData?.address || lead.siteAddress || null,
            dcCapacity: excelData?.dcCapacity ? `${excelData.dcCapacity} kWp` : ((approvedQuote?.capacityKw || lead.capacityKw) ? `${approvedQuote?.capacityKw || lead.capacityKw} kWp` : (existingProject?.dcCapacity || "0 kWp")),
            orderValue: excelData?.orderValue || ((approvedQuote?.quotedValue || lead.estimatedValue) ? String(approvedQuote?.quotedValue || lead.estimatedValue) : (existingProject?.orderValue || null)),
            projectType: excelData?.projectType || existingProject?.projectType || null,
            primaryContactName: excelData?.primaryContactName || lead.contactPerson || null,
            primaryContactMobile: excelData?.primaryContactMobile || lead.mobile || null,
            organizationId: orgId,
            currentDepartment: "Engineering",
            stage: "DETAILED_ENGG" as any,
            isPreliminary: false,
            createdByUserId: user.id
        };

        let project;
        if (existingProject) {
            project = await tx.project.update({
                where: { id: existingProject.id },
                data: projectData
            });
        } else {
            project = await tx.project.create({
                data: projectData
            });
        }

        // 3. Create Handoff Log
        await tx.handoffLog.create({
            data: {
                projectId: project.id,
                fromDept: "SALES",
                toDept: "ENGINEERING",
                fromStage: "HANDOVER",
                toStage: "DETAILED_ENGG",
                userId: user.id,
                comment: "Lead converted to full project. Entering Solar OS pipeline.",
                organizationId: orgId
            }
        });

        return project;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/sales/leads");
    return result;
}

export async function initiatePreliminarySurvey(leadId: string, engineerIds?: string[]) {
    console.log("[SERVER] initiatePreliminarySurvey started", { leadId, engineerIds });
    const { user: clerkUser, orgId } = await validateSalesAccess();
    if (!orgId) throw new Error("No organization context found");

    console.log("[SERVER] Access validated. Lead ID:", leadId);
    const lead = await prisma.lead.findUnique({
        where: { id: leadId, organizationId: orgId }
    });

    if (!lead) {
        console.error("Lead not found for ID:", leadId, "and Org:", orgId);
        throw new Error("Lead not found");
    }

    // Run in transaction
    const result = await prisma.$transaction(async (tx) => {
        console.log("Transaction started...");
        // 1. Update Lead Status
        await tx.lead.update({
            where: { id: leadId },
            data: { status: LeadStatus.SITE_VISIT_SCHEDULED }
        });
        console.log("Lead status updated to SITE_VISIT_SCHEDULED");

        // 2. Create Project (Preliminary Site Survey)
        const projectCount = await tx.project.count({ where: { organizationId: orgId } });
        const projectCode = `PRELIM-${1000 + projectCount + 1}`;

        const project = await tx.project.create({
            data: {
                name: `[${projectCode}] ${lead.name}`,
                clientName: lead.contactPerson || lead.name,
                address: lead.siteAddress || null,
                dcCapacity: lead.capacityKw ? `${lead.capacityKw} kWp` : "0 kWp",
                primaryContactName: lead.contactPerson || null,
                primaryContactMobile: lead.mobile || null,
                organizationId: orgId,
                currentDepartment: "Engineering",
                stage: "SITE_SURVEY",
                executionStage: "SURVEY",
                isPreliminary: true,
                createdByUserId: clerkUser.id,
                originatedByUserId: clerkUser.id,
                leadId: leadId,
                // Assign if provided
                assignedByUserId: (engineerIds && engineerIds.length > 0) ? clerkUser.id : null,
                assignedAt: (engineerIds && engineerIds.length > 0) ? new Date() : null,
                assignedToEngineerId: (engineerIds && engineerIds.length > 0) ? engineerIds[0] : null,
                claimedByUserId: (engineerIds && engineerIds.length > 0) ? engineerIds[0] : null,
                claimedAt: (engineerIds && engineerIds.length > 0) ? new Date() : null,
                assignedEngineers: (engineerIds && engineerIds.length > 0) ? {
                    connect: engineerIds.map(id => ({ id }))
                } : undefined
            }
        });
        console.log("Project created:", project.id);

        // 3. Create Handoff Log
        await tx.handoffLog.create({
            data: {
                projectId: project.id,
                fromDept: "SALES",
                toDept: "ENGINEERING",
                fromStage: "SITE_SURVEY",
                toStage: "SITE_SURVEY",
                userId: clerkUser.id,
                comment: "Preliminary Site Survey initiated for quoting purposes.",
                organizationId: orgId
            }
        });
        console.log("Handoff log created");

        return project;
    });
    console.log("Transaction committed successfully.");

    // --- NOTIFICATION ENGINE ---
    const engineeringUsers = await prisma.user.findMany({
        where: {
            organizationId: orgId,
            department: 'ENGINEERING'
        },
        select: { id: true }
    });

    if (engineeringUsers.length > 0) {
        await prisma.notification.createMany({
            data: engineeringUsers.map(u => ({
                userId: u.id,
                organizationId: orgId,
                type: 'PROJECT_ARRIVED',
                title: 'New Survey Initiated',
                message: `${result.name} preliminary survey has been initiated.`,
                projectId: result.id,
                isRead: false,
            }))
        });
    }

    revalidatePath("/dashboard/sales/leads");
    revalidatePath("/dashboard/engineering/survey");
    revalidatePath("/dashboard/engineering/pool");
    revalidatePath("/dashboard");
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

  const validated = quoteSchema.parse(data);

  const quote = await prisma.quote.create({
    data: {
      ...validated,
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
  
  const validated = quoteSchema.partial().parse(data);

  const quote = await prisma.quote.update({
    where: { id, organizationId: orgId },
    data: validated,
  });

  revalidatePath("/dashboard/sales/quotes");
  return quote;
}

export async function updateQuoteDetails(quoteId: string, data: {
  quotedValue?: number;
  capacityKw?: number;
  paymentTermsAdvance?: number;
  paymentTermsMaterial?: number;
  paymentTermsFinal?: number;
  scopeOfWork?: string;
  notes?: string;
}) {
  const { orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, organizationId: orgId }
  });

  if (!quote) throw new Error("Quote not found");
  if (quote.status === "CONVERTED") {
    throw new Error("Cannot edit a converted quote.");
  }

  // Validate payment terms if all three are provided
  if (data.paymentTermsAdvance !== undefined && data.paymentTermsMaterial !== undefined && data.paymentTermsFinal !== undefined) {
    const sum = Number(data.paymentTermsAdvance) + Number(data.paymentTermsMaterial) + Number(data.paymentTermsFinal);
    if (sum !== 100) {
      throw new Error("Payment terms must add up to 100%.");
    }
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      quotedValue: data.quotedValue !== undefined ? Number(data.quotedValue) : undefined,
      capacityKw: data.capacityKw !== undefined ? Number(data.capacityKw) : undefined,
      paymentTermsAdvance: data.paymentTermsAdvance !== undefined ? Number(data.paymentTermsAdvance) : undefined,
      paymentTermsMaterial: data.paymentTermsMaterial !== undefined ? Number(data.paymentTermsMaterial) : undefined,
      paymentTermsFinal: data.paymentTermsFinal !== undefined ? Number(data.paymentTermsFinal) : undefined,
      scopeOfWork: data.scopeOfWork,
      notes: data.notes
    }
  });

  revalidatePath("/dashboard/sales/quotes");
  return { success: true };
}

export async function uploadQuoteDocument(quoteId: string, fileUrl: string, utFileKey: string, fileName: string) {
  const { orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, organizationId: orgId }
  });

  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "DRAFT") {
    throw new Error("Only DRAFT quotes can have their initial quote PDF uploaded.");
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      fileUrl,
      utFileKey,
      status: "NEGOTIATING"
    }
  });

  revalidatePath("/dashboard/sales/quotes");
  return { success: true };
}

export async function approveAndLaunchQuote(quoteId: string, handoverSheetUrl: string, handoverSheetKey: string, handoverSheetName: string, excelData?: any) {
  const { orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, organizationId: orgId },
    include: { lead: true }
  });

  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "NEGOTIATING") {
    throw new Error("Only a quote in negotiation can be approved.");
  }
  if (!handoverSheetUrl) {
    throw new Error("Handover Sheet must be uploaded before launching to Solar OS.");
  }
  if (!quote.leadId) {
    throw new Error("Quote has no linked lead.");
  }

  const project = await prisma.project.findFirst({
    where: {
      leadId: quote.leadId,
      isPreliminary: true,
      organizationId: orgId
    }
  });

  if (!project) {
    throw new Error("No preliminary project found for this quote. Contact your administrator.");
  }

  // Run in transaction to ensure consistency
  await prisma.$transaction(async (tx) => {
    // Update Quote
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: "CONVERTED" }
    });
  });

  // Launch project
  await convertLeadToProject(quote.leadId, excelData);

  revalidatePath("/dashboard/sales/quotes");
  revalidatePath("/dashboard/engineering/survey");
  revalidatePath("/dashboard/sales/leads");
  
  return { success: true, projectId: project.id };
}

export async function getMyQuotes(page: number = 1) {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) return Object.assign([], { page, hasMore: false }) as any;

  const data = await prisma.quote.findMany({
    where: { 
        organizationId: orgId,
        assignedToId: user.id,
        status: { not: QuoteStatus.CONVERTED }
    },
    take: 50,
    skip: (page - 1) * 50,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      projectName: true,
      clientName: true,
      capacityKw: true,
      quotedValue: true,
      paymentTermsAdvance: true,
      paymentTermsMaterial: true,
      paymentTermsFinal: true,
      scopeOfWork: true,
      notes: true,
      status: true,
      fileUrl: true,
      utFileKey: true,
      createdAt: true,
      updatedAt: true,
      lead: {
        select: {
          id: true,
          name: true,
          mobile: true,
          projects: {
            where: { isPreliminary: true },
            select: { id: true },
            take: 1
          }
        }
      }
    }
  });

  return Object.assign(data, { page, hasMore: data.length === 50 }) as any;
}

// --- PROJECTS ---

export async function getMyProjects(page: number = 1) {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) return Object.assign([], { page, hasMore: false }) as any;

  const data = await prisma.project.findMany({
    where: { 
        organizationId: orgId,
        createdByUserId: user.id
    },
    take: 50,
    skip: (page - 1) * 50,
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

  return Object.assign(data, { page, hasMore: data.length === 50 }) as any;
}

export async function getSalesDashboardStats() {
    const { user, orgId } = await validateSalesAccess();
    if (!orgId) return { leads: 0, activeQuotes: 0, projects: 0 };

    const [leadsCount, quotesCount, projectsCount] = await Promise.all([
        prisma.lead.count({ 
            where: { 
                organizationId: orgId, 
                assignedToId: user.id,
                status: { notIn: [LeadStatus.CONVERTED, LeadStatus.LOST] }
            } 
        }),
        prisma.quote.count({ 
            where: { 
                organizationId: orgId, 
                assignedToId: user.id,
                status: { in: [QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.NEGOTIATING] }
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

export async function getAllLeadsForOrg() {
    const { orgId, isOwner } = await validateSalesAccess();
    if (!orgId || !isOwner) throw new Error("Unauthorized: Owner access required");

    return await prisma.lead.findMany({
        where: { organizationId: orgId },
        take: 100,
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            name: true,
            status: true,
            mobile: true,
            estimatedValue: true,
            capacityKw: true,
            createdAt: true,
            assignedToId: true,
            assignedTo: { select: { id: true, email: true } }
        }
    });
}

export async function getAllQuotesForOrg() {
    const { orgId, isOwner } = await validateSalesAccess();
    if (!orgId || !isOwner) throw new Error("Unauthorized");

    return await prisma.quote.findMany({
        where: { organizationId: orgId },
        take: 100,
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            quotedValue: true,
            status: true,
            createdAt: true,
            assignedToId: true,
            lead: { select: { name: true } },
            assignedTo: { select: { id: true, email: true } }
        }
    });
}

export async function getAllSalesEmployees() {
    const { orgId, isOwner } = await validateSalesAccess();
    if (!orgId || !isOwner) throw new Error("Unauthorized");

    return await prisma.user.findMany({
        where: { 
            organizationId: orgId,
            department: 'SALES'
        },
        select: { id: true, email: true }
    });
}

export async function reassignLead(leadId: string, newUserId: string) {
    const { orgId, isOwner } = await validateSalesAccess();
    if (!orgId || !isOwner) throw new Error("Unauthorized");

    await prisma.lead.update({
        where: { id: leadId, organizationId: orgId },
        data: { assignedToId: newUserId }
    });

    revalidatePath('/dashboard/sales/leads');
    revalidatePath('/dashboard/owner');
    return { success: true };
}

export async function reassignQuote(quoteId: string, newUserId: string) {
    const { orgId, isOwner } = await validateSalesAccess();
    if (!orgId || !isOwner) throw new Error("Unauthorized");

    await prisma.quote.update({
        where: { id: quoteId, organizationId: orgId },
        data: { assignedToId: newUserId }
    });

    revalidatePath('/dashboard/sales/quotes');
    revalidatePath('/dashboard/owner');
    return { success: true };
}

// --- FOLLOW-UPS ---

export async function addFollowUp(
  leadId: string,
  type: string,
  note: string,
  followUpDate?: string
) {
  const { user, orgId, isSales, isOwner } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  const lead = await prisma.lead.findUnique({
    where: { id: leadId, organizationId: orgId }
  });

  if (!lead) throw new Error("Lead not found");

  // Verify caller is the lead's assignedToId OR role is OWNER/SUPER_ADMIN
  if (lead.assignedToId !== user.id && !isOwner) {
    throw new Error("You are not assigned to this lead.");
  }

  const validTypes = ['CALL', 'SITE_VISIT', 'EMAIL', 'WHATSAPP', 'MEETING', 'OTHER'];
  if (!validTypes.includes(type)) {
    throw new Error("Invalid follow-up type.");
  }

  if (!note.trim()) {
    throw new Error("Follow-up note cannot be empty.");
  }

  const followUp = await prisma.followUp.create({
    data: {
      leadId,
      userId: user.id,
      organizationId: orgId,
      type,
      note,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      isCompleted: false
    }
  });

  revalidatePath('/dashboard/sales/leads');
  return { success: true };
}

export async function completeFollowUp(followUpId: string) {
  const { orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  await prisma.followUp.update({
    where: { id: followUpId, organizationId: orgId },
    data: { isCompleted: true }
  });

  revalidatePath('/dashboard/sales/leads');
  return { success: true };
}

export async function getLeadFollowUps(leadId: string) {
  const { orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  return await prisma.followUp.findMany({
    where: { leadId, organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      note: true,
      followUpDate: true,
      isCompleted: true,
      createdAt: true,
      user: { select: { id: true, email: true } }
    }
  });
}

// --- LOST LEADS ---

export async function markLeadLost(
  leadId: string,
  lostReason: string,
  lostNote?: string
) {
  const { user, orgId, isOwner } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  const lead = await prisma.lead.findUnique({
    where: { id: leadId, organizationId: orgId }
  });

  if (!lead) throw new Error("Lead not found");

  if (lead.assignedToId !== user.id && !isOwner) {
    throw new Error("You are not assigned to this lead.");
  }

  const validReasons = ['COMPETITOR', 'BUDGET', 'CANCELLED', 'APPROVALS', 'TECHNICAL', 'NO_RESPONSE', 'OTHER'];
  if (!validReasons.includes(lostReason)) {
    throw new Error("Please select a valid reason.");
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: LeadStatus.LOST,
      lostReason: lostReason,
      lostAt: new Date(),
      lostNote: lostNote || null
    }
  });

  revalidatePath('/dashboard/sales/leads');
  return { success: true };
}

// --- QUOTE VERSIONS ---

export async function uploadQuoteVersion(
  quoteId: string,
  fileUrl: string,
  utFileKey: string,
  fileName: string,
  quotedValue?: number,
  note?: string
) {
  const { user, orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, organizationId: orgId }
  });

  if (!quote) throw new Error("Quote not found");
  if (quote.status === "CONVERTED") {
    throw new Error("Cannot upload a new version to a converted quote.");
  }

  const lastVersion = await prisma.quoteVersion.findFirst({
    where: { quoteId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true }
  });

  const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

  await prisma.$transaction(async (tx) => {
    await tx.quoteVersion.create({
      data: {
        quoteId,
        versionNumber: nextVersion,
        quotedValue: quotedValue !== undefined ? Number(quotedValue) : quote.quotedValue,
        fileUrl,
        utFileKey,
        fileName,
        note,
        uploadedById: user.id,
        organizationId: orgId
      }
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: {
        fileUrl,
        utFileKey,
        quotedValue: quotedValue !== undefined ? Number(quotedValue) : undefined,
        status: quote.status === "DRAFT" ? "NEGOTIATING" : quote.status
      }
    });
  });

  revalidatePath('/dashboard/sales/quotes');
  return { success: true, versionNumber: nextVersion };
}

export async function getQuoteVersions(quoteId: string) {
  const { orgId } = await validateSalesAccess();
  if (!orgId) throw new Error("No organization context found");

  return await prisma.quoteVersion.findMany({
    where: { quoteId, organizationId: orgId },
    orderBy: { versionNumber: 'desc' },
    select: {
      id: true,
      versionNumber: true,
      quotedValue: true,
      fileUrl: true,
      fileName: true,
      note: true,
      createdAt: true,
      uploadedBy: { select: { id: true, email: true } }
    }
  });
}
