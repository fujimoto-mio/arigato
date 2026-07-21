import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Dashboard — ARIGATO TiP" };

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { store, email } = await requireAdmin();

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white">
      <header className="flex items-start justify-between gap-4 px-4 pt-6">
        <div>
          <h1 className="text-xl font-bold">{store.name}</h1>
          <p className="text-xs text-neutral-500">
            /s/{store.slug}
            {email ? ` · ${email}` : ""}
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="mt-4">
        <AdminNav />
      </div>

      <main className="px-4 py-6">{children}</main>
    </div>
  );
}
