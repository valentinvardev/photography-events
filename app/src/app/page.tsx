import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/server";
import { EventCard } from "~/app/_components/EventCard";
import { CategoryCard } from "~/app/_components/CategoryCard";
import { Nav } from "~/app/_components/design/Nav";
import { Footer } from "~/app/_components/design/Footer";
import { Hero } from "~/app/_components/design/Hero";
import { Reveal } from "~/app/_components/design/Reveal";
import { MagneticButton } from "~/app/_components/design/MagneticButton";

export default async function HomePage() {
  const [rawCollections, categories] = await Promise.all([
    api.collection.list(),
    api.category.list(),
  ]);
  const raw = rawCollections;
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
      <section id="eventos" data-cursor="light" className="px-6 md:px-10 pt-12 pb-32">
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

      {/* ════════ CATEGORIES ════════ */}
      {categories.length > 0 && (
        <section id="categorias" className="px-6 md:px-10 pt-0 pb-32 border-t border-[color:var(--color-grey-300)]">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16 md:mb-24 pt-16">
              <Reveal as="h2">
                <span className="font-display italic font-light leading-[0.92] tracking-[-0.03em] block"
                      style={{ fontSize: "clamp(48px, 9vw, 140px)" }}>
                  Categorías.
                </span>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)] md:text-right">
                  {String(categories.length).padStart(2, "0")} categorías
                </p>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
              {categories.map((cat, i) => (
                <Reveal key={cat.id} variant="lift" delay={i * 0.06}>
                  <CategoryCard cat={cat} index={i} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════ BIG CTA ════════ */}
      <section data-cursor="dark" className="relative px-6 md:px-10 py-40 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] overflow-hidden">
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
                Tu momento,<br />
                <span className="not-italic font-display text-[color:var(--color-grey-500)]">tu foto.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-8 max-w-lg font-sans text-[16px] leading-[1.8] text-[color:var(--color-paper)]/75 flex flex-col gap-1">
                <p>Entrá a tu evento y encontrá tus fotos en segundos.</p>
                <p>Buscá por número o subiendo una selfie.</p>
                <p>Pagás solo si te gustan.</p>
              </div>
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
      <section data-cursor="light" className="px-6 md:px-10 py-24 border-t border-[color:var(--color-grey-300)]">
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

      {/* ════════ QUIÉN SOY ════════ */}
      <section id="quien-soy" data-cursor="light" className="px-6 md:px-10 py-32 bg-[color:var(--color-paper)]">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6 items-start">
          <Reveal as="p" className="col-span-12 md:col-span-3 eyebrow">
            (03) — Quién soy
          </Reveal>

          <div className="col-span-12 md:col-span-8 md:col-start-4">
            <Reveal>
              <h2 className="font-display italic font-light leading-[0.92] tracking-[-0.04em]"
                  style={{ fontSize: "clamp(40px, 7vw, 110px)" }}>
                El superpoder<br />
                <span className="text-[color:var(--color-grey-500)]">de congelar el tiempo.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="font-sans text-[16px] leading-[1.8] text-[color:var(--color-grey-700)] flex flex-col gap-5">
                  <p className="font-display italic text-[20px] leading-[1.4] text-[color:var(--color-ink)]">
                    Mientras caminábamos al colegio, mi hijo me preguntó:<br />
                    <span className="text-[color:var(--color-grey-500)]">—Mami, ¿qué es lo que más te gusta de ser fotógrafa?</span>
                  </p>
                  <p>Mi respuesta salió simple.</p>
                  <p>
                    Que tengo un superpoder.<br />
                    El de congelar el tiempo.<br />
                    El de hacer eterno lo efímero.<br />
                    El de encontrar, en cada click, una forma de vencer al olvido.
                  </p>
                  <p>
                    Porque la vida no se detiene.<br />
                    El instante se escapa.<br />
                    El cuerpo cambia, los hijos crecen, la luz se apaga.
                  </p>
                  <p className="font-display italic text-[18px] text-[color:var(--color-ink)]">
                    Pero ahí está la foto, latiendo todavía.
                  </p>
                </div>

                <div className="font-sans text-[16px] leading-[1.8] text-[color:var(--color-grey-700)] flex flex-col gap-5">
                  <p>
                    Hace más de 20 años que la cámara es una extensión de mi cuerpo.
                    Durante años estuve dedicada a la fotografía deportiva en el fútbol, donde aprendí a anticipar,
                    a leer lo que va a pasar y a no fallar en el momento clave.
                  </p>
                  <p>
                    Hoy trabajo en deportes, institucionales y eventos sociales, con el mismo criterio:
                    conseguir las fotos que realmente importan.
                  </p>
                  <p>
                    Por eso este espacio existe. Para que, entre todo lo que pasa, puedas encontrarte.
                    Y quedarte con eso.
                  </p>
                  <p>
                    Y también para que quienes necesitan que su evento, su marca o su historia esté bien contada,
                    tengan a quién llamar. Con intención. Con criterio. Con imágenes que realmente funcionen.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
