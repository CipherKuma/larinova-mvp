"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { getAllPosts } from "@/lib/blog";
import { type Locale, content as localeContent } from "@/data/locale-content";

gsap.registerPlugin(ScrollTrigger);

interface BlogProps {
  locale: Locale;
}

export function Blog({ locale }: BlogProps) {
  const c = localeContent[locale].blog;
  const posts = getAllPosts(locale);
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cards = sectionRef.current?.querySelectorAll(".blog-card");
      if (!cards) return;
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          },
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="blog" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <span className="mb-4 inline-block font-mono text-xs uppercase tracking-widest text-primary">
              {c.sectionLabel}
            </span>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-4xl">
              {c.headline}
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary sm:flex"
          >
            {c.viewAll}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.title}
              href={`/blog/${post.slug}`}
              className="blog-card group overflow-hidden rounded-xl border border-white/[0.06] bg-card/30 transition-all hover:border-primary/20"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-full bg-primary/20 px-2.5 py-0.5 font-mono text-[10px] text-primary">
                  {post.tag}
                </span>
              </div>
              <div className="p-5">
                <p className="mb-2 font-mono text-[11px] text-muted-foreground">
                  {post.date}
                </p>
                <h3 className="mb-2 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/blog"
          className="mt-8 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary sm:hidden"
        >
          {c.viewAll}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
