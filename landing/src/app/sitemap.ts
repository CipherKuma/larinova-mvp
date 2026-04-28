import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";
import { getAllPosts } from "@/lib/blog";
import { BLOG_POSTS_ID } from "@/data/blog-posts-id";

const ID_SLUGS = new Set(BLOG_POSTS_ID.map((p) => p.slug));

// Stable build-time date so search engines don't see the entire site
// "change" on every render. Bump manually only when the static page itself changes.
const BUILD_TIME_DATE = new Date("2026-04-28");

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const blogEntries = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    priority: 0.7 as const,
    alternates: {
      languages: {
        [ID_SLUGS.has(post.slug) ? "id" : "en-IN"]:
          `${SITE_URL}/blog/${post.slug}`,
      },
    },
  }));

  return [
    {
      url: SITE_URL,
      lastModified: BUILD_TIME_DATE,
      priority: 1,
      alternates: {
        languages: {
          "en-IN": `${SITE_URL}/in`,
          id: `${SITE_URL}/id`,
          "x-default": `${SITE_URL}/in`,
        },
      },
    },
    {
      url: `${SITE_URL}/in`,
      lastModified: BUILD_TIME_DATE,
      priority: 0.9,
      alternates: {
        languages: {
          "en-IN": `${SITE_URL}/in`,
          id: `${SITE_URL}/id`,
          "x-default": `${SITE_URL}/in`,
        },
      },
    },
    {
      url: `${SITE_URL}/id`,
      lastModified: BUILD_TIME_DATE,
      priority: 0.9,
      alternates: {
        languages: {
          "en-IN": `${SITE_URL}/in`,
          id: `${SITE_URL}/id`,
          "x-default": `${SITE_URL}/in`,
        },
      },
    },
    {
      url: `${SITE_URL}/in/discovery-survey`,
      lastModified: BUILD_TIME_DATE,
      priority: 0.7,
      alternates: {
        languages: {
          "en-IN": `${SITE_URL}/in/discovery-survey`,
          id: `${SITE_URL}/id/discovery-survey`,
          "x-default": `${SITE_URL}/in/discovery-survey`,
        },
      },
    },
    {
      url: `${SITE_URL}/id/discovery-survey`,
      lastModified: BUILD_TIME_DATE,
      priority: 0.7,
      alternates: {
        languages: {
          "en-IN": `${SITE_URL}/in/discovery-survey`,
          id: `${SITE_URL}/id/discovery-survey`,
          "x-default": `${SITE_URL}/in/discovery-survey`,
        },
      },
    },
    { url: `${SITE_URL}/blog`, lastModified: BUILD_TIME_DATE, priority: 0.8 },
    { url: `${SITE_URL}/book`, lastModified: BUILD_TIME_DATE, priority: 0.6 },
    ...blogEntries,
  ];
}
