"use server";

import { prisma } from "@/lib/prisma";

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

  for (const file of files) {
    try {
      // Safely resolve the URL whether it's in the new fileUrl field or legacy content field
      let targetUrl = file.fileUrl;
      if (!targetUrl && file.content && file.content.startsWith('http')) {
          targetUrl = file.content;
      }

      // If it's pure base64 (no URL), we can't 'fetch' it, so we skip it (it's already in DB anyway)
      if (!targetUrl || !targetUrl.startsWith('http')) {
          console.log(`Skipping non-URL file: ${file.name}`);
          continue;
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

      archived++;
      console.log(`Archived: ${file.name}`);
    } catch (error: any) {
      console.error(`Failed to archive ${file.name}:`, error);
      failed++;
      errors.push(`${file.name}: ${error.message}`);
    }
  }

  return { archived, failed, errors };
}

export async function getArchiveStatus(projectId: string) {
  const files = await prisma.projectFile.findMany({
    where: { projectId }
  });

  const archived = files.filter(f => f.isArchived).length;
  
  return { 
    total: files.length, 
    archived: archived, 
    pending: files.length - archived 
  };
}
