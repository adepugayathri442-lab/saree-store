import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sareeIdOrSku = body.id || body.sku;

    // 1. Revalidate homepage
    revalidatePath("/", "layout");
    revalidatePath("/");

    // 2. Revalidate catalogue
    revalidatePath("/sarees");

    // 3. Revalidate product details
    if (sareeIdOrSku && typeof sareeIdOrSku === "string") {
      revalidatePath(`/sarees/${sareeIdOrSku.trim()}`);
    }
    revalidatePath("/sarees/[id]", "page");

    // 4. Revalidate admin catalogue
    revalidatePath("/admin/sarees");

    // 5. Revalidate sitemap
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      revalidated: true,
      timestamp: Date.now(),
      target: sareeIdOrSku || "all",
    });
  } catch (err) {
    console.error("API revalidation error:", err);
    return NextResponse.json(
      { error: "Failed to revalidate cache" },
      { status: 500 }
    );
  }
}
