import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { LogoMark, Wordmark } from "@/components/flow/brand";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata = { title: "ログイン — ARIGATO TiP" };

// Reads the session cookie to bounce already-signed-in admins, so it must never
// be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminContext()) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={64} />
          <Wordmark className="mt-4 text-3xl tracking-tight" />
          <p className="mt-1 text-sm text-neutral-500">店舗管理画面</p>
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs tracking-wide text-neutral-400">
          Powered by <span className="font-bold text-neutral-600">ARIGATO TiP</span>
        </p>
      </div>
    </main>
  );
}
