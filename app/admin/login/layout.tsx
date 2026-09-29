import type { Metadata } from "next";
import { SHOP_CONFIG } from "@/config/shop";

export const metadata: Metadata = {
  title: `Admin Login | ${SHOP_CONFIG.brandName} Saree Store`,
  description: `Secure administrative authentication portal for ${SHOP_CONFIG.brandName}, Armoor.`,
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
