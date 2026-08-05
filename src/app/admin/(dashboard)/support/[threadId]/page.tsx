import { ArrowLeft, CheckCheck, Headphones } from "lucide-react";
import Link from "next/link";
import { ResolveButton } from "@/components/admin/ResolveButton";
import { SupportReplyForm } from "@/components/admin/SupportReplyForm";
import { SupportThreadRealtime } from "@/components/admin/SupportThreadRealtime";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTokyoTime } from "@/lib/admin/period";
import { getThreadForCtx } from "@/lib/admin/support";

export const dynamic = "force-dynamic";

function msgTime(value: Date): string {
  return new Date(value).toLocaleString("ja-JP", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" });
}

export default async function SupportThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const ctx = await requireAdmin();
  const thread = await getThreadForCtx(ctx, threadId);

  // Note: marking the thread read happens on genuine open (client mount, see
  // SupportThreadRealtime) — not here — so background realtime refreshes don't
  // auto-flip read receipts.
  const resolved = thread.status === "resolved";

  // My messages are "read" once the other side's unread flag is cleared (they
  // opened the thread since my latest reply). Show 既読 under my last message.
  const mineSender = ctx.isPlatformAdmin ? "admin" : "operator";
  const otherHasRead = ctx.isPlatformAdmin ? !thread.operatorUnread : !thread.adminUnread;
  const lastMineId = [...thread.messages].reverse().find((m) => m.sender === mineSender)?.id ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SupportThreadRealtime threadId={thread.id} />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 p-4">
        <div className="min-w-0">
          <Link
            href="/admin/support"
            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 md:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            一覧
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-neutral-900">{thread.subject}</h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                resolved ? "bg-neutral-200 text-neutral-600" : "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
              }`}
            >
              {resolved ? "解決済み" : "対応中"}
            </span>
          </div>
          {ctx.isPlatformAdmin ? (
            <p className="text-xs font-medium text-[var(--color-accent)]">{thread.store.name}</p>
          ) : null}
          <p className="mt-0.5 text-xs text-neutral-400">お問い合わせ日時：{formatTokyoTime(thread.createdAt)}</p>
        </div>
        <ResolveButton threadId={thread.id} resolved={resolved} />
      </div>

      {/* Messages */}
      <div id="support-thread-scroll" className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-5">
        {thread.messages.map((message) => {
          const isAdmin = message.sender === "admin";
          const mine = (ctx.isPlatformAdmin && isAdmin) || (!ctx.isPlatformAdmin && !isAdmin);
          const label = isAdmin ? "ARIGATO TiPLY 運営" : ctx.isPlatformAdmin ? thread.store.name : "自分";

          if (mine) {
            return (
              <div key={message.id} className="flex flex-col items-end">
                <div className="max-w-[80%] rounded-2xl bg-[var(--color-accent)] px-4 py-2.5 text-sm leading-relaxed text-white">
                  <p className="whitespace-pre-line">{message.body}</p>
                  {message.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={message.imageUrl} alt="添付画像" className="mt-2 max-h-48 rounded-lg" />
                  ) : null}
                </div>
                <span className="mt-1 flex items-center gap-1 text-[10px] text-neutral-400">
                  {message.id === lastMineId && otherHasRead ? (
                    <CheckCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-label="既読" />
                  ) : null}
                  {msgTime(message.createdAt)}
                </span>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex gap-2">
              <span className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                {isAdmin ? (
                  <Headphones className="h-4 w-4" />
                ) : (
                  <span className="text-[10px] font-bold">{label.slice(0, 2).toUpperCase()}</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-neutral-400">{label}</span>
                <div className="mt-1 w-fit max-w-[80%] rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm leading-relaxed text-neutral-800">
                  <p className="whitespace-pre-line">{message.body}</p>
                  {message.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={message.imageUrl} alt="添付画像" className="mt-2 max-h-48 rounded-lg" />
                  ) : null}
                </div>
                <span className="mt-1 block text-[10px] text-neutral-400">{msgTime(message.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-neutral-100 p-3">
        <SupportReplyForm threadId={thread.id} storeId={thread.store.id} />
      </div>
    </div>
  );
}
