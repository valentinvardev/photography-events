import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { AdminShell } from "~/app/admin/_components/AdminShell";
import { MercadoPagoExpiryModal } from "~/app/admin/_components/MercadoPagoExpiryModal";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell userEmail={session.user?.email}>
      {children}
      <MercadoPagoExpiryModal />
    </AdminShell>
  );
}
