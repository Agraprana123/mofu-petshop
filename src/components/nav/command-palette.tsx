"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  Search,
  X,
} from "lucide-react";
import type { UserRole } from "@/lib/navigation";
import {
  DASHBOARD_ITEM,
  getMenuForRole,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  role: UserRole;
}

export function CommandPalette({ open, onClose, role }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (item: { label: string; description: string }) =>
      !q ||
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);

    const result = getMenuForRole(role)
      .map((group) => ({
        group: group.label,
        items: group.items.filter(match),
      }))
      .filter((group) => group.items.length > 0);

    if (match(DASHBOARD_ITEM)) {
      result.unshift({ group: "Utama", items: [DASHBOARD_ITEM] });
    }

    return result.slice(0, 6);
  }, [query, role]);

  const flatItems = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  );

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const goTo = (href: string) => {
    onClose();
    router.push(href);
  };

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian menu"
    >
      <div
        className="fixed inset-0 animate-fade bg-zinc-950/40 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl animate-pop overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-2xl shadow-zinc-950/25">
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4">
          <Search className="size-5 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) =>
                  flatItems.length ? (index + 1) % flatItems.length : 0
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) =>
                  flatItems.length
                    ? (index - 1 + flatItems.length) % flatItems.length
                    : 0
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                const item = flatItems[activeIndex];
                if (item) goTo(item.href);
              }
            }}
            placeholder="Cari halaman, laporan, atau aksi..."
            className="h-14 w-full bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400"
            aria-label="Cari menu"
          />
          <button
            onClick={onClose}
            aria-label="Tutup pencarian"
            className="grid size-9 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {groups.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-zinc-700">
                Tidak ada menu yang cocok
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Coba kata kunci lain seperti &quot;produk&quot; atau
                &quot;laporan&quot;.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.group} className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  {group.group}
                </p>
                {group.items.map((item) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  const Icon = item.icon;
                  const active = index === activeIndex;

                  return (
                    <button
                      key={`${group.group}-${item.href}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(item.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        active
                          ? "bg-[#87482D]/8 text-[#87482D]"
                          : "text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl",
                          active
                            ? "bg-[#87482D] text-white"
                            : "bg-zinc-100 text-zinc-500"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">
                          {item.label}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-400">
                          {item.description}
                        </span>
                      </span>
                      {active && (
                        <CornerDownLeft className="size-4 shrink-0 text-[#87482D]/60" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-zinc-100 bg-zinc-50/70 px-4 py-2.5 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-sans text-[10px] text-zinc-500">
              <ArrowUp className="inline size-3" />
              <ArrowDown className="inline size-3" />
            </kbd>
            navigasi
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-sans text-[10px] text-zinc-500">
              <CornerDownLeft className="inline size-3" />
            </kbd>
            buka
          </span>
          <span className="ml-auto">esc untuk tutup</span>
        </div>
      </div>
    </div>
  );
}
