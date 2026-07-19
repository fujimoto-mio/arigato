import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">ARIGATO TiP</h1>
      <p className="text-neutral-500">Scan a store&apos;s QR code to get started.</p>
      <Link href="/s/kokoro" className="rounded-full bg-neutral-900 px-6 py-2 text-white">
        View demo store (kokoro)
      </Link>
    </main>
  );
}
