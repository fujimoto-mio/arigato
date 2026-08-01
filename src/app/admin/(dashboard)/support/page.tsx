export const dynamic = "force-dynamic";

// Right-pane placeholder; the thread list lives in the layout (see SupportShell).
export default function SupportIndexPage() {
  return (
    <div className="hidden h-full items-center justify-center p-10 text-center text-sm text-neutral-400 md:flex">
      左の一覧からお問い合わせを選択してください。
    </div>
  );
}
