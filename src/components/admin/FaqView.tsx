"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

export type Faq = { id: string; category: string; question: string; answer: string; sortOrder: number };

type Draft = { id: string; category: string; question: string; answer: string; sortOrder: number };

/**
 * FAQ list with a smoothly animated accordion. `editable` (platform admin) adds
 * new / edit / delete controls; operators get the read-only view.
 */
export function FaqView({ initial, editable }: { initial: Faq[]; editable: boolean }) {
  const [faqs, setFaqs] = useState<Faq[]>(initial);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Faq[]>();
    for (const f of [...faqs].sort((a, b) => a.sortOrder - b.sortOrder || a.question.localeCompare(b.question))) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    return [...map.entries()];
  }, [faqs]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startNew() {
    const nextOrder = faqs.reduce((max, f) => Math.max(max, f.sortOrder), 0) + 10;
    setError(null);
    setEditing({ id: "", category: "", question: "", answer: "", sortOrder: nextOrder });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const isNew = editing.id === "";
      const res = await fetch(isNew ? "/api/admin/faq" : `/api/admin/faq/${editing.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editing.category.trim(),
          question: editing.question.trim(),
          answer: editing.answer.trim(),
          sortOrder: editing.sortOrder,
        }),
      });
      if (!res.ok) throw new Error("failed");
      if (isNew) {
        const { id } = (await res.json()) as { id: string };
        setFaqs((prev) => [...prev, { ...editing, id }]);
      } else {
        setFaqs((prev) => prev.map((f) => (f.id === editing.id ? { ...editing } : f)));
      }
      setEditing(null);
    } catch {
      setError("保存できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/faq/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setFaqs((prev) => prev.filter((f) => f.id !== deleting.id));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {editable ? (
        <div>
          <button
            type="button"
            onClick={startNew}
            className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            新規追加
          </button>
        </div>
      ) : null}

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
          {editable ? "「新規追加」からFAQを作成してください。" : "現在ヘルプはありません。"}
        </div>
      ) : (
        grouped.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-bold text-neutral-700">{category}</h2>
            <div className="flex flex-col gap-2">
              {items.map((faq) => {
                const open = openIds.has(faq.id);
                return (
                  <div key={faq.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    <button
                      type="button"
                      onClick={() => toggle(faq.id)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left font-medium text-neutral-900"
                    >
                      {faq.question}
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {/* Smoothly expand/collapse via grid-rows 0fr → 1fr. */}
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4">
                          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">{faq.answer}</p>
                          {editable ? (
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setError(null);
                                  setEditing({ ...faq });
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                編集
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleting(faq)}
                                className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                削除
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {editing ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" />
          <form
            onSubmit={save}
            className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold">{editing.id === "" ? "FAQを追加" : "FAQを編集"}</h3>
            <label className="block text-sm font-medium text-neutral-700">
              カテゴリ
              <input
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                required
                maxLength={60}
                placeholder="例：チップ・口コミ"
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              質問
              <input
                value={editing.question}
                onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                required
                maxLength={300}
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              回答
              <textarea
                value={editing.answer}
                onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                required
                maxLength={4000}
                rows={5}
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={busy}
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={busy || !editing.category.trim() || !editing.question.trim() || !editing.answer.trim()}
                className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {busy ? "保存中…" : "保存"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmModal
        open={deleting !== null}
        tone="danger"
        title="FAQを削除しますか？"
        description={deleting ? `「${deleting.question}」を削除します。` : ""}
        confirmLabel="削除する"
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
