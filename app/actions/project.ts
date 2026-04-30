"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { syncUserAndOrg } from "./sync";
import { PipelineStage } from "@/lib/types";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import { QuoteStatus, LeadStatus } from "@prisma/client";

const utapi = new UTApi();

function calculateBottleneck(liasoningStage: string, executionStage: string): boolean {
  // Rule 1: If executionStage is STRUCTURE or higher but liasoningStage is NOT_STARTED or FEASIBILITY
  const executionRank = ["SURVEY", "STRUCTURE", "PANEL_INSTALL", "INVERTER_WIRING"].indexOf(executionStage);
  const liasoningRank = ["NOT_STARTED", "FEASIBILITY", "L1_APPROVED", "AGREEMENT", "COMMISSIONED"].indexOf(liasoningStage);

  if (executionRank >= 1 && liasoningRank <= 1) { // STRUCTURE is index 1, FEASIBILITY is index 1
    return true;
  }

  // Rule 2: If executionStage reaches INVERTER_WIRING but liasoningStage isn't AGREEMENT or higher
  if (executionRank === 3 && liasoningRank < 3) { // INVERTER_WIRING is index 3, AGREEMENT is index 3
    return true;
  }

  return false;
}

export async function getProjectsWithTasks(showOnlyMyTasks?: boolean) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) return [];

  const { userId, orgId } = sync;

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      name: true,
      stage: true,
      currentDepartment: true,
      updatedAt: true,
      isBottlenecked: true,
      clientName: true,
      tasks: {
        where: showOnlyMyTasks ? { assigneeId: userId } : undefined,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assigneeId: true,
          assignee: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' }
      }
    }
  });

  return projects;
}

export async function quickAddTask(formData: FormData) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized or no organization context");

  const { userId, orgId } = sync;

  const title = formData.get("title") as string;
  const projectId = formData.get("projectId") as string;
  let status = formData.get("status") as string;

  if (!title || !projectId) throw new Error("Missing required fields");

  // Verify project belongs to org
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId }
  });

  if (!project) throw new Error("Project not found or unauthorized");

  const task = await prisma.task.create({
    data: {
      title,
      projectId,
      assigneeId: userId, // assign to self for quick add
      status: status || "TODO",
      organizationId: orgId
    }
  });

  // Create Audit Log
  await prisma.auditLog.create({
    data: {
      action: "CREATED_TASK",
      taskId: task.id,
      userId,
      newValue: task.status,
      organizationId: orgId
    }
  });

  revalidatePath('/dashboard/projects');
  return task;
}

export async function createProject(formData: FormData) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized or no organization context");

  const { orgId } = sync;
  const name = formData.get("name") as string;
  const clientName = formData.get("clientName") as string;
  const address = formData.get("address") as string;
  
  // New Optional Fields
  const dcCapacity = formData.get("dcCapacity") as string;
  const orderValue = formData.get("orderValue") as string;
  const projectType = formData.get("projectType") as string;
  const primaryContactName = formData.get("primaryContactName") as string;
  const primaryContactMobile = formData.get("primaryContactMobile") as string;

  // File Upload
  const handoverFile = formData.get("handoverFile") as File;

  const liasoningStage = (formData.get("liasoningStage") as string) || "NOT_STARTED";
  const executionStage = (formData.get("executionStage") as string) || "SURVEY";
  const isBottlenecked = calculateBottleneck(liasoningStage, executionStage);

  const department = formData.get("department") as string || "Sales";
  const deptEnum = z.enum(["Sales", "Engineering", "Execution", "Accounts"]);
  const validatedDept = deptEnum.parse(department);

  const projectCount = await prisma.project.count({ where: { organizationId: orgId } });
  const projectCode = `PROJ-${1000 + projectCount + 1}`;

  const project = await prisma.project.create({
    data: {
      name: `[${projectCode}] ${name}`,
      clientName: clientName || null,
      address: address || null,
      dcCapacity: dcCapacity || "50 kWp",
      orderValue: orderValue || null,
      projectType: projectType || null,
      primaryContactName: primaryContactName || null,
      primaryContactMobile: primaryContactMobile || null,
      organizationId: orgId,
      currentDepartment: validatedDept,
      liasoningStage: liasoningStage as any,
      executionStage: executionStage as any,
      isBottlenecked,
    } as any,
  });

  // Legacy Base64 Handover Sheet processing removed. 
  // File uploads are now securely routed natively through UploadThing APIs on the client.

  // Create initial task for Sales
  await prisma.task.create({
    data: {
      title: "Initial Prospect Review",
      description: "Review initial project details and contact prospect for site survey.",
      status: "TODO",
      priority: "HIGH",
      department: "Sales",
      projectId: project.id,
      organizationId: orgId,
      assigneeId: sync.userId, 
    } as any
  });

  // 📝 Create Initial Handoff Log for Timeline
  await (prisma as any).handoffLog.create({
    data: {
      projectId: project.id,
      fromDept: "CLIENT",
      toDept: "SALES",
      fromStage: "LAUNCH",
      toStage: "SITE_SURVEY",
      userId: sync.userId,
      comment: "Project Initialized: Solar OS operational pipeline launched.",
      organizationId: orgId
    }
  });

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/department/Sales");
  return project;
}

