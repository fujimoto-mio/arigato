import { FaqView } from "@/components/admin/FaqView";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const ctx = await requireAdmin();
  const faqs = await prisma.faq.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, category: true, question: true, answer: true, sortOrder: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">ヘルプ・よくある質問</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {ctx.isPlatformAdmin
            ? "よくある質問の追加・編集を行います。"
            : "解決しない場合は「運営へのお問い合わせ」からご連絡ください。"}
        </p>
      </div>

      <FaqView initial={faqs} editable={ctx.isPlatformAdmin} />
    </div>
  );
}
