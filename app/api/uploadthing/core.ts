import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  projectFileUploader: f({ 
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    text: { maxFileSize: "16MB", maxFileCount: 10 },
    blob: { maxFileSize: "16MB", maxFileCount: 10 }
  })
    .input(z.object({ 
      projectId: z.string(),
      category: z.string(),
      stage: z.string().optional()
    }))
    .middleware(async ({ req, input }) => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      
      // Pass these to onUploadComplete via metadata
      return { 
        userId,
        projectId: input.projectId,
        category: input.category,
        stage: input.stage
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        
        return { 
          uploadedBy: metadata.userId, 
          fileUrl: file.url,
          projectId: metadata.projectId,
          category: metadata.category,
          stage: metadata.stage
        };
      } catch (error) {
        console.error("onUploadComplete execution error:", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
