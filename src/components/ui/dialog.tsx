"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-fade bg-zinc-950/45 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={cn(
          "relative z-50 flex max-h-[92vh] w-full max-w-lg animate-pop flex-col overflow-hidden rounded-t-3xl border border-zinc-200/70 bg-white shadow-2xl shadow-zinc-950/20 sm:max-h-[90vh] sm:rounded-3xl",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="truncate text-lg font-semibold tracking-tight text-zinc-900"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            )}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Tutup dialog"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#87482D]/15"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
