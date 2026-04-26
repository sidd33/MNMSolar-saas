"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function archiveProjectFiles(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true }
  });

  if (!project) {
    return { archived: 0, failed: 0, errors: ["Project not found"] };
  }

  const files = await prisma.projectFile.findMany({
    where: {
      projectId: projectId,
      isArchived: false
    }
  });

  let archived = 0;
  let failed = 0;
  let errors: string[] = [];

  const archivePromises = files.map(async (file) => {
    try {
      // Safely resolve the URL whether it's in the new fileUrl field or legacy content field
      let targetUrl = file.fileUrl;
      if (!targetUrl && file.content && file.content.startsWith('http')) {
          targetUrl = file.content;
      }

      // If it's pure base64 (no URL), we can't 'fetch' it, so we skip it (it's already in DB anyway)
      if (!targetUrl || !targetUrl.startsWith('http')) {
          console.log(`Skipping non-URL file: ${file.name}`);
          return { status: 'skipped', name: file.name };
      }

      const response = await fetch(`${process.env.BRIDGE_AGENT_URL}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bridge-secret": process.env.BRIDGE_SECRET || ""
        },
        body: JSON.stringify({
          projectId: project.id,
          projectName: project.name,
          fileName: file.name,
          fileUrl: targetUrl,
          utFileKey: file.utFileKey || "",
          category: file.category
        })
      });

      if (!response.ok) {
        throw new Error(`Bridge Agent returning ${response.status}`);
      }

      // We determine the local path exactly like the bridge agent does.
      let categoryFolder = "General";
      switch(file.category) {
          case "LIAISONING": categoryFolder = "Liaisoning"; break;
          case "TECHNICAL": categoryFolder = "Technical"; break;
          case "COMMERCIAL": categoryFolder = "Commercial"; break;
          case "HANDOVER_SHEET": categoryFolder = "Handover Sheet"; break;
      }

      const sanitizedProjectName = project.name.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
      const newLocalUrl = `${process.env.BRIDGE_AGENT_URL}/files/${encodeURIComponent(sanitizedProjectName)}/${encodeURIComponent(categoryFolder)}/${encodeURIComponent(file.name)}`;

      await prisma.projectFile.update({
        where: { id: file.id },
        data: {
          isArchived: true,
          fileUrl: newLocalUrl
        }
      });

      console.log(`Archived: ${file.name}`);
      return { status: 'archived', name: file.name };
    } catch (error: any) {
      console.error(`Failed to archive ${file.name}:`, error);
      throw new Error(`${file.name}: ${error.message}`);
    }
  });

  const results = await Promise.allSettled(archivePromises);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.status === 'archived') archived++;
    } else {
      failed++;
      errors.push(result.reason.message);
    }
  }

  revalidatePath('/dashboard');
  return { archived, failed, errors };
}

export async function getArchiveStatus(projectId: string) {
  const [total, archived] = await Promise.all([
    prisma.projectFile.count({ where: { projectId } }),
    prisma.projectFile.count({ where: { projectId, isArchived: true } })
  ]);

  return { 
    total, 
    archived, 
    pending: total - archived 
  };
}
