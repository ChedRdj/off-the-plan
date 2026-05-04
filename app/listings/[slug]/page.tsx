import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { EnquiryForm } from "@/components/enquiry-form";
import { Pill } from "@/components/pill";
import { HeroCarousel } from "@/components/hero-carousel";
import { PropertiesTable } from "@/components/properties-table";
import { ReadMore } from "@/components/read-more";
import { CheckIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase/public";
import { formatPrice } from "@/lib/utils";
import type { Development, DevelopmentFloorPlan } from "@/types/development";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: dev } = await supabase
    .from("developments")
    .select("name, suburb, state, summary, hero_image_url, images:development_images(*)")
    .eq("slug", params.slug)
    .single();
  if (!dev) return { title: "Not Found" };
  const d = dev as unknown as Development;
  return {
    title: `${d.name} — ${d.suburb}, ${d.state}`,
    description: d.summary ?? undefined,
    openGraph: {
      title: `${d.name} | Off The Plan`,
      description: d.summary ?? "",
      images: d.hero_image_url ? [d.hero_image_url] : d.images?.[0]?.url ? [d.images[0].url] : [],
    },
  };
}

export default async function DossierPage({ params }: Props) {
  const { data: rawDev } = await supabase
    .from("developments")
    .select("*, developer:developers(*), images:development_images(*), floor_plans:development_floor_plans(*)")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!rawDev) notFound();
  const dev = rawDev as unknown as Development;

  const heroImageUrl =
    dev.images?.find((img) => img.is_hero)?.url ??
    dev.images?.[0]?.url ??
    dev.hero_image_url ??
    null;

  const floorPlans = (dev.floor_plans ?? []) as DevelopmentFloorPlan[];

  // All images for carousel and gallery, hero first
  const heroImg = dev.images?.find((img) => img.is_hero) ?? dev.images?.[0] ?? null;
  const otherImgs = (dev.images ?? []).filter((img) => img !== heroImg);
  const allImages = heroImg ? [heroImg, ...otherImgs] : [...(dev.images ?? [])];

  const { data: similarData } = await supabase
    .from("developments")
    .select("*, developer:developers(*), images:development_images(*)")
    .eq("is_published", true)
    .eq("state", rawDev.state ?? "")
    .neq("id", rawDev.id)
    .limit(2);
  const similar = (similarData ?? []) as unknown as Development[];

  const amenities = dev.lifestyle ?? [];

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: dev.name,
    description: dev.summary,
    address: {
      "@type": "PostalAddress",
      addressLocality: dev.suburb,
      addressRegion: dev.state,
      addressCountry: "AU",
    },
  };

  const statPills = [
    dev.price_display && { label: "From", value: dev.price_display },
    (dev.beds_min || dev.beds_max) && {
      label: "Beds",
      value:
        dev.beds_min === dev.beds_max
          ? dev.beds_min?.toString()
          : `${dev.beds_min ?? "?"}–${dev.beds_max ?? "?"}`,
    },
    dev.type && { label: "Type", value: dev.type },
    dev.completion_quarter && { label: "Completion", value: dev.completion_quarter },
    dev.status && { label: "Status", value: dev.status },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ─── 1. Hero Carousel ─────────────────────────────────── */}
      <HeroCarousel
        images={allImages.map((img) => ({ url: img.url, caption: img.caption }))}
        name={dev.name}
      />

      {/* ─── 2. Info Bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-line">
        <div className="container-padded py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          {/* Developer logo / name */}
          <div className="flex-shrink-0">
            {dev.developer?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dev.developer.logo_url}
                alt={dev.developer.name}
                className="h-10 max-w-[140px] object-contain"
              />
            ) : dev.developer ? (
              <div className="flex flex-col">
                <span className="block w-5 h-[1.5px] bg-ink/30 mb-1.5" aria-hidden="true" />
                <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-ink/50 leading-[1.7]">
                  {dev.developer.name}
                </p>
              </div>
            ) : null}
          </div>

          {/* Dev name + location */}
          <div className="flex-1 min-w-0">
            <h1 className="font-sans font-bold text-ink text-[18px] leading-snug truncate">
              {dev.name}
            </h1>
            <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 mt-0.5">
              {[dev.suburb, dev.state].filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Stat pills */}
          {statPills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {statPills.map((s) => (
                <div key={s.label} className="flex flex-col items-center border border-line px-3 py-1.5">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-ink/40 leading-none mb-0.5">
                    {s.label}
                  </span>
                  <span className="font-mono text-label-lg text-ink leading-none">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Enquire CTA */}
          <a
            href="#enquire"
            className="flex-shrink-0 bg-orange text-white font-mono text-label-lg uppercase tracking-widest px-6 py-3 hover:bg-orange/90 transition-colors text-center"
          >
            Enquire
          </a>
        </div>
      </div>

      {/* ─── 3. About ─────────────────────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="container-padded grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: description */}
          <div className="lg:col-span-2">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">About</p>
            <h2 className="font-display font-light text-navy text-section-lg mb-6">{dev.name}</h2>
            {dev.summary ? (
              <ReadMore text={dev.summary} limit={320} />
            ) : (
              <p className="font-sans text-body-lg text-ink/40 italic">No description available.</p>
            )}
          </div>

          {/* Right: sticky contact card + enquiry form */}
          <div>
            <div className="lg:sticky lg:top-24">
              {/* Developer contact card */}
              {dev.developer && (
                <div className="bg-white border border-line px-5 py-4 mb-4 flex items-center gap-4">
                  {dev.developer.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dev.developer.logo_url}
                      alt={dev.developer.name}
                      className="h-10 max-w-[120px] object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-[8px] uppercase tracking-widest text-ink/40">
                        {dev.developer.name.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 mb-0.5">Developer</p>
                    <p className="font-sans font-medium text-body-md text-ink">{dev.developer.name}</p>
                  </div>
                </div>
              )}
              <EnquiryForm developmentId={dev.id} developmentName={dev.name} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Gallery ───────────────────────────────────────── */}
      {allImages.length > 0 && (
        <section className="bg-white py-16 border-t border-line">
          <div className="container-padded">
            <div className="flex items-baseline gap-3 mb-8">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">Gallery</p>
              <span className="font-mono text-label-sm text-ink/30">
                {allImages.length} {allImages.length === 1 ? "image" : "images"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allImages.map((img, i) => (
                <div key={img.id ?? i} className="relative h-52 overflow-hidden bg-navy/5">
                  <Image
                    src={img.url}
                    alt={img.caption ?? `${dev.name} ${i + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 5. Features & Amenities ──────────────────────────── */}
      {amenities.length > 0 && (
        <section className="bg-navy py-16">
          <div className="container-padded">
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/40 mb-3">Lifestyle</p>
            <h2 className="font-display font-light text-white text-section-lg mb-8">
              Features &amp; Amenities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {amenities.map((a) => (
                <div key={a} className="flex items-center gap-3 text-white/80">
                  <span className="w-5 h-5 rounded-full border border-orange flex items-center justify-center flex-shrink-0">
                    <CheckIcon size={11} className="text-orange" />
                  </span>
                  <span className="font-sans text-body-md">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 6. Properties Available ──────────────────────────── */}
      <section className="bg-white py-16 border-t border-line">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Availability</p>
          <h2 className="font-display font-light text-navy text-section-lg">Properties Available</h2>
          <PropertiesTable
            floorPlans={floorPlans}
            bedsMin={dev.beds_min}
            bedsMax={dev.beds_max}
          />
        </div>
      </section>

      {/* ─── 7. Location ──────────────────────────────────────── */}
      {dev.lat && dev.lng && (
        <section className="bg-cream py-16 border-t border-line">
          <div className="container-padded">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Location</p>
            <h2 className="font-display font-light text-navy text-section-lg mb-8">Location</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80 overflow-hidden border border-line">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${dev.lng - 0.01},${dev.lat - 0.01},${dev.lng + 0.01},${dev.lat + 0.01}&layer=mapnik&marker=${dev.lat},${dev.lng}`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  title={`Map showing ${dev.suburb ?? "location"}`}
                />
              </div>
              <div className="flex flex-col justify-center gap-4">
                <div>
                  <p className="font-mono text-label-sm uppercase tracking-widest text-ink/40 mb-1">Address</p>
                  <p className="font-sans text-body-lg text-ink font-medium">
                    {[dev.suburb, dev.state].filter(Boolean).join(", ")}
                  </p>
                </div>
                {dev.suburb && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([dev.suburb, dev.state, "Australia"].filter(Boolean).join(", "))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-label-sm uppercase tracking-widest text-orange hover:text-orange/70 transition-colors"
                  >
                    View on Google Maps →
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 8. Request Information ───────────────────────────── */}
      <section id="enquire" className="bg-white py-16 border-t border-line">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Get in touch</p>
          <h2 className="font-display font-light text-navy text-section-lg mb-8">Request Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <EnquiryForm developmentId={dev.id} developmentName={dev.name} />
            {/* Right: hero image */}
            <div className="relative min-h-[400px] overflow-hidden hidden lg:block">
              {heroImageUrl ? (
                <Image
                  src={heroImageUrl}
                  alt={dev.name}
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-mid" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. Similar Listings ──────────────────────────────── */}
      {similar.length > 0 && (
        <section className="bg-cream-alt py-16 border-t border-line">
          <div className="container-padded">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-3">Explore more</p>
            <h2 className="font-display font-light text-navy text-section-lg mb-8">Similar Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {similar.map((d) => (
                <PropertyCard key={d.id} development={d} layout="tall" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
