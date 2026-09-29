import type { Metadata } from "next";
import { SHOP_CONFIG } from "@/config/shop";

export const metadata: Metadata = {
  title: `Admin Portal | ${SHOP_CONFIG.brandName} Saree Store`,
  description: `Administrative management portal for ${SHOP_CONFIG.brandName}, Armoor.`,
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
