"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { syncUserAndOrg } from "./sync";
import { PipelineStage } from "@/lib/types";

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
    include: {
      tasks: {
        where: showOnlyMyTasks ? { assigneeId: userId } : undefined,
        include: {
          assignee: true,
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

  const project = await prisma.project.create({
    data: {
      name,
      clientName: clientName || null,
      address: address || null,
      dcCapacity: dcCapacity || "50 kWp",
      orderValue: orderValue || null,
      projectType: projectType || null,
      primaryContactName: primaryContactName || null,
      primaryContactMobile: primaryContactMobile || null,
      organizationId: orgId,
      currentDepartment: "Sales",
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
      toStage: "PROSPECT",
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

  // Read BEFORE update to capture original dept/stage for handoff log
  const previousProject = await prisma.project.findUnique({ where: { id: projectId, organizationId: sync.orgId } });

  // Update Project
  const project = await prisma.project.update({
    where: { id: projectId, organizationId: sync.orgId },
    data: {
      stage: nextStage,
      currentDepartment: department || null,
    }
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
  await (prisma as any).handoffLog.create({
    data: {
      project: { connect: { id: projectId } },
      fromDept: previousProject?.currentDepartment || "Sales",
      toDept: department || nextStage,
      fromStage: previousProject?.stage || "PROSPECT",
      toStage: nextStage,
      user: { connect: { id: sync.userId } },
      comment: comment || "Standard departmental handoff",
      organization: { connect: { id: sync.orgId } }
    }
  });

  if (nextStage === "FINAL_HANDOVER") {
    import('@/lib/actions/archive').then(({ archiveProjectFiles }) => {
      archiveProjectFiles(projectId).catch(e => console.error("Auto-archive failed:", e));
    });
    console.log(`Archive triggered for project: ${projectId}`);
  }

  revalidatePath(`/dashboard/projects`);
  revalidatePath(`/dashboard/owner`);
  revalidatePath(`/dashboard/department/${department}`);
  
  return project;
}

export async function getProject360Data(projectId: string) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized");

  const project = await prisma.project.findUnique({
    where: { id: projectId, organizationId: sync.orgId },
    include: {
      handoffLogs: {
        include: { user: true },
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
        orderBy: [{ createdAt: 'desc' }] as any,
        include: { assignee: true }
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
    // Fetch current stage
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
        uploadedAtStage: project?.stage || "UNKNOWN",
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
