import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saisrujana.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sarees", "/sarees/*"],
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/account/*",
          "/cart",
          "/login",
          "/signup",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
