import type { MetadataRoute } from "next";

const BASE_URL = "https://app.larinova.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["in", "id"];

  // Only public pages should be in the sitemap
  const publicPaths = ["/sign-in", "/sign-up"];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of publicPaths) {
    entries.push({
      url: `${BASE_URL}/in${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: Object.fromEntries(
          locales.map((locale) => [locale, `${BASE_URL}/${locale}${path}`]),
        ),
      },
    });
  }

  return entries;
}
