"use client";

import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/**
 * Custom single-select with a fully styled dropdown popup (native <select> can't
 * be restyled). Opt into an in-dropdown search box with `searchable` — handy
 * when the option list can grow long (e.g. the store switcher). Keyboard: ↑/↓ to
 * move, Enter to choose, Esc to close.
 */
export function Select({
  value,
  onChange,
  options,
  searchable = false,
  disabled = false,
  loading = false,
  ariaLabel,
  placeholder = "選択",
  searchPlaceholder = "検索…",
  className = "",
  triggerClassName = "",
  align = "left",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  searchable?: boolean;
  disabled?: boolean;
  /** Show a spinner (instead of the chevron) and block interaction while data loads. */
  loading?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Extra classes for the root wrapper (mainly width control). */
  className?: string;
  /** Extra classes for the trigger button. */
  triggerClassName?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Focus the search box once the menu is open (DOM side effect only).
  useEffect(() => {
    if (open && searchable) {
      const id = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open, searchable]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const node = list?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  // Reset the search and highlight the current value as the menu opens.
  function openMenu() {
    const currentIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    setQuery("");
    setOpen(true);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) choose(option.value);
    }
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`} onKeyDown={onKeyDown}>
      <button
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-busy={loading}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex w-full min-w-[8.5rem] items-center gap-2 rounded-lg border border-neutral-300 py-2 pl-4 pr-3 text-sm font-semibold text-neutral-900 transition focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-60 ${
          open ? "border-[var(--color-accent)]" : ""
        } ${triggerClassName}`}
      >
        <span className="min-w-0 flex-1 truncate text-left">{selected ? selected.label : placeholder}</span>
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--color-accent)]" />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open ? (
        <div
          className={`absolute z-50 mt-2 min-w-full max-w-[80vw] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {searchable ? (
            <div className="border-b border-neutral-100 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm focus:border-[var(--color-accent)] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          ) : null}

          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-neutral-400">該当する店舗がありません</li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <li key={option.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => choose(option.value)}
                      onMouseMove={() => setActiveIndex(index)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        isActive ? "bg-[var(--color-accent)]/10" : ""
                      } ${isSelected ? "font-semibold text-[var(--color-accent)]" : "text-neutral-700"}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {isSelected ? <Check className="h-4 w-4 shrink-0 text-[var(--color-accent)]" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