export async function getProjectLanes(projectId: string) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized");

  const tasks = await prisma.task.findMany({
    where: { projectId, organizationId: sync.orgId },
    include: { assignee: true },
    orderBy: { createdAt: 'desc' }
  });

  // Group by department
  const groups: Record<string, any[]> = {
    "Sales": [],
    "Engineering": [],
    "Execution": [],
    "Accounts": [],
    "Unassigned": []
  };

  tasks.forEach((task: any) => {
    const dept = task.department || "Unassigned";
    if (groups[dept]) {
      groups[dept].push(task);
    } else {
      groups["Unassigned"].push(task);
    }
  });

  return groups;
}

export async function forwardProject(formData: FormData) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized");

  const projectId = formData.get("projectId") as string;
  const nextStage = formData.get("nextStage") as PipelineStage;
  const comment = formData.get("comment") as string;
  const department = formData.get("department") as string;

  if (!projectId || !nextStage) throw new Error("Missing required fields");

  const expectedCurrentStage = formData.get("currentStage") as string | null;

  let previousProject: any;
  let project: any;

  // Run in transaction for optimistic concurrency guard
  project = await prisma.$transaction(async (tx) => {
    previousProject = await tx.project.findUnique({ 
      where: { id: projectId, organizationId: sync.orgId } 
    });

    if (!previousProject) throw new Error("Project not found");

    if (expectedCurrentStage && previousProject.stage !== expectedCurrentStage) {
      throw new Error("Stage has changed — please refresh and try again.");
    }

    // FIX 3: Linear Stage Enforcement
    const PIPELINE_ORDER = [
      "SITE_SURVEY", "DETAILED_ENGG",
      "WORK_ORDER", "HANDOVER_TO_EXECUTION", "MATERIAL_PROCUREMENT",
      "STRUCTURE_ERECTION", "PV_PANEL_INSTALLATION", "AC_DC_INSTALLATION",
      "NET_METERING", "FINAL_HANDOVER"
    ];

    const currentIndex = PIPELINE_ORDER.indexOf(previousProject.stage);
    const nextIndex = PIPELINE_ORDER.indexOf(nextStage);
    const isOwner = sync.user?.role === 'OWNER' || sync.user?.role === 'SUPER_ADMIN';

    if (!isOwner && nextIndex !== currentIndex + 1) {
      throw new Error("Cannot advance past one stage at a time");
    }

    // FIX 4: Technical Gate Enforcement
    const projectFiles = await tx.projectFile.findMany({ where: { projectId, organizationId: sync.orgId } });
    const hasFile = (pattern: string) => projectFiles.some(f => f.name.includes(`[${pattern}]`) || f.name.toUpperCase().includes(pattern));

    if (previousProject.stage === "SITE_SURVEY") {
      const surveyReport = projectFiles.some(f => f.name.includes("[SURVEY_REPORT]") || f.name.toUpperCase().includes("SURVEY"));
      if (!surveyReport) throw new Error("Technical Gate: Survey Report missing. Engineering must upload it before dispatch.");
    }

    if (previousProject.stage === "DETAILED_ENGG") {
      const sld = hasFile("SLD");
      const layout = hasFile("LAYOUT");
      const structural = hasFile("STRUCTURAL");
      const bom = hasFile("BOM");
      const surveyVerified = !!previousProject.sanctionedLoad && previousProject.sanctionedLoad !== " kW" && previousProject.sanctionedLoad !== "";
      
      if (!surveyVerified || !sld || !layout || !structural || !bom) {
          throw new Error("Technical Gate: Engineering checklist incomplete (SLD, Layout, Structural, or BoM missing).");
      }
      
      const agreement = hasFile("AGREEMENT");
      const testRecord = hasFile("TEST_RECORD") || hasFile("TEST_RECORDS");
      const earthTest = hasFile("EARTH_TEST");
      const workComp = hasFile("WORK_COMP") || hasFile("WORK COMPLETION") || hasFile("WORK_COMPLETION");
      const annexures = projectFiles.filter(f => f.name.toLowerCase().includes("annexure")).length;
      
      if (!agreement || !testRecord || !earthTest || !workComp || annexures < 5) {
          throw new Error("Technical Gate: Liaisoning documentation incomplete (Agreement, Test Records, or Annexures missing).");
      }
    }

    // Determine track stage updates
    const trackUpdates: any = {};
    if (nextStage === "DETAILED_ENGG") trackUpdates.liasoningStage = "FEASIBILITY";
    if (nextStage === "WORK_ORDER") trackUpdates.liasoningStage = "L1_APPROVED";
    if (nextStage === "NET_METERING") trackUpdates.liasoningStage = "AGREEMENT";
    if (nextStage === "FINAL_HANDOVER") trackUpdates.liasoningStage = "COMMISSIONED";

    if (nextStage === "SITE_SURVEY") trackUpdates.executionStage = "SURVEY";
    if (nextStage === "STRUCTURE_ERECTION") trackUpdates.executionStage = "STRUCTURE";
    if (nextStage === "PV_PANEL_INSTALLATION") trackUpdates.executionStage = "PANEL_INSTALL";
    if (nextStage === "AC_DC_INSTALLATION") trackUpdates.executionStage = "INVERTER_WIRING";

    let finalNextStage = nextStage;

    // SPECIAL CASE: SITE_SURVEY completion for Preliminary Projects
    // Preliminary surveys stay at SITE_SURVEY but return to Sales for quoting
    if (previousProject.stage === "SITE_SURVEY" && previousProject.isPreliminary) {
        // 1. Create Quote record for Sales
        const dcCapacityValue = previousProject.dcCapacity ? parseFloat(previousProject.dcCapacity.replace(/[^\d.]/g, '')) : null;
        
        await tx.quote.create({
            data: {
                projectName: previousProject.name,
                clientName: previousProject.clientName || previousProject.name,
                capacityKw: (dcCapacityValue && !isNaN(dcCapacityValue)) ? dcCapacityValue : null,
                quotedValue: null,
                status: QuoteStatus.DRAFT,
                notes: 'Auto-generated from preliminary site survey completion.',
                assignedToId: previousProject.originatedByUserId,
                leadId: previousProject.leadId,
                organizationId: sync.orgId,
            }
        });

        // 2. Update Lead Status
        if (previousProject.leadId) {
            await tx.lead.update({
                where: { id: previousProject.leadId },
                data: { status: LeadStatus.QUOTE_SENT }
            });
        }

        // 3. Force Department back to Sales and KEEP stage at SITE_SURVEY
        trackUpdates.currentDepartment = 'Sales';
        finalNextStage = "SITE_SURVEY" as any;
    }

    const newLiasoningStage = trackUpdates.liasoningStage || previousProject.liasoningStage;
    const newExecutionStage = trackUpdates.executionStage || previousProject.executionStage;
    const isBottlenecked = calculateBottleneck(newLiasoningStage, newExecutionStage);

    return await tx.project.update({
      where: { id: projectId, organizationId: sync.orgId },
      data: {
        stage: finalNextStage,
        currentDepartment: trackUpdates.currentDepartment || department || null,
        ...trackUpdates,
        isBottlenecked
      }
    });
  });

  // Create Audit Log
  const taskId = (await prisma.task.findFirst({ where: { projectId } }))?.id || null;
  const auditLogId = globalThis.crypto.randomUUID();
  const actionString = `FORWARDED_TO_${nextStage}`;
  
  await prisma.$executeRaw`
    INSERT INTO "AuditLog" ("id", "action", "oldValue", "newValue", "userId", "taskId", "organizationId", "createdAt")
    VALUES (${auditLogId}, ${actionString}, ${comment}, ${nextStage}, ${sync.userId}, ${taskId}, ${sync.orgId}, NOW())
  `;

  // 📝 Create Handoff Log for Timeline
  const isPrelimHandoff = previousProject.stage === "SITE_SURVEY" && previousProject.isPreliminary;
  await (prisma as any).handoffLog.create({
    data: {
      project: { connect: { id: projectId } },
      fromDept: previousProject?.currentDepartment || "Sales",
      toDept: isPrelimHandoff ? "Sales" : (department || nextStage),
      fromStage: previousProject?.stage || "SITE_SURVEY",
      toStage: isPrelimHandoff ? "SITE_SURVEY" : nextStage,
      user: { connect: { id: sync.userId } },
      comment: comment || "Standard departmental handoff",
      organization: { connect: { id: sync.orgId } }
    }
  });

  if (nextStage === "FINAL_HANDOVER") {
    import('@/lib/actions/archive').then(({ archiveProjectFiles }) => {
      archiveProjectFiles(projectId).catch(e => console.error("Auto-archive failed:", e));
    });
  }

  revalidatePath(`/dashboard/projects`);
  revalidatePath(`/dashboard/owner`);
  revalidatePath(`/dashboard/department/${department}`);
  revalidatePath('/dashboard/sales/quotes');
  revalidatePath('/dashboard/sales');
  revalidatePath('/dashboard/sales/leads');
  
  return project;
}

