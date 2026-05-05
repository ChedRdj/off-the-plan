import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/public";
import type { JournalArticle, JournalCategory } from "@/types/journal";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "News & Events | Off The Plan",
  description: "The latest property news, market updates, guides and editorial from Off The Plan.",
};

const categories: (JournalCategory | "All")[] = ["All", "Editorial", "Market", "Interview", "Guide"];

const categoryColors: Record<string, string> = {
  Editorial: "text-orange",
  Market:    "text-navy",
  Interview: "text-ink",
  Guide:     "text-ink/60",
};

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

interface NewsPageProps {
  searchParams: { category?: string };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const activeCategory = searchParams.category as JournalCategory | undefined;

  let query = supabase
    .from("journal_articles")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (activeCategory) {
    query = query.eq("category", activeCategory);
  }

  const { data } = await query;
  const articles = (data ?? []) as unknown as JournalArticle[];

  const featured = articles.slice(0, 3);
  const secondary = articles.slice(3, 6);
  const list = articles.slice(6);

  return (
    <div className="min-h-screen bg-[#f5f4f1] pt-16">

      {/* ── Hero ── */}
      <section className="bg-[#eeecea] border-b border-line py-10">
        <div className="container-padded">
          <h1 className="font-mono text-[2rem] uppercase tracking-[0.18em] text-navy font-medium">
            News
          </h1>
        </div>
      </section>

      {/* ── Category tabs ── */}
      <div className="border-b border-line bg-[#f5f4f1] sticky top-16 z-20">
        <div className="container-padded flex gap-0 overflow-x-auto">
          {categories.map((cat) => {
            const isActive = (!activeCategory && cat === "All") || cat === activeCategory;
            return (
              <Link
                key={cat}
                href={cat === "All" ? "/news" : `/news?category=${cat}`}
                className={`font-mono text-[11px] uppercase tracking-widest px-5 py-3.5 border-b-2 flex-shrink-0 transition-colors ${
                  isActive
                    ? "border-orange text-navy"
                    : "border-transparent text-ink/40 hover:text-ink"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="container-padded py-12">

        {articles.length === 0 ? (
          <p className="font-sans text-body-md text-ink/40 text-center py-16">
            No articles in this category yet.
          </p>
        ) : (
          <>
            {/* ── Section label ── */}
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-navy font-semibold mb-8">
              Latest Property News
            </p>

            {/* ── Featured top 3 ── */}
            {featured.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {featured.map((article) => (
                  <div key={article.id} className="flex flex-col bg-white border border-line">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-navy/10 flex-shrink-0">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/60" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-mono text-[10px] uppercase tracking-widest font-semibold ${categoryColors[article.category] ?? "text-ink/60"}`}>
                          {article.category}
                        </span>
                        {article.read_time_minutes && (
                          <>
                            <span className="text-ink/20">·</span>
                            <span className="font-mono text-[10px] text-ink/40">
                              {article.read_time_minutes} min read
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="font-sans font-semibold text-navy text-[0.95rem] leading-snug mb-2">
                        {article.title}
                      </h3>

                      {article.published_at && (
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-3">
                          {formatDate(article.published_at)}
                        </p>
                      )}

                      {article.body_html && (
                        <p className="font-sans text-[13px] text-ink/60 leading-relaxed mb-4 line-clamp-3">
                          {stripHtml(article.body_html)}
                        </p>
                      )}

                      <div className="mt-auto">
                        <Link
                          href={`/journal/${article.slug}`}
                          className="inline-block font-mono text-[10px] uppercase tracking-widest px-5 py-2 bg-navy text-white hover:bg-orange transition-colors"
                        >
                          Read More
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Secondary row of 3 ── */}
            {secondary.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {secondary.map((article) => (
                  <div key={article.id} className="flex flex-col bg-white border border-line">
                    <div className="relative h-40 overflow-hidden bg-navy/10 flex-shrink-0">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/60" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      {article.published_at && (
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-1">
                          {formatDate(article.published_at)}
                        </p>
                      )}
                      <h3 className="font-sans font-semibold text-navy text-[0.9rem] leading-snug mb-4 flex-1">
                        {article.title}
                      </h3>
                      <Link
                        href={`/journal/${article.slug}`}
                        className="inline-block font-mono text-[10px] uppercase tracking-widest px-5 py-2 bg-navy text-white hover:bg-orange transition-colors self-start"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── List format for remaining articles ── */}
            {list.length > 0 && (
              <div className="flex flex-col divide-y divide-line border-t border-line mb-10">
                {list.map((article) => (
                  <div key={article.id} className="flex gap-5 py-5 bg-white px-4">
                    {/* Thumbnail */}
                    <div className="relative w-28 h-20 flex-shrink-0 overflow-hidden bg-navy/10">
                      {article.hero_image_url ? (
                        <Image
                          src={article.hero_image_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/60" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      {article.published_at && (
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-1">
                          {formatDate(article.published_at)}
                        </p>
                      )}
                      <h3 className="font-sans font-semibold text-navy text-[0.9rem] leading-snug mb-3">
                        {article.title}
                      </h3>
                      <Link
                        href={`/journal/${article.slug}`}
                        className="inline-block font-mono text-[10px] uppercase tracking-widest px-5 py-1.5 bg-navy text-white hover:bg-orange transition-colors self-start"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Partner banner ── */}
      <div className="container-padded pb-14 px-16 md:px-24">
        <Image
          src="/off-the-plan-banner-landscape.png"
          alt="Off The Plan Partner Network"
          width={1200}
          height={200}
          className="w-full h-auto object-contain"
        />
      </div>

    </div>
  );
}
