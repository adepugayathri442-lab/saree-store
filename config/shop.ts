/**
 * Centralized Boutique Configuration for SaiSrujana
 *
 * Real business details for SaiSrujana, Armoor.
 * All contact, address, maps, and branding details are centralized here.
 */

export interface ShopConfig {
  brandName: string;
  tagline: string;
  contactPerson: string;
  phone: string;
  phoneFormatted: string;
  whatsappNumber: string;
  whatsappNumberFormatted: string;
  email: string;
  address: string;
  cityState: string;
  googleMapsUrl: string;
  showroomLocation: {
    latitude: number;
    longitude: number;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
  instagramUsername: string;
  instagramHandle: string;
  instagramUrl: string;
  announcement: string;
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    featuredSareeTag: string;
    featuredSareeName: string;
    featuredSareeDetails: string;
    featuredSareeStartingPrice: string;
  };
  about: {
    title: string;
    subtitle: string;
    story: string;
  };
}

export const SHOP_CONFIG: ShopConfig = {
  brandName: "SaiSrujana",
  tagline: "Crafting Grace in Every Thread",
  contactPerson: "Gangadhar",
  phone: "9948534351",
  phoneFormatted: "+91 99485 34351",
  whatsappNumber: "9948534351",
  whatsappNumberFormatted: "+91 99485 34351",
  email: "adepugangadhar1981@gmail.com",
  address: "Armoor, Nizamabad, Telangana, India",
  cityState: "Armoor, Nizamabad, Telangana",
  googleMapsUrl: "https://maps.app.goo.gl/Se1h2v3PRchM7E5PA",
  showroomLocation: {
    latitude: 18.7904,
    longitude: 78.2933,
    city: "Armoor",
    district: "Nizamabad",
    state: "Telangana",
    pincode: "503224",
  },
  instagramUsername: "@saisrujana_collections",
  instagramHandle: "saisrujana_collections",
  instagramUrl: "https://www.instagram.com/saisrujana_collections/",
  announcement: "Welcome to SaiSrujana | Pattu, Fancy & Daily Wear Sarees | Armoor, Nizamabad",
  hero: {
    badge: "Saree Store • Armoor",
    headline: "Timeless Sarees,",
    subheadline: "Woven With Tradition",
    description:
      "Welcome to SaiSrujana, your saree store in Armoor, Nizamabad, offering a fine collection of Pattu Sarees (Heritage Silks), Fancy Sarees (Contemporary Elegance), and Daily Wear Sarees (Everyday Grace).",
    primaryCta: "Explore Sarees",
    secondaryCta: "Shop by Collection",
    featuredSareeTag: "Featured Collection",
    featuredSareeName: "Pattu, Fancy & Daily Wear Sarees",
    featuredSareeDetails: "Armoor, Nizamabad, Telangana",
    featuredSareeStartingPrice: "Available on Inquiry",
  },
  about: {
    title: "About SaiSrujana",
    subtitle: "Crafting Grace in Every Thread",
    story:
      "SaiSrujana is a saree store located in Armoor, Nizamabad, Telangana, managed by Gangadhar. We offer a curated collection of Pattu Sarees, Fancy Sarees, and Daily Wear Sarees to meet your festive, celebratory, and day-to-day requirements. Whether you visit our physical store in Armoor or connect with us on WhatsApp, we provide direct, attentive assistance for all your saree needs.",
  },
};

/**
 * Generate an official WhatsApp URL for SaiSrujana using Gangadhar's real number (9948534351).
 */
export function getWhatsAppUrl(customMessage: string): string {
  const digitsOnly = SHOP_CONFIG.whatsappNumber.replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(customMessage);

  // If number is 10 digits without country code, prepend 91 for India
  const fullNumber = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;

  return `https://wa.me/${fullNumber}?text=${encodedText}`;
}

/**
 * Safe currency formatter supporting both numerical values and placeholder strings.
 */
export function formatCurrency(price: number | string | undefined): string {
  if (price === undefined || price === null || price === "") {
    return "Available on Inquiry";
  }
  if (typeof price === "number") {
    return `₹${price.toLocaleString("en-IN")}`;
  }
  if (price.startsWith("₹")) {
    return price;
  }
  return price;
}
