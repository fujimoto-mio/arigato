"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type StaffRow = {
  id: string;
  name: string;
  photoUrl: string | null;
  active: boolean;
  sortOrder: number;
  tipCount: number;
};

export function StaffManager({ initialStaff }: { initialStaff: StaffRow[] }) {
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function request(url: string, init: RequestInit) {
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "request_failed");
    }
    return res.json();
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      await request("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewName("");
      refresh();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleRename(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusyId(id);
    try {
      await request(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      refresh();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(row: StaffRow) {
    setBusyId(row.id);
    try {
      await request(`/api/admin/staff/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      refresh();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePhoto(id: string, file: File) {
    setBusyId(id);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = (await request("/api/admin/upload", { method: "POST", body: form })) as {
        url: string;
      };
      await request(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: url }),
      });
      refresh();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= staff.length) return;

    const reordered = [...staff];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setStaff(reordered); // optimistic — guests see this order on the landing page

    try {
      await request("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((row) => row.id) }),
      });
    } catch (caught) {
      setStaff(staff);
      setError((caught as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">Add staff member</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleAdd();
            }}
            placeholder="Name shown to guests"
            className="flex-1 rounded-lg border border-neutral-300 p-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <ul className="flex flex-col gap-2">
        {staff.map((row, index) => (
          <li
            key={row.id}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              row.active ? "border-neutral-200" : "border-neutral-200 bg-neutral-50 opacity-60"
            }`}
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => handleMove(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${row.name} up`}
                className="px-1 text-xs text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleMove(index, 1)}
                disabled={index === staff.length - 1}
                aria-label={`Move ${row.name} down`}
                className="px-1 text-xs text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
              >
                ▼
              </button>
            </div>

            <label className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-full bg-neutral-200">
              {row.photoUrl ? (
                <Image src={row.photoUrl} alt={row.name} fill sizes="48px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg">👤</span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handlePhoto(row.id, file);
                  event.target.value = "";
                }}
              />
            </label>

            <input
              defaultValue={row.name}
              onBlur={(event) => {
                if (event.target.value.trim() !== row.name) handleRename(row.id, event.target.value);
              }}
              className="min-w-0 flex-1 rounded-lg border border-transparent p-2 text-sm hover:border-neutral-200 focus:border-neutral-300"
            />

            <span className="whitespace-nowrap text-xs text-neutral-400">{row.tipCount} tips</span>

            <button
              type="button"
              onClick={() => handleToggleActive(row)}
              disabled={busyId === row.id || isPending}
              className="whitespace-nowrap rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 disabled:opacity-40"
            >
              {row.active ? "Hide" : "Show"}
            </button>
          </li>
        ))}
      </ul>

      <p className="text-xs text-neutral-500">
        Hidden staff no longer appear to guests, but their tip history is kept.
      </p>
    </div>
  );
}
