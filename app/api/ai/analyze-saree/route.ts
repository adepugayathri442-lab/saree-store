import { NextRequest, NextResponse } from "next/server";
import { analyzeSareeImage } from "@/lib/ai/sareeAnalyzer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let base64Data = "";
    let mimeType = "image/jpeg";
    let filename = "";

    // Handle multipart/form-data (direct file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = (formData.get("file") || formData.get("image")) as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No image file provided in request." },
          { status: 400 }
        );
      }

      filename = file.name || "saree-photo.jpg";
      mimeType = file.type || "image/jpeg";

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Data = buffer.toString("base64");
    } else {
      // Handle application/json
      const body = await request.json().catch(() => ({}));

      if (body.imageBase64) {
        // Strip data:image/...;base64, prefix if present
        const raw = body.imageBase64 as string;
        const matches = raw.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = raw;
          mimeType = body.mimeType || "image/jpeg";
        }
        filename = body.filename || "";
      } else if (body.imageUrl) {
        // Fetch remote image URL (e.g. from Supabase Storage)
        const fetchRes = await fetch(body.imageUrl);
        if (!fetchRes.ok) {
          return NextResponse.json(
            { success: false, error: "Unable to retrieve image from provided URL." },
            { status: 400 }
          );
        }
        mimeType = fetchRes.headers.get("content-type") || "image/jpeg";
        const ab = await fetchRes.arrayBuffer();
        base64Data = Buffer.from(ab).toString("base64");
        filename = body.filename || body.imageUrl.split("/").pop() || "";
      } else {
        return NextResponse.json(
          { success: false, error: "Missing image data (file, imageBase64, or imageUrl required)." },
          { status: 400 }
        );
      }
    }

    if (!base64Data) {
      return NextResponse.json(
        { success: false, error: "Image data could not be processed." },
        { status: 400 }
      );
    }

    // Perform secure server-side multimodal image analysis
    const result = await analyzeSareeImage(
      base64Data,
      mimeType,
      filename
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("AI Saree Analysis API Error:", err);
    const msg = err instanceof Error ? err.message : "Failed to analyze saree image.";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
