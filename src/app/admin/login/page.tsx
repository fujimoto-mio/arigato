import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata = { title: "Sign in — ARIGATO TiP" };

export default async function AdminLoginPage() {
  if (await getAdminContext()) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">ARIGATO TiP</h1>
        <p className="mt-1 text-sm text-neutral-500">Store dashboard</p>
      </div>
      <LoginForm />
    </main>
  );
}
