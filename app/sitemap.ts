import { MetadataRoute } from "next";
import { fetchSareesFromDb } from "@/lib/supabase/sarees";
import { FEATURED_SAREES } from "@/data/sarees";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saisrujana.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch real sarees from Supabase database, fall back to initial data if DB is empty
  let sarees = await fetchSareesFromDb();
  if (!sarees || sarees.length === 0) {
    sarees = FEATURED_SAREES;
  }

  // Saree dynamic product pages
  const sareeEntries: MetadataRoute.Sitemap = sarees.map((saree) => ({
    url: `${siteUrl}/sarees/${saree.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Static core routes
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/sarees`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  return [...staticEntries, ...sareeEntries];
}
