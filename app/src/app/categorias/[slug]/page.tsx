import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { EventCard } from "~/app/_components/EventCard";
import { Nav } from "~/app/_components/design/Nav";
import { Footer } from "~/app/_components/design/Footer";
import { Reveal } from "~/app/_components/design/Reveal";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await api.category.getBySlug({ slug });
  if (!category) notFound();

  const collections = category.collections.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    slug: c.slug,
    coverUrl: c.coverUrl,
    bannerUrl: c.bannerUrl,
    bannerFocalY: c.bannerFocalY,
    logoUrl: c.logoUrl,
    eventDate: c.eventDate,
    _count: c._count,
  }));

  return (
    <main className="relative bg-[color:var(--color-paper)] text-[color:var(--color-ink)] min-h-screen">
      <Nav />

      {/* ════════ HERO ════════ */}
      <section
        data-cursor="dark"
        className="relative bg-[color:var(--color-ink)] text-[color:var(--color-paper)] overflow-hidden"
        style={{ minHeight: "min(45vh, 380px)" }}
      >
        {category.coverUrl && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={category.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.4) 40%, rgba(10,10,10,0.95) 100%)",
              }}
            />
          </div>
        )}

        {/* Decorative corners */}
        <span className="pointer-events-none absolute top-6 left-6 md:top-10 md:left-10 w-5 h-5 border-l border-t border-[color:var(--color-paper)]/40 z-10" />
        <span className="pointer-events-none absolute top-6 right-6 md:top-10 md:right-10 w-5 h-5 border-r border-t border-[color:var(--color-paper)]/40 z-10" />
        <span className="pointer-events-none absolute bottom-6 left-6 md:bottom-10 md:left-10 w-5 h-5 border-l border-b border-[color:var(--color-paper)]/40 z-10" />
        <span className="pointer-events-none absolute bottom-6 right-6 md:bottom-10 md:right-10 w-5 h-5 border-r border-b border-[color:var(--color-paper)]/40 z-10" />

        <div className="relative z-10 px-6 md:px-10 pt-28 pb-16 max-w-[1600px] mx-auto">
          <Reveal as="p" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/60 mb-4">
            Categoría
          </Reveal>
          <Reveal as="h1" delay={0.05}>
            <span
              className="font-display italic font-light leading-[0.9] tracking-[-0.04em] block"
              style={{ fontSize: "clamp(48px, 11vw, 160px)" }}
            >
              {category.name}.
            </span>
          </Reveal>
          {category.description && (
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-2xl font-sans text-[15px] md:text-[17px] leading-[1.6] text-[color:var(--color-paper)]/80">
                {category.description}
              </p>
            </Reveal>
          )}
          <Reveal delay={0.22}>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/50">
              {String(collections.length).padStart(2, "0")} {collections.length === 1 ? "evento" : "eventos"}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════ EVENTS GRID ════════ */}
      <section data-cursor="light" className="px-6 md:px-10 py-24">
        <div className="max-w-[1600px] mx-auto">
          {collections.length === 0 ? (
            <div className="border border-dashed border-[color:var(--color-grey-300)] py-32 px-8 text-center">
              <p className="eyebrow mb-3">Estado</p>
              <p className="font-display italic text-[44px] leading-tight">
                Próximamente.
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                No hay eventos en esta categoría todavía
              </p>
              <Link
                href="/#eventos"
                className="inline-block mt-8 px-5 py-3 border border-[color:var(--color-ink)] font-mono text-[11px] uppercase tracking-[0.22em] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
              >
                Ver todos los eventos ↗
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
              {collections.map((col, i) => (
                <Reveal key={col.id} variant="lift" delay={i * 0.06}>
                  <EventCard col={col} index={i} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
