import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { WhatsAppChatProvider } from "@/context/WhatsAppChatContext";
import WhatsAppChatButton from "@/components/WhatsAppChatButton";
import { SHOP_CONFIG } from "@/config/shop";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saisrujana.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SHOP_CONFIG.brandName} | Authentic Pattu, Fancy & Daily Wear Sarees • Armoor`,
    template: `%s | ${SHOP_CONFIG.brandName}, Armoor`,
  },
  description: `${SHOP_CONFIG.brandName} Saree Boutique in Armoor, Nizamabad, Telangana. Handpicked collections of Pattu Sarees (Heritage Silks), Fancy Sarees (Contemporary Elegance), and Daily Wear Sarees (Everyday Grace) managed by Gangadhar. Direct WhatsApp enquiry & showroom visits.`,
  keywords: [
    "SaiSrujana",
    "SaiSrujana Saree Store",
    "Sarees in Armoor",
    "Pattu Sarees Armoor",
    "Pure Silk Sarees Nizamabad",
    "Fancy Sarees Telangana",
    "Bridal Sarees Armoor",
    "Handloom Sarees Telangana",
    "Daily Wear Sarees",
    "Heritage Silks",
    "Contemporary Elegance",
    "Everyday Grace",
    "Gangadhar Sarees",
  ],
  authors: [{ name: `${SHOP_CONFIG.brandName} • Gangadhar` }],
  creator: SHOP_CONFIG.brandName,
  publisher: SHOP_CONFIG.brandName,
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: SHOP_CONFIG.brandName,
    title: `${SHOP_CONFIG.brandName} | Handcrafted Sarees • Armoor, Nizamabad`,
    description: `Discover timeless Pattu, Fancy & Daily Wear Sarees at ${SHOP_CONFIG.brandName} in Armoor, Telangana. Connect directly on WhatsApp (+91 99485 34351) for live video drape inquiries.`,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${SHOP_CONFIG.brandName} Saree Boutique Armoor`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SHOP_CONFIG.brandName} | Handcrafted Sarees • Armoor, Telangana`,
    description: `Browse authentic Pattu, Fancy, and Daily wear sarees at ${SHOP_CONFIG.brandName} in Armoor, Nizamabad.`,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: SHOP_CONFIG.brandName,
  description: `${SHOP_CONFIG.brandName} is a premier saree boutique in Armoor, Nizamabad, Telangana offering handpicked Pattu Sarees, Fancy Sarees, and Daily Wear Sarees.`,
  url: siteUrl,
  telephone: "+919948534351",
  email: SHOP_CONFIG.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Armoor Main Road",
    addressLocality: "Armoor",
    addressRegion: "Telangana",
    postalCode: "503224",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 18.7915,
    longitude: 78.2917,
  },
  hasMap: SHOP_CONFIG.googleMapsUrl,
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: "Cash, UPI, Bank Transfer",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "09:30",
      closes: "21:30",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2420] antialiased selection:bg-[#B33939] selection:text-white">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <WhatsAppChatProvider>
                {children}
                <WhatsAppChatButton />
              </WhatsAppChatProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
