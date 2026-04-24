import { api } from "~/trpc/server";
import { CategoryManager } from "~/app/_components/admin/CategoryManager";

export const metadata = { title: "Categorías — Admin" };

export default async function CategoriasPage() {
  const categories = await api.category.adminList();
  return <CategoryManager initialCategories={categories} />;
}
