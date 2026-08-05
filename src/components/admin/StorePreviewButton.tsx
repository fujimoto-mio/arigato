"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import { PhonePreviewModal } from "@/components/admin/PhonePreviewModal";
import { PreviewIframe } from "@/components/admin/PreviewIframe";

/**
 * Preview the store's live guest page (the QR destination) in the shared phone
 * frame, without leaving the admin. Loads `/s/<slug>` in an iframe so it always
 * reflects the current store info / story.
 */
export function StorePreviewButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
      >
        <Eye className="h-3.5 w-3.5" />
        プレビュー
      </button>

      <PhonePreviewModal open={open} onClose={() => setOpen(false)} ariaLabel="お客様用ページのプレビュー">
        <PreviewIframe src={url} title="お客様用ページのプレビュー" />
      </PhonePreviewModal>
    </>
  );
}
