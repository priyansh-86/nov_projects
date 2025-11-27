// src/app/api/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    const tokenFromUrl = searchParams.get("token"); // Token from VLC URL

    let accessToken = tokenFromUrl;

    // Agar URL me token nahi hai, to Session check karo (Browser play ke liye)
    if (!accessToken) {
        const session: any = await getServerSession(authOptions);
        if (session?.accessToken) {
            accessToken = session.accessToken;
        }
    }

    // Agar abhi bhi token nahi mila, to block karo
    if (!accessToken) {
      return new NextResponse("Unauthorized: No token provided", { status: 401 });
    }

    if (!fileId) return new NextResponse("File ID missing", { status: 400 });

    // Range Header (VLC seeking ke liye bahut zaroori hai)
    const range = req.headers.get("range");

    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    
    const fetchHeaders: any = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (range) {
      fetchHeaders["Range"] = range;
    }

    const response = await fetch(driveUrl, { headers: fetchHeaders });

    if (!response.ok) {
        return new NextResponse(response.statusText, { status: response.status });
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");
    
    if (response.headers.get("Content-Length")) {
      headers.set("Content-Length", response.headers.get("Content-Length")!);
    }
    if (response.headers.get("Content-Range")) {
      headers.set("Content-Range", response.headers.get("Content-Range")!);
    }
    
    headers.set("Accept-Ranges", "bytes");

    return new NextResponse(response.body, {
      status: response.status === 206 ? 206 : 200,
      headers,
    });

  } catch (error) {
    console.error("Stream Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}