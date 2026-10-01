"use server";

import { revalidatePath } from "next/cache";

/**
 * Server Action to immediately invalidate Next.js caches when a saree is deleted or updated.
 * Ensures the customer-facing website reflects changes immediately without serving stale cached pages.
 */
export async function revalidateSareeCache(sareeIdOrSku?: string) {
  try {
    // 1. Invalidate homepage layout and page (Navbar, Hero, Featured, New Arrivals, Best Sellers, Collections, Occasions)
    revalidatePath("/", "layout");
    revalidatePath("/");

    // 2. Invalidate Saree Catalogue page
    revalidatePath("/sarees");

    // 3. Invalidate specific product page and the dynamic route pattern
    if (sareeIdOrSku && sareeIdOrSku.trim()) {
      const clean = sareeIdOrSku.trim();
      revalidatePath(`/sarees/${clean}`);
    }
    revalidatePath("/sarees/[id]", "page");

    // 4. Invalidate Admin catalogue
    revalidatePath("/admin/sarees");

    // 5. Invalidate Sitemap
    revalidatePath("/sitemap.xml");

    return { success: true };
  } catch (err) {
    console.error("Failed to revalidate saree cache:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
