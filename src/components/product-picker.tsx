"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const idIntegerFormatter = new Intl.NumberFormat("id-ID");
const idQtyFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 3,
});
const INITIAL_VISIBLE_COUNT = 60;

export interface ProductPickerOption {
  id: number;
  name: string;
  code: string;
  category?: { name: string } | null;
  baseUnit: { code: string };
  /** Total stok dalam satuan dasar. Kosongkan bila stok tidak perlu ditampilkan. */
  stock?: number;
  /** Harga jual opsional per satuan dasar (ditampilkan pada quick search). */
  price?: number;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatQty(value: number) {
  return idQtyFormatter.format(value);
}

function buildCategories(products: ProductPickerOption[]) {
  const counts = new Map<string, number>();
  products.forEach((product) => {
    const name = product.category?.name;
    if (!name) return;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  if (counts.size === 0) return [];

  return [
    { name: "ALL", label: "Semua", count: products.length },
    ...Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, label: name, count })),
  ];
}

function filterAndScoreProducts(
  products: ProductPickerOption[],
  query: string,
  category: string
) {
  const terms = normalize(query).split(" ").filter(Boolean);
  const fullQuery = normalize(query);

  return products
    .filter(
      (product) =>
        category === "ALL" || product.category?.name === category
    )
    .map((product) => {
      const normalizedName = normalize(product.name);
      const normalizedCode = normalize(product.code);
      const haystack = normalize(
        `${product.name} ${product.code} ${product.category?.name ?? ""}`
      );

      if (terms.length === 0) return { product, score: 0 };
      if (!terms.every((term) => haystack.includes(term))) return null;

      let score = 1;
      if (haystack.includes(fullQuery)) score += 5;
      if (normalizedName.startsWith(fullQuery)) score += 4;
      if (normalizedCode.startsWith(fullQuery)) score += 6;
      return { product, score };
    })
    .filter(
      (entry): entry is { product: ProductPickerOption; score: number } =>
        entry !== null
    )
    .sort(
      (a, b) =>
        b.score - a.score || a.product.name.localeCompare(b.product.name)
    )
    .map((entry) => entry.product);
}

function isProductOutOfStock(
  product: ProductPickerOption,
  allowOutOfStock: boolean
) {
  return (
    !allowOutOfStock &&
    product.stock !== undefined &&
    product.stock <= 0
  );
}

function moveActiveIndex(
  results: ProductPickerOption[],
  currentIndex: number,
  direction: 1 | -1,
  allowOutOfStock: boolean
): number {
  if (results.length === 0) return 0;
  let next = currentIndex;
  for (let step = 0; step < results.length; step += 1) {
    next = (next + direction + results.length) % results.length;
    if (!isProductOutOfStock(results[next], allowOutOfStock)) {
      return next;
    }
  }
  return currentIndex;
}

interface DropdownPanelStyle {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

function computeDropdownStyle(
  rect: DOMRect,
  {
    preferredWidth,
    preferredMaxHeight,
    minBelowToStayDown = 180,
  }: {
    preferredWidth: number;
    preferredMaxHeight: number;
    minBelowToStayDown?: number;
  }
): DropdownPanelStyle {
  const width = Math.min(preferredWidth, window.innerWidth - 16);
  const left = Math.min(
    Math.max(8, rect.left),
    window.innerWidth - width - 8
  );
  const gap = 6;
  const edgePadding = 8;
  const spaceBelow = Math.max(
    0,
    window.innerHeight - rect.bottom - gap - edgePadding
  );
  const spaceAbove = Math.max(0, rect.top - gap - edgePadding);

  const openAbove = spaceBelow < minBelowToStayDown && spaceAbove > spaceBelow;

  if (openAbove) {
    return {
      bottom: Math.max(edgePadding, window.innerHeight - rect.top + gap),
      left,
      width,
      maxHeight: Math.min(preferredMaxHeight, Math.max(120, spaceAbove)),
    };
  }

  return {
    top: Math.max(edgePadding, rect.bottom + gap),
    left,
    width,
    maxHeight: Math.min(preferredMaxHeight, Math.max(140, spaceBelow)),
  };
}

function isSameDropdownStyle(
  a: DropdownPanelStyle | null,
  b: DropdownPanelStyle
) {
  return (
    a !== null &&
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.left === b.left &&
    a.width === b.width &&
    a.maxHeight === b.maxHeight
  );
}

/**
 * Mengukur posisi panel portal tanpa memicu layout thrashing saat user
 * men-scroll isi daftar produk itu sendiri.
 */
function useDropdownPosition(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLDivElement | null>,
  options: {
    preferredWidth: number | "anchor";
    preferredMaxHeight: number;
    minBelowToStayDown: number;
  }
) {
  const [panelStyle, setPanelStyle] = useState<DropdownPanelStyle | null>(null);
  const { preferredWidth, preferredMaxHeight, minBelowToStayDown } = options;

  useLayoutEffect(() => {
    if (!open) return;

    let rafId = 0;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const next = computeDropdownStyle(rect, {
        preferredWidth:
          preferredWidth === "anchor"
            ? Math.max(rect.width, 320)
            : preferredWidth,
        preferredMaxHeight,
        minBelowToStayDown,
      });

      setPanelStyle((prev) => (isSameDropdownStyle(prev, next) ? prev : next));
    };

    const handleScroll = (event: Event) => {
      // Abaikan scroll yang berasal dari dalam panel dropdown itu sendiri
      if (panelRef.current?.contains(event.target as Node)) return;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        updatePosition();
      });
    };

    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        updatePosition();
      });
    };

    updatePosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, anchorRef, panelRef, preferredWidth, preferredMaxHeight, minBelowToStayDown]);

  return panelStyle;
}

