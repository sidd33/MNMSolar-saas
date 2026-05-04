import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    const body = await req.json();
    const logPath = path.join(process.cwd(), 'scratch', 'client_debug.log');
    const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(body)}\n`;
    fs.appendFileSync(logPath, logEntry);
    console.log("DEBUG LOG:", body);
    return NextResponse.json({ ok: true });
}
