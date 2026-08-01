"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/admin/Select";

export type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
  status: "draft" | "published" | "deleted";
};

const STATUS_OPTIONS = [
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開" },
  { value: "deleted", label: "削除" },
];

/** Admin announcement management — a status dropdown (下書き/公開/削除) per row. */
export function AnnouncementAdmin({ items: initial }: { items: AdminAnnouncement[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("failed");
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: status as AdminAnnouncement["status"] } : i)),
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
        お知らせはありません。「お知らせを配信」から作成してください。
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((a) => (
        <li
          key={a.id}
          className={`flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 ${
            a.status === "deleted" ? "opacity-60" : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-neutral-900">{a.title}</h2>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
                {a.audience}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{a.body}</p>
            <p className="mt-2 text-xs text-neutral-400">{a.createdAt}</p>
          </div>

          {/* Status flag — 下書き / 公開 / 削除. */}
          <div className="shrink-0">
            <Select
              value={a.status}
              onChange={(status) => setStatus(a.id, status)}
              options={STATUS_OPTIONS}
              ariaLabel="ステータス"
              disabled={busyId === a.id}
              className="w-24"
              triggerClassName="font-medium"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