const ProductOptionRow = memo(function ProductOptionRow({
  product,
  index,
  listboxId,
  isActive,
  isSelected,
  disabledProduct,
  onHover,
  onPick,
}: {
  product: ProductPickerOption;
  index: number;
  listboxId: string;
  isActive: boolean;
  isSelected: boolean;
  disabledProduct: boolean;
  onHover: (index: number) => void;
  onPick: (product: ProductPickerOption) => void;
}) {
  return (
    <button
      id={`${listboxId}-option-${product.id}`}
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabledProduct}
      data-option-index={index}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={() => {
        if (!disabledProduct) onHover(index);
      }}
      onClick={() => onPick(product)}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left",
        !disabledProduct && isActive && "bg-[#87482D]/8",
        !disabledProduct && !isActive && "hover:bg-zinc-50",
        disabledProduct && "cursor-not-allowed opacity-55"
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-xs font-semibold text-zinc-800">
            {product.name}
          </span>
          {isSelected && <Check className="size-3 shrink-0 text-[#87482D]" />}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
          <span className="font-mono">{product.code}</span>
          {product.category?.name && (
            <>
              <span>·</span>
              <span className="truncate">{product.category.name}</span>
            </>
          )}
          {product.price !== undefined && product.price > 0 && (
            <>
              <span>·</span>
              <span className="font-semibold text-zinc-600">
                Rp {idIntegerFormatter.format(Math.round(product.price))}
              </span>
            </>
          )}
        </span>
      </span>
      {product.stock !== undefined && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
            disabledProduct
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-700"
          )}
        >
          {disabledProduct
            ? "Habis"
            : `${formatQty(product.stock)} ${product.baseUnit.code}`}
        </span>
      )}
    </button>
  );
});

