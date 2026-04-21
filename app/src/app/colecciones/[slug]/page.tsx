import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/server";
import { FolderBrowser } from "~/app/_components/FolderBrowser";
import { CartProvider } from "~/app/_components/CartContext";
import { NavCartButton } from "~/app/_components/NavCartButton";
import { Footer } from "~/app/_components/design/Footer";
import { CollectionHero } from "~/app/_components/design/CollectionHero";
import { MobileNav } from "~/app/_components/MobileNav";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await api.collection.getBySlug({ slug });
  if (!collection) notFound();

  const bannerSrc = collection.bannerUrl ?? collection.coverUrl;

  const dateStr = collection.eventDate
    ? new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(collection.eventDate))
    : null;

  const price = Number(collection.pricePerBib);

  return (
    <CartProvider>
      <main className="relative bg-[color:var(--color-paper)] text-[color:var(--color-ink)] min-h-screen">
        {/* Compact, page-specific nav */}
        <nav className="sticky top-0 z-50 bg-[color:var(--color-paper)]/85 backdrop-blur-xl border-b border-[color:var(--color-grey-300)]">
          <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-16 flex items-center gap-6">
            <Link
              href="/"
              className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)] hover:text-[color:var(--color-ink)] transition-colors flex items-center gap-2 shrink-0"
            >
              <span aria-hidden>←</span>
              Eventos
            </Link>
            <span className="font-display italic text-[18px] hidden sm:inline shrink-0">
              Ivana Maritano
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] truncate"
              title={collection.title}
            >
              · {collection.title}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <NavCartButton price={price} />
              <MobileNav />
            </div>
          </div>
        </nav>

        {/* Editorial hero */}
        <CollectionHero
          title={collection.title}
          dateStr={dateStr}
          description={collection.description}
          bannerSrc={bannerSrc}
          logoUrl={collection.logoUrl}
          photoCount={collection._count.photos}
          price={price}
          bannerFocalY={collection.bannerFocalY ?? 50}
        />

        {/* Photo banner strip */}
        {bannerSrc && (
          <div
            className="relative w-full overflow-hidden bg-[color:var(--color-grey-900)]"
            style={{ height: "clamp(100px, 15vh, 190px)" }}
          >
            <img
              src={bannerSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-75"
              style={{ objectPosition: `50% ${collection.bannerFocalY ?? 50}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)]/50 via-transparent to-[color:var(--color-ink)]/20" />
          </div>
        )}

        {/* Gallery + search */}
        <FolderBrowser collectionId={collection.id} pricePerBib={price} />

        {/* MercadoPago strip */}
        <section className="px-6 md:px-10 py-24 border-t border-[color:var(--color-grey-300)]">
          <div className="max-w-[1600px] mx-auto flex flex-col items-center text-center gap-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
              Pagos
            </p>
            <Image
              src="/mercadopago.svg"
              alt="MercadoPago"
              width={500}
              height={100}
              className="h-20 w-auto"
            />
            <p className="font-display italic text-[26px] md:text-[36px] leading-[1.05] tracking-[-0.02em]">
              Procesado de forma segura.<br />
              <span className="text-[color:var(--color-grey-500)]">Tarjeta, transferencia o efectivo.</span>
            </p>
          </div>
        </section>

        <Footer />
      </main>
    </CartProvider>
  );
}
