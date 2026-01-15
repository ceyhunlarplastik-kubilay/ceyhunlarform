import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { AuthActions } from "@/components/auth/AuthActions";

export default async function AdminProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // RBAC: enforce admin only
  if (!(await checkRole("admin"))) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AuthActions />
      <main className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">{children}</div>
      </main>
    </div>
  );
}
