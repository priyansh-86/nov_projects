// src/app/api/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    if (!fileId) return new NextResponse("File ID missing", { status: 400 });

    // 1. Browser se pucho: "Kitna data chahiye?" (Range Header)
    const range = req.headers.get("range");

    // 2. Google Drive se data maango (With Range support)
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    
    // Agar Range hai, toh Google ko bhi wahi Range bhejo
    const fetchHeaders: any = {
      Authorization: `Bearer ${session.accessToken}`,
    };
    if (range) {
      fetchHeaders["Range"] = range;
    }

    const response = await fetch(driveUrl, { headers: fetchHeaders });

    if (!response.ok) {
        // Agar Google ne error diya
        return new NextResponse(response.statusText, { status: response.status });
    }

    // 3. Response Headers prepare karo
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");
    
    // Important: Content-Length aur Content-Range forward karna zaroori hai
    if (response.headers.get("Content-Length")) {
      headers.set("Content-Length", response.headers.get("Content-Length")!);
    }
    if (response.headers.get("Content-Range")) {
      headers.set("Content-Range", response.headers.get("Content-Range")!);
    }
    
    // Accept-Ranges batata hai ki hum seeking support karte hain
    headers.set("Accept-Ranges", "bytes");

    // 4. Stream return karo (Status 206 for Partial Content is crucial for video)
    return new NextResponse(response.body, {
      status: response.status === 206 ? 206 : 200,
      headers,
    });

  } catch (error) {
    console.error("Stream Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}