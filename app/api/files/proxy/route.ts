import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return new Response("Missing URL parameter", { status: 400 });
  }

  try {
    const headers: Record<string, string> = {};
    if (process.env.UPLOADTHING_TOKEN) {
       // Optional: pass token if ACL requires it
       // headers['Authorization'] = `Bearer ${process.env.UPLOADTHING_TOKEN}`;
    }

    const response = await fetch(fileUrl, { headers });

    if (!response.ok) {
       return new Response("Failed to fetch file securely from origin", { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': 'inline'
      }
    });
  } catch (error) {
    return new Response("Internal Server Error fetching file", { status: 500 });
  }
}
