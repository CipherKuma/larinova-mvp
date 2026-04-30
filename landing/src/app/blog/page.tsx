import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/blog-posts";
import { BLOG_POSTS_ID } from "@/data/blog-posts-id";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { SITE_NAME, SITE_URL } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Field notes",
  description:
    "Insights on building an end-to-end OPD platform for Indian and Indonesian doctors — patient booking, AI intake, code-mixed medical transcription (Tamil, Hindi, Bahasa), HIPAA-ready clinical workflows, and automated patient follow-up.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
    languages: {
      "en-IN": `${SITE_URL}/blog`,
      id: `${SITE_URL}/blog`,
      "x-default": `${SITE_URL}/blog`,
    },
  },
  openGraph: {
    title: "Field notes | Larinova",
    description:
      "Notes on building Larinova — the end-to-end OPD platform for doctors in India and Indonesia.",
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    locale: "en_IN",
    alternateLocale: ["id_ID"],
    type: "website",
  },
};

export default function BlogPage() {
  // Sort posts by date desc, lead post is the most recent across both locales.
  const enPosts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  const idPosts = [...BLOG_POSTS_ID].sort((a, b) => (a.date < b.date ? 1 : -1));
  const lead = enPosts[0];
  const enRest = enPosts.slice(1);

  return (
    <>
      <BlogHeader />
      <main className="relative min-h-screen pt-28 pb-24">
        {/* Ambient glow so the page isn't a flat dark void */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent"
        />
        <div className="mx-auto max-w-7xl px-6">
          {/* Editorial header — no redundant 'Blog' eyebrow on the /blog route */}
          <header className="mb-12 max-w-3xl">
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl text-balance">
              Field notes from <span className="text-gradient">Larinova</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg">
              Product updates, technical deep dives, and stories from the ground
              — across India and Indonesia.
            </p>
          </header>

          {/* Featured / lead post */}
          {lead && (
            <Link
              href={`/blog/${lead.slug}`}
              className="group mb-16 block overflow-hidden rounded-2xl border border-white/[0.08] bg-card/40 transition-all hover:border-primary/30"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
                <div className="relative aspect-[16/10] lg:aspect-auto">
                  <Image
                    src={lead.image}
                    alt={lead.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-card/10 to-transparent lg:bg-gradient-to-r" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                    Featured · EN
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-5 p-7 lg:p-12">
                  <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">
                    <span className="text-primary">{lead.tag}</span>
                    <span aria-hidden>·</span>
                    <span>{lead.date}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary md:text-4xl text-balance">
                    {lead.title}
                  </h2>
                  <p className="text-[15px] leading-relaxed text-foreground/70">
                    {lead.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Read the post
                    <svg
                      aria-hidden
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M13 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* English posts */}
          {enRest.length > 0 && (
            <section id="en" className="mb-20 scroll-mt-28">
              <SectionLabel
                primary="More posts"
                secondary={`English · ${enRest.length}`}
              />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {enRest.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Indonesian posts — clearly separated */}
          {idPosts.length > 0 && (
            <section id="id" className="scroll-mt-28">
              <SectionLabel
                primary="Catatan dari Indonesia"
                secondary={`Bahasa · ${idPosts.length}`}
              />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {idPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state safety net */}
          {enPosts.length === 0 && idPosts.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-card/40 p-10 text-center">
              <h3 className="font-display text-2xl font-bold text-foreground">
                Nothing published yet
              </h3>
              <p className="mt-3 text-sm text-foreground/65">
                We&apos;re heads-down building. Updates land here once a week.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function SectionLabel({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4 border-b border-white/[0.06] pb-4">
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
        {primary}
      </h2>
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/45">
        {secondary}
      </span>
    </div>
  );
}
