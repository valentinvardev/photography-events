import Link from "next/link";

export type CategoryCol = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  buttonText: string | null;
  buttonHref: string | null;
  _count: { collections: number };
};

export function CategoryCard({
  cat,
  index = 0,
}: {
  cat: CategoryCol;
  index?: number;
}) {
  const num = String(index + 1).padStart(2, "0");
  const href = cat.buttonHref && cat.buttonHref.trim().length > 0
    ? cat.buttonHref
    : `/categorias/${cat.slug}`;

  const inner = (
    <article className="group relative block">
      <div className="flex items-baseline justify-between mb-3 px-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
          ({num})
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
          {cat._count.collections} evento{cat._count.collections !== 1 ? "s" : ""}
        </span>
      </div>

      {/* image frame */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--color-grey-900)] viewfinder-corners">
        {cat.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cat.coverUrl}
            alt={cat.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)]">
              sin portada
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-[color:var(--color-ink)] opacity-0 group-hover:opacity-20 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />

        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)] px-4 py-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
            {cat._count.collections} eventos
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] flex items-center gap-2">
            {cat.buttonText ?? "Explorar"}
            <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">↗</span>
          </span>
        </div>
      </div>

      {/* title */}
      <div className="mt-4">
        <h3 className="font-display italic text-[26px] leading-[1.05] tracking-[-0.02em] text-[color:var(--color-ink)] group-hover:translate-x-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          {cat.name}
        </h3>
        {cat.description && (
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-grey-500)] leading-relaxed line-clamp-2">
            {cat.description}
          </p>
        )}
      </div>
    </article>
  );

  return (
    <Link href={href} className="block">
      {inner}
    </Link>
  );
}
