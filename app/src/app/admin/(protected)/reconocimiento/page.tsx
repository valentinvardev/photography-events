import { db } from "~/server/db";
import { FaceDatabasePage } from "~/app/_components/admin/FaceDatabasePage";

export default async function ReconocimientoPage() {
  const collections = await db.collection.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "desc" },
  });

  return <FaceDatabasePage collections={collections} />;
}
