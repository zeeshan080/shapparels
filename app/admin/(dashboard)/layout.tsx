import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/sign-in");
  }

  return (
    <div className="min-h-screen">
      <AdminSidebar />
      <div className="lg:pl-64">
        <main className="min-h-screen p-4 pt-18 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
