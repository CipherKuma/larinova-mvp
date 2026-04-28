import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug, getAllPosts } from "@/lib/blog";
import {
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/structured-data";
import { SITE_URL, SITE_NAME } from "@/lib/metadata";
import { BLOG_POSTS_ID } from "@/data/blog-posts-id";

const ID_SLUGS = new Set(BLOG_POSTS_ID.map((p) => p.slug));
import { BlogHeader } from "@/components/blog/BlogHeader";
import { BlogContent } from "@/components/blog/BlogContent";
import { BlogCard } from "@/components/blog/BlogCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const isId = ID_SLUGS.has(post.slug);
  const ogLocale = isId ? "id_ID" : "en_IN";

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: SITE_NAME,
      locale: ogLocale,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      images: [
        {
          url: `${SITE_URL}${post.image}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`${SITE_URL}${post.image}`],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = generateArticleJsonLd(post);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
  ]);
  const allPosts = getAllPosts();
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <BlogHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen pt-28 pb-24">
        {/* Post header */}
        <article className="mx-auto max-w-3xl px-6">
          <div className="mb-8">
            <span className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
              {post.tag}
            </span>
            <h1 className="mb-4 font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 font-mono text-[12px] text-muted-foreground">
              <span>{post.author}</span>
              <span className="text-white/20">|</span>
              <span>{post.date}</span>
              <span className="text-white/20">|</span>
              <span>{post.readingTime}</span>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative mb-12 aspect-[2/1] w-full overflow-hidden rounded-xl">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          </div>

          {/* Content */}
          <BlogContent sections={post.content} />
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="mx-auto mt-24 max-w-7xl px-6">
            <div className="mb-8 border-t border-white/[0.06] pt-12">
              <span className="mb-3 inline-block font-mono text-xs uppercase tracking-widest text-primary">
                Keep reading
              </span>
              <h2 className="font-display text-2xl font-bold text-foreground">
                More from Larinova
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
