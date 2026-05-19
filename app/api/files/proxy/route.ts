import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const orgId = (sessionClaims as any)?.publicMetadata?.orgId || (sessionClaims as any)?.org_id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get('fileId');
  const fallbackUrl = searchParams.get('url');

  let fileUrl = fallbackUrl;

  // Primary Security Path: Use fileId to verify org membership
  if (fileId) {
    if (!orgId) return new Response("Organization context required", { status: 403 });
    
    const fileRecord = await prisma.projectFile.findUnique({
      where: { id: fileId, organizationId: orgId }
    });

    if (!fileRecord) {
      return new Response("File not found or access denied", { status: 404 });
    }

    fileUrl = fileRecord.fileUrl || fileRecord.content;
  }

  if (!fileUrl) {
    return new Response("Missing file identifier", { status: 400 });
  }

  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
       return new Response("Failed to fetch file from origin", { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': 'inline'
      }
    });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
