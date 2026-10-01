import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SareeDetailView from "@/components/SareeDetailView";
import { getSareeById, getRelatedSarees } from "@/data/sarees";
import { fetchSareeByIdFromDb, fetchSareesFromDb } from "@/lib/supabase/sarees";
import { fetchReviewStatsBySareeId } from "@/lib/supabase/reviews";
import { SHOP_CONFIG } from "@/config/shop";
import { Saree } from "@/types/saree";

interface SareePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saisrujana.com";

export async function generateMetadata({
  params,
}: SareePageProps): Promise<Metadata> {
  const { id } = await params;
  let saree = await fetchSareeByIdFromDb(id);

  if (!saree && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    saree = getSareeById(id) || null;
  }

  if (!saree) {
    return {
      title: `Saree Not Found | ${SHOP_CONFIG.brandName}`,
    };
  }

  const priceText =
    typeof saree.price === "number" && saree.price > 0
      ? `₹${saree.price.toLocaleString("en-IN")}`
      : "Available on Inquiry";

  const isAvailable = saree.stockStatus !== "Out of Stock" && (saree.stockQuantity === undefined || saree.stockQuantity > 0);
  const availabilityText = isAvailable ? "In Stock" : "Out of Stock";

  const allImages = [saree.image, ...(saree.gallery || [])].filter(Boolean);

  return {
    title: `${saree.name} (${saree.categoryLabel}) - ${priceText} | ${SHOP_CONFIG.brandName}`,
    description: `${saree.name} (SKU: ${saree.sku}) in ${saree.color || "luxurious shade"}. Fabric: ${saree.fabric}, Craft: ${saree.craft}, Zari: ${saree.zariType}. Price: ${priceText} (${availabilityText}). Authentic saree boutique in Armoor, Nizamabad.`,
    keywords: [
      saree.name,
      saree.categoryLabel,
      saree.fabric,
      saree.craft,
      saree.color,
      saree.sku,
      "SaiSrujana Armoor",
      "Sarees in Nizamabad",
      "Handloom Saree Telangana",
    ],
    alternates: {
      canonical: `/sarees/${saree.id}`,
    },
    openGraph: {
      type: "website",
      url: `${siteUrl}/sarees/${saree.id}`,
      title: `${saree.name} (${saree.categoryLabel}) | ${SHOP_CONFIG.brandName}`,
      description: `${saree.description} Price: ${priceText} • Armoor, Nizamabad.`,
      images: allImages.map((img) => ({
        url: img,
        alt: `${saree.name} - ${SHOP_CONFIG.brandName}`,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${saree.name} | ${SHOP_CONFIG.brandName}`,
      description: `${saree.name} (SKU: ${saree.sku}) - Price: ${priceText}. Fabric: ${saree.fabric}, Craft: ${saree.craft}.`,
      images: [saree.image],
    },
  };
}

export default async function SareeDetailPage({ params }: SareePageProps) {
  const { id } = await params;
  let saree = await fetchSareeByIdFromDb(id);

  if (!saree && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    saree = getSareeById(id) || null;
  }

  if (!saree) {
    notFound();
  }

  const [dbSarees, reviewStats] = await Promise.all([
    fetchSareesFromDb(),
    fetchReviewStatsBySareeId(saree.id),
  ]);

  let relatedSarees: Saree[] = [];
  if (dbSarees.length > 0) {
    const sameCategory = dbSarees.filter(
      (s) => s.id !== saree.id && s.category === saree.category
    );
    if (sameCategory.length >= 3) {
      relatedSarees = sameCategory.slice(0, 3);
    } else {
      const otherCategories = dbSarees.filter(
        (s) => s.id !== saree.id && s.category !== saree.category
      );
      relatedSarees = [...sameCategory, ...otherCategories].slice(0, 3);
    }
  } else if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    relatedSarees = getRelatedSarees(saree.id, saree.category, 3);
  }

  const isAvailable =
    saree.stockStatus !== "Out of Stock" &&
    (saree.stockQuantity === undefined || saree.stockQuantity > 0);

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: saree.name,
    image: [saree.image, ...(saree.gallery || [])].filter(Boolean),
    description: saree.description,
    sku: saree.sku,
    mpn: saree.sku,
    brand: {
      "@type": "Brand",
      name: SHOP_CONFIG.brandName,
    },
    category: saree.categoryLabel,
    color: saree.color,
    material: saree.fabric,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/sarees/${saree.id}`,
      priceCurrency: "INR",
      price: typeof saree.price === "number" ? saree.price : 0,
      priceValidUntil: "2027-12-31",
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SHOP_CONFIG.brandName,
      },
    },
  };

  if (reviewStats.totalReviews > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewStats.averageRating,
      reviewCount: reviewStats.totalReviews,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420]">
      {/* Product JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Sticky Responsive Navbar */}
      <Navbar />

      {/* Product Detail Main Content */}
      <main className="flex-1">
        <SareeDetailView saree={saree} relatedSarees={relatedSarees} />
      </main>

      {/* Professional Footer */}
      <Footer />
    </div>
  );
}
