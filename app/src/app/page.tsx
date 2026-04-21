import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/server";
import { EventCard } from "~/app/_components/EventCard";
import { Nav } from "~/app/_components/design/Nav";
import { Footer } from "~/app/_components/design/Footer";
import { Hero } from "~/app/_components/design/Hero";
import { Reveal } from "~/app/_components/design/Reveal";
import { MagneticButton } from "~/app/_components/design/MagneticButton";

export default async function HomePage() {
  const raw = await api.collection.list();
  const collections = raw.map((c) => ({
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
    <main className="relative bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
      <Nav />
      <Hero collectionsCount={collections.length} />

      {/* ════════ EVENTS — contact-sheet grid ════════ */}
      <section id="eventos" className="px-6 md:px-10 pt-12 pb-32">
        <div className="max-w-[1600px] mx-auto">
          {/* section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16 md:mb-24">
            <div>
              <Reveal as="h2" delay={0.05}>
                <span className="font-display italic font-light leading-[0.92] tracking-[-0.03em] block"
                      style={{ fontSize: "clamp(48px, 9vw, 140px)" }}>
                  Eventos.
                </span>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)] md:text-right">
                {String(collections.length).padStart(2, "0")} disponibles<br />
                <span className="text-[color:var(--color-grey-500)]">
                  Actualizado {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(new Date())}
                </span>
              </p>
            </Reveal>
          </div>

          {collections.length === 0 ? (
            <div className="border border-dashed border-[color:var(--color-grey-300)] py-32 px-8 text-center">
              <p className="eyebrow mb-3">Estado</p>
              <p className="font-display italic text-[44px] leading-tight">
                Próximamente.
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                Los próximos eventos aparecerán aquí
              </p>
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

      {/* ════════ BIG CTA ════════ */}
      <section className="relative px-6 md:px-10 py-40 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] overflow-hidden">
        {/* decorative numbered grid lines */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-12 gap-0">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="border-l border-[color:var(--color-grey-900)] col-start-[var(--c)]" style={{ ["--c" as never]: i + 2 } as React.CSSProperties} />
          ))}
        </div>

        <div className="relative max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
          <Reveal as="p" className="col-span-12 md:col-span-3 eyebrow text-[color:var(--color-grey-500)]">
            Buscá tus fotos
          </Reveal>

          <div className="col-span-12 md:col-span-8 md:col-start-4">
            <Reveal>
              <h2 className="font-display italic font-light leading-[0.92] tracking-[-0.04em]"
                  style={{ fontSize: "clamp(56px, 11vw, 180px)" }}>
                Tu número,<br />
                <span className="text-[color:var(--color-grey-500)]">tu&nbsp;</span>
                <span className="not-italic font-display">foto.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-8 max-w-lg font-sans text-[16px] leading-[1.6] text-[color:var(--color-paper)]/75">
                Ingresá a un evento y buscá por número de dorsal o subí una selfie para encontrar tus fotos con reconocimiento facial.
                Pagás solo si encontrás las que te gustan.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-12 flex flex-wrap items-center gap-5">
                <MagneticButton
                  href="#eventos"
                  variant="paper"
                  size="lg"
                  cursorLabel="ver eventos"
                >
                  Ver eventos
                </MagneticButton>
                <Link
                  href="#contacto"
                  className="link-draw font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-paper)]/80"
                >
                  ¿Sos organizador? Hablemos
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════ MERCADOPAGO STRIP ════════ */}
      <section className="px-6 md:px-10 py-24 border-t border-[color:var(--color-grey-300)]">
        <div className="max-w-[1600px] mx-auto flex flex-col items-center text-center gap-10">
          <Reveal as="p" className="eyebrow">
            Pagos
          </Reveal>
          <Reveal>
            <Image
              src="/mercadopago.svg"
              alt="MercadoPago"
              width={500}
              height={100}
              className="h-20 w-auto"
            />
          </Reveal>
          <Reveal>
            <p className="font-display italic text-[26px] md:text-[36px] leading-[1.05] tracking-[-0.02em]">
              Procesado de forma segura.<br />
              <span className="text-[color:var(--color-grey-500)]">Tarjeta, transferencia o efectivo.</span>
            </p>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