function ProductDropdownPanel({
  panelRef,
  listRef,
  listboxId,
  panelStyle,
  results,
  categories,
  category,
  onCategoryChange,
  activeIndex,
  onActiveIndexChange,
  selectedId,
  allowOutOfStock,
  onPick,
  searchHeader,
  enterHint = "pilih",
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  listboxId: string;
  panelStyle: DropdownPanelStyle;
  results: ProductPickerOption[];
  categories: { name: string; label: string; count: number }[];
  category: string;
  onCategoryChange: (nextCategory: string) => void;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  selectedId?: number;
  allowOutOfStock: boolean;
  onPick: (product: ProductPickerOption) => void;
  searchHeader?: React.ReactNode;
  enterHint?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const effectiveLimit = Math.max(visibleCount, activeIndex + 12);
  const visibleResults = useMemo(
    () => results.slice(0, effectiveLimit),
    [results, effectiveLimit]
  );

  return createPortal(
    <div
      ref={panelRef}
      style={panelStyle}
      className="fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-950/15"
    >
      {(searchHeader || categories.length > 0) && (
        <div className="shrink-0 border-b border-zinc-100 p-2.5">
          {searchHeader}

          {categories.length > 0 && (
            <div className={cn("flex gap-1.5 overflow-x-auto pb-0.5", searchHeader && "mt-2")}>
              {categories.map((item) => {
                const active = category === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setVisibleCount(INITIAL_VISIBLE_COUNT);
                      onCategoryChange(item.name);
                    }}
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors",
                      active
                        ? "border-[#87482D] bg-[#87482D] text-white"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-[#87482D]/30 hover:bg-[#87482D]/5 hover:text-[#87482D]"
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "ml-1 tabular-nums",
                        active ? "text-white/70" : "text-zinc-400"
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-label="Daftar produk"
        onScroll={(event) => {
          const el = event.currentTarget;
          if (
            visibleCount < results.length &&
            el.scrollHeight - el.scrollTop - el.clientHeight < 120
          ) {
            setVisibleCount((prev) =>
              Math.min(results.length, prev + INITIAL_VISIBLE_COUNT)
            );
          }
        }}
        className="min-h-0 flex-1 overflow-y-auto p-1.5"
      >
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <span className="grid size-11 place-items-center rounded-xl bg-zinc-100 text-zinc-400">
              <Search className="size-4" />
            </span>
            <p className="mt-3 text-xs font-semibold text-zinc-600">
              Produk tidak ditemukan
            </p>
            <p className="mt-1 text-[10px] text-zinc-400">
              Coba kata kunci lain atau pilih kategori berbeda.
            </p>
          </div>
        ) : (
          <>
            {visibleResults.map((product, index) => (
              <ProductOptionRow
                key={product.id}
                product={product}
                index={index}
                listboxId={listboxId}
                isActive={index === activeIndex}
                isSelected={selectedId !== undefined && product.id === selectedId}
                disabledProduct={isProductOutOfStock(product, allowOutOfStock)}
                onHover={onActiveIndexChange}
                onPick={onPick}
              />
            ))}
            {visibleResults.length < results.length && (
              <div className="px-2.5 py-2 text-center text-[10px] text-zinc-400">
                Gulir ke bawah untuk memuat{" "}
                {idIntegerFormatter.format(
                  results.length - visibleResults.length
                )}{" "}
                produk lainnya...
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-3 py-2 text-[10px] text-zinc-400">
        <span className="font-medium">
          {idIntegerFormatter.format(results.length)} produk cocok
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-sans text-[9px] font-semibold">
            ↑↓
          </kbd>
          pilih
          <kbd className="ml-1 rounded border border-zinc-200 bg-white px-1 py-0.5 font-sans text-[9px] font-semibold">
            Enter
          </kbd>
          {enterHint}
        </span>
      </div>
    </div>,
    document.body
  );
}

/**
 * Search bar persisten untuk langsung menambahkan barang ke keranjang kasir.
 * Setelah memilih barang, input otomatis dibersihkan dan tetap siap untuk barang berikutnya.
 */
export function ProductQuickSearch({
  products,
  onSelect,
  placeholder = "Cari nama produk, kode, atau kategori untuk menambah...",
  disabled = false,
  allowOutOfStock = true,
  className,
}: {
  products: ProductPickerOption[];
  onSelect: (productId: number) => void;
  placeholder?: string;
  disabled?: boolean;
  allowOutOfStock?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const skipNextFocusOpenRef = useRef(false);
  const keyboardNavRef = useRef(false);
  const listboxId = useId();

  const panelStyle = useDropdownPosition(open, rootRef, panelRef, {
    preferredWidth: "anchor",
    preferredMaxHeight: 340,
    minBelowToStayDown: 180,
  });

  const categories = useMemo(() => buildCategories(products), [products]);
  const results = useMemo(
    () => filterAndScoreProducts(products, query, category),
    [products, query, category]
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !keyboardNavRef.current) return;
    keyboardNavRef.current = false;
    const active = listRef.current?.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const pickProduct = useCallback(
    (product: ProductPickerOption) => {
      if (isProductOutOfStock(product, allowOutOfStock)) return;
      onSelect(product.id);
      setQuery("");
      setCategory("ALL");
      setActiveIndex(0);
      setOpen(false);
      skipNextFocusOpenRef.current = true;
      inputRef.current?.focus();
    },
    [allowOutOfStock, onSelect]
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      keyboardNavRef.current = true;
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) =>
          moveActiveIndex(results, prev, 1, allowOutOfStock)
        );
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (open) {
        keyboardNavRef.current = true;
        setActiveIndex((prev) =>
          moveActiveIndex(results, prev, -1, allowOutOfStock)
        );
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const target = results[activeIndex];
      if (target) pickProduct(target);
      return;
    }
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          onFocus={() => {
            if (skipNextFocusOpenRef.current) {
              skipNextFocusOpenRef.current = false;
              return;
            }
            setActiveIndex(0);
            setOpen(true);
          }}
          onBlur={() => {
            skipNextFocusOpenRef.current = false;
          }}
          onClick={() => {
            skipNextFocusOpenRef.current = false;
            if (!open) {
              setActiveIndex(0);
              setOpen(true);
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && results[activeIndex]
              ? `${listboxId}-option-${results[activeIndex].id}`
              : undefined
          }
          className={cn(
            "h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-9 text-sm text-zinc-900 shadow-xs outline-none transition-all placeholder:text-zinc-400 focus:border-[#87482D] focus:ring-4 focus:ring-[#87482D]/12 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60",
            open && "border-[#87482D] ring-4 ring-[#87482D]/12"
          )}
        />
        {query && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery("");
              setActiveIndex(0);
              setOpen(true);
              inputRef.current?.focus();
            }}
            aria-label="Bersihkan pencarian"
            className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && panelStyle && (
        <ProductDropdownPanel
          panelRef={panelRef}
          listRef={listRef}
          listboxId={listboxId}
          panelStyle={panelStyle}
          results={results}
          categories={categories}
          category={category}
          onCategoryChange={(nextCategory) => {
            setCategory(nextCategory);
            setActiveIndex(0);
          }}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          allowOutOfStock={allowOutOfStock}
          onPick={pickProduct}
          enterHint="tambah"
        />
      )}
    </div>
  );
}

/**
 * Picker produk dengan pencarian, filter kategori, navigasi keyboard, dan
 * panel portal agar tidak terpotong area scroll dialog.
 */
export function ProductPicker({
  products,
  value,
  onChange,
  placeholder = "Cari & pilih barang...",
  disabled = false,
  allowOutOfStock = true,
  className,
}: {
  products: ProductPickerOption[];
  value: number;
  onChange: (productId: number) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Jika false, produk tanpa stok tidak bisa dipilih (mis. untuk penjualan). */
  allowOutOfStock?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const shouldFocusRef = useRef(false);
  const keyboardNavRef = useRef(false);
  const listboxId = useId();

  const panelStyle = useDropdownPosition(open, triggerRef, panelRef, {
    preferredWidth: 420,
    preferredMaxHeight: 360,
    minBelowToStayDown: 220,
  });

  const selected = products.find((product) => product.id === value);

  const categories = useMemo(() => buildCategories(products), [products]);
  const results = useMemo(
    () => filterAndScoreProducts(products, query, category),
    [products, query, category]
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open && panelStyle && shouldFocusRef.current) {
      shouldFocusRef.current = false;
      inputRef.current?.focus();
    }
  }, [open, panelStyle]);

  useEffect(() => {
    if (!open || !keyboardNavRef.current) return;
    keyboardNavRef.current = false;
    const active = listRef.current?.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function openDropdown() {
    setQuery("");
    setCategory("ALL");
    setActiveIndex(0);
    shouldFocusRef.current = true;
    setOpen(true);
  }

  const pickProduct = useCallback(
    (product: ProductPickerOption) => {
      if (isProductOutOfStock(product, allowOutOfStock)) return;
      onChange(product.id);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [allowOutOfStock, onChange]
  );

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      keyboardNavRef.current = true;
      setActiveIndex((prev) =>
        moveActiveIndex(results, prev, 1, allowOutOfStock)
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      keyboardNavRef.current = true;
      setActiveIndex((prev) =>
        moveActiveIndex(results, prev, -1, allowOutOfStock)
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) pickProduct(target);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-900 shadow-xs transition-all hover:border-zinc-300 focus:border-[#87482D] focus:outline-none focus:ring-4 focus:ring-[#87482D]/12 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60",
          open && "border-[#87482D] ring-4 ring-[#87482D]/12",
          className
        )}
      >
        <Search className="size-4 shrink-0 text-zinc-400" />
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-medium",
            !selected && "text-zinc-400"
          )}
        >
          {selected?.name ?? placeholder}
        </span>
        {selected && (
          <span className="hidden shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-zinc-500 sm:inline">
            {selected.code}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-zinc-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && panelStyle && (
        <ProductDropdownPanel
          panelRef={panelRef}
          listRef={listRef}
          listboxId={listboxId}
          panelStyle={panelStyle}
          results={results}
          categories={categories}
          category={category}
          onCategoryChange={(nextCategory) => {
            setCategory(nextCategory);
            setActiveIndex(0);
          }}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          selectedId={value}
          allowOutOfStock={allowOutOfStock}
          onPick={pickProduct}
          searchHeader={
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari nama, kode, atau kategori..."
                aria-label="Cari produk"
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  results[activeIndex]
                    ? `${listboxId}-option-${results[activeIndex].id}`
                    : undefined
                }
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/70 pl-8 pr-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-[#87482D] focus:bg-white focus:ring-4 focus:ring-[#87482D]/12"
              />
            </div>
          }
        />
      )}
    </div>
  );
}
