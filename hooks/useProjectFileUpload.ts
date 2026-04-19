import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { uploadProjectFile } from "@/app/actions/project";
import { toast } from "sonner";
import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export function useProjectFileUpload() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  
  // High-performance tracker for dynamic execution metadata natively bypassing async React state queues
  const uploadMeta = useRef({ 
    projectId: "", 
    category: "GENERAL" as "GENERAL" | "TECHNICAL" | "LIAISONING" | "COMMERCIAL" | "HANDOVER_SHEET" | "EXECUTION", 
    fileId: null as string | null,
    onSuccess: null as ((files: any[]) => void) | null
  });

  const { startUpload, isUploading: isUTUploading } = useUploadThing("projectFileUploader", {
    onUploadProgress: (p) => {
      setStatus(""); // Clear optimization status once actual upload starts
      setProgress(p);
    },
    onClientUploadComplete: async (res) => {
      console.log("Handoff upload complete:", res);
      if (!res || res.length === 0) return;
      
      const { projectId, category, fileId, onSuccess } = uploadMeta.current;
      
      const savedFiles = [];
      for (const uploaded of res) {
         // CRITICAL: prioritize ufsUrl as requested by pipeline optimization
         const fileUrl = (uploaded as any).ufsUrl || uploaded.url;
         const utFileKey = uploaded.key;
         const fileName = uploaded.name;
         
         console.log(`Saving to DB - fileUrl: ${fileUrl} for project: ${projectId}`);
         
         const formData = new FormData();
         formData.append("projectId", projectId);
         formData.append("name", fileName);
         formData.append("category", category); 
         formData.append("content", "");
         if (fileUrl) formData.append("fileUrl", fileUrl);
         if (utFileKey) formData.append("utFileKey", utFileKey);
         if (fileId) formData.append("id", fileId);

         const savedFile = await uploadProjectFile(formData);
         savedFiles.push(savedFile);
         console.log("Successfully saved fileUrl:", fileUrl);
      }
      
      if (onSuccess) {
        onSuccess(savedFiles);
      }
      
      setProgress(0);
      setStatus("");
      toast.success("File uploaded securely");
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setProgress(0);
      setStatus("");
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const [isCompressing, setIsCompressing] = useState(false);

  const compressFile = async (file: File): Promise<File> => {
    const originalSize = file.size;
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      // 1. IMAGE COMPRESSION (JPG, PNG, WEBP)
      if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
        if (originalSize < 500 * 1024) return file; // Skip if < 500KB

        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          initialQuality: 0.8,
        };
        const compressedBlob = await imageCompression(file, options);
        const compressedFile = new File([compressedBlob], file.name, {
          type: file.type,
          lastModified: Date.now(),
        });
        
        logCompressionResult(file.name, originalSize, compressedFile.size);
        return compressedFile;
      }

      // 2. PDF COMPRESSION
      if (extension === 'pdf') {
        if (originalSize < 1024 * 1024) return file; // Skip if < 1MB

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { updateMetadata: false });
        // Use object streams for more efficient encoding
        const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
        
        const compressedFile = new File([compressedBytes] as BlobPart[], file.name, {
          type: 'application/pdf',
          lastModified: Date.now(),
        });

        logCompressionResult(file.name, originalSize, compressedFile.size);
        return compressedFile;
      }
    } catch (err) {
      console.error(`Silent compression failure for ${file.name}:`, err);
    }

    return file; // Fallback to original uncompressed file
  };

  const logCompressionResult = (name: string, original: number, compressed: number) => {
    const reduction = ((original - compressed) / original * 100).toFixed(1);
    const originMB = (original / (1024 * 1024)).toFixed(2);
    const compMB = (compressed / (1024 * 1024)).toFixed(2);
    console.log(`[Compression] ${name}: ${originMB}MB → ${compMB}MB (${reduction}% reduction)`);
  };

  const uploadFiles = async (
    projectId: string, 
    files: File[], 
    category: "GENERAL" | "TECHNICAL" | "LIAISONING" | "COMMERCIAL" | "HANDOVER_SHEET" | "EXECUTION" = "GENERAL",
    fileId: string | null = null,
    onSuccess?: (files: any[]) => void,
    customStage: string | null = null
  ) => {
    uploadMeta.current = { projectId, category, fileId, onSuccess: onSuccess || null };
    setProgress(0);
    
    // STEP: Pre-processing Compression
    setIsCompressing(true);
    setStatus("Optimizing file...");
    
    const processedFiles = await Promise.all(files.map(f => compressFile(f)));
    
    setIsCompressing(false);
    return await startUpload(processedFiles, { projectId, category, stage: customStage || undefined });
  };

  return { 
    uploadFiles, 
    isUploading: isUTUploading || isCompressing, 
    progress, 
    status 
  };
}
