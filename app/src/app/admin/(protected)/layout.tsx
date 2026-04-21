import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { AdminShell } from "~/app/admin/_components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell userEmail={session.user?.email}>
      {children}
    </AdminShell>
  );
}
