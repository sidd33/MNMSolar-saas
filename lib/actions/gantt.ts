"use server";

import { prisma } from "@/lib/prisma";
import { syncUserAndOrg } from "@/app/actions/sync";

export async function getAllProjectsForList() {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) return [];

  return await prisma.project.findMany({
    where: { organizationId: sync.orgId },
    select: {
      id: true,
      name: true,
      stage: true,
      isBottlenecked: true,
      currentDepartment: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectGanttData(projectId: string) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) return [];

  const project = await prisma.project.findUnique({
    where: { id: projectId, organizationId: sync.orgId },
    select: {
      name: true,
      createdAt: true,
      stage: true,
      isBottlenecked: true,
      handoffLogs: {
        select: { toStage: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!project) return [];

  const stageConfigs: any[] = await prisma.$queryRaw`SELECT * FROM "StageConfig"`;

  const stages = [
    "SITE_SURVEY", "DETAILED_ENGG", 
    "WORK_ORDER", "HANDOVER_TO_EXECUTION", "MATERIAL_PROCUREMENT", 
    "STRUCTURE_ERECTION", "PV_PANEL_INSTALLATION", "AC_DC_INSTALLATION", 
    "NET_METERING", "FINAL_HANDOVER"
  ];

  const ganttData = [];
  let lastKnownEndDate = project.createdAt;
  let previousStageId = "";

  for (let i = 0; i < stages.length; i++) {
    const stageKey = stages[i];
    const config = stageConfigs.find((c: any) => c.stage === stageKey) || {
      stage: stageKey,
      label: stageKey.replace(/_/g, ' '),
      expectedDays: 5 // Default fallback
    };

    // 1. Determine Start Date
    let start: Date;
    const entryLog = project.handoffLogs.find(l => l.toStage === stageKey);
    
    if (stageKey === "PROSPECT") {
      start = project.createdAt;
    } else if (entryLog) {
      start = entryLog.createdAt;
    } else {
      // Future stage: Starts when previous stage ends
      start = new Date(lastKnownEndDate);
    }

    // 2. Determine End Date
    let end: Date;
    const nextStageKey = stages[i + 1];
    const exitLog = nextStageKey ? project.handoffLogs.find(l => l.toStage === nextStageKey) : null;
    
    const isCurrent = project.stage === stageKey;
    const isCompleted = !!exitLog || (!isCurrent && project.handoffLogs.some(l => stages.indexOf(l.toStage) > i));

    if (exitLog) {
      end = exitLog.createdAt;
    } else if (isCurrent) {
      end = new Date(); // Still in progress
    } else if (isCompleted) {
      // Fallback for skipped stages or legacy data — give it at least 1 day
      end = new Date(start.getTime() + 1 * 24 * 60 * 60 * 1000); 
    } else {
      // Future stage: Project duration based on config
      end = new Date(start.getTime() + config.expectedDays * 24 * 60 * 60 * 1000);
    }

    // SAFETY: frappe-gantt crashes if start >= end, ensure minimum 1 day gap
    if (end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + 1 * 24 * 60 * 60 * 1000);
    }

    // Progress calculation
    let progress = 0;
    if (isCompleted) {
      progress = 100;
    } else if (isCurrent) {
      const elapsed = Date.now() - start.getTime();
      const expected = config.expectedDays * 24 * 60 * 60 * 1000;
      progress = Math.min(Math.round((elapsed / expected) * 100), 99);
    }

    ganttData.push({
      id: stageKey,
      name: config.label,
      start,
      end,
      progress,
      dependencies: previousStageId,
      isBottlenecked: isCurrent && project.isBottlenecked,
      isCompleted,
      isCurrent,
      expectedDays: config.expectedDays
    });

    lastKnownEndDate = end;
    previousStageId = stageKey;
  }

  return {
    projectName: project.name,
    createdAt: project.createdAt,
    ganttData
  };
}