export async function getProject360Data(projectId: string) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized");

  const project = await prisma.project.findUnique({
    where: { id: projectId, organizationId: sync.orgId },
    select: {
      id: true,
      name: true,
      stage: true,
      liasoningStage: true,
      executionStage: true,
      currentDepartment: true,
      clientName: true,
      address: true,
      dcCapacity: true,
      sanctionedLoad: true,
      orderValue: true,
      projectType: true,
      primaryContactName: true,
      primaryContactMobile: true,
      updatedAt: true,
      createdAt: true,
      handoffLogs: {
        select: {
          id: true,
          fromDept: true,
          toDept: true,
          fromStage: true,
          toStage: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      projectFiles: {
        select: {
          id: true,
          name: true,
          category: true,
          fileUrl: true,
          utFileKey: true,
          isArchived: true,
          uploadedAtStage: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          assignee: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return project;
}
export async function uploadProjectFile(formData: FormData) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Auth required");

  const projectId = formData.get("projectId") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as any;
  const content = formData.get("content") as string;
  const fileUrl = formData.get("fileUrl") as string | null;
  const utFileKey = formData.get("utFileKey") as string | null;
  const fileId = formData.get("id") as string | null;
  const customStage = formData.get("stage") as string | null;

  if (!projectId || !name || !category) {
    throw new Error("Missing file data");
  }

  let file;
  if (fileId) {
    file = await prisma.projectFile.update({
      where: { id: fileId, organizationId: sync.orgId },
      data: {
        name,
        category,
        content: content || "",
        fileUrl,
        utFileKey,
      } as any,
    });
  } else {
    // Fetch current stage as fallback
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { stage: true }
    });

    file = await prisma.projectFile.create({
      data: {
        name,
        category,
        content: content || "",
        fileUrl,
        utFileKey,
        uploadedAtStage: customStage || project?.stage || "UNKNOWN",
        projectId,
        organizationId: sync.orgId,
      } as any,
    });
  }

  revalidatePath(`/dashboard/department`);
  return file;
}

export async function getProjectFiles(projectId: string) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) return [];

  return await prisma.projectFile.findMany({
    where: {
      projectId,
      organizationId: sync.orgId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateProjectDepartment(formData: FormData) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized");

  const projectId = formData.get("projectId") as string;
  const department = formData.get("department") as string;

  if (!projectId || !department) throw new Error("Missing required fields");

  const project = await prisma.project.update({
    where: { id: projectId, organizationId: sync.orgId },
    data: {
      currentDepartment: department,
    } as any
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/department/${department}`);
  // Also revalidate the old department if we had it, but for simplicity:
  revalidatePath("/dashboard/owner");
}

export async function updateSanctionedLoad(projectId: string, sanctionedLoad: string | null) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized");

  const project = await prisma.project.update({
    where: { id: projectId, organizationId: sync.orgId },
    data: { sanctionedLoad }
  });

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/owner");
  return project;
}

export async function deleteProjectFile(fileId: string, projectId: string) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized");

  // Verify file belongs to project and org for security
  const file = await prisma.projectFile.findUnique({
    where: { 
      id: fileId, 
      projectId: projectId, 
      organizationId: sync.orgId 
    }
  });

  if (!file) throw new Error("File not found or unauthorized");

  // Fix 5: Clean up UploadThing before DB delete
  if (file.utFileKey) {
    try {
      await utapi.deleteFiles(file.utFileKey);
    } catch (e) {
      console.error("Failed to delete from UploadThing:", e);
    }
  }

  await prisma.projectFile.delete({
    where: { id: fileId }
  });

  revalidatePath(`/dashboard/projects`);
  revalidatePath(`/dashboard/department`);
  return { success: true };
}
