"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  Command,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/nav/command-palette";
import { logoutAction } from "@/server/actions/auth.action";
import {
  DASHBOARD_ITEM,
  getActiveMenuItem,
  ROLE_LABEL,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";

interface DashboardShellProps {
  session: SessionPayload;
  children: React.ReactNode;
  lowStockCount?: number;
  initialCollapsed?: boolean;
}

export function DashboardShell({
  session,
  children,
  lowStockCount = 0,
  initialCollapsed = false,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const active = pathname === "/" ? null : getActiveMenuItem(pathname);
  const pageTitle =
    pathname === "/" ? DASHBOARD_ITEM.label : active?.item.label ?? "Dashboard";
  const groupTitle =
    pathname === "/" ? "Utama" : active?.group.label ?? "Menu";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotifOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      document.cookie = `mofu-sidebar=${
        next ? "collapsed" : "expanded"
      }; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  };

  const initials = session.name.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        session={session}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 shrink-0 border-b border-zinc-200/70 bg-[#f5f6f8]/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-7">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
              className="grid size-10 place-items-center rounded-xl text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900 lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            {/* Breadcrumb */}
            <div className="min-w-0">
              <div className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:flex">
                <span>{groupTitle}</span>
                <span className="text-zinc-300">/</span>
                <span className="text-[#87482D]">{pageTitle}</span>
              </div>
              <p className="truncate font-display text-[15px] font-semibold text-zinc-900 sm:hidden">
                {pageTitle}
              </p>
              <p className="hidden text-[13px] font-medium text-zinc-500 sm:block">
                MOFU Petshop &amp; Care
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {/* Search / command */}
              <button
                onClick={() => setPaletteOpen(true)}
                className="group hidden h-10 w-64 items-center gap-2.5 rounded-xl border border-zinc-200 bg-white/70 px-3 text-left text-[13px] text-zinc-400 shadow-xs transition-all hover:border-zinc-300 hover:bg-white md:flex"
                aria-label="Cari menu (Command K)"
              >
                <Search className="size-4 shrink-0 text-zinc-400 transition-colors group-hover:text-[#87482D]" />
                <span className="flex-1 truncate">Cari menu atau aksi...</span>
                <kbd className="flex items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                  <Command className="size-2.5" />K
                </kbd>
              </button>

              <button
                onClick={() => setPaletteOpen(true)}
                aria-label="Cari menu"
                className="grid size-10 place-items-center rounded-xl text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900 md:hidden"
              >
                <Search className="size-5" />
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen((open) => !open);
                    setUserOpen(false);
                  }}
                  aria-label="Notifikasi"
                  aria-expanded={notifOpen}
                  className="relative grid size-10 place-items-center rounded-xl text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
                >
                  <Bell className="size-5" />
                  {lowStockCount > 0 && (
                    <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-red-500 ring-2 ring-[#f5f6f8]" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] animate-pop overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-xl shadow-zinc-950/10">
                    <div className="border-b border-zinc-100 px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-900">
                        Notifikasi
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Ringkasan yang perlu perhatian
                      </p>
                    </div>
                    {lowStockCount > 0 ? (
                      <Link
                        href="/reports/low-stock"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[#87482D]/5"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                          <AlertTriangle className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-zinc-900">
                            {lowStockCount} produk stok kritis
                          </span>
                          <span className="mt-0.5 block text-[11px] text-zinc-500">
                            Stok di bawah batas minimum. Segera lakukan
                            restock.
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-5">
                        <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                          <ShieldCheck className="size-4" />
                        </span>
                        <p className="text-[13px] text-zinc-500">
                          Semua stok dalam kondisi aman.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className="hidden h-7 w-px bg-zinc-200 sm:block" />

              {/* User menu */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => {
                    setUserOpen((open) => !open);
                    setNotifOpen(false);
                  }}
                  aria-expanded={userOpen}
                  className="flex items-center gap-2.5 rounded-xl p-1 pr-1 transition-colors hover:bg-white sm:pr-2"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-[#87482D] text-[13px] font-bold text-white shadow-sm shadow-[#87482D]/25">
                    {initials}
                  </span>
                  <span className="hidden min-w-0 text-left sm:block">
                    <span className="block max-w-[9rem] truncate text-[13px] font-semibold leading-tight text-zinc-900">
                      {session.name}
                    </span>
                    <span className="block text-[10px] font-medium text-zinc-400">
                      {ROLE_LABEL[session.role]}
                    </span>
                  </span>
                  <ChevronDown className="hidden size-3.5 text-zinc-400 sm:block" />
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 animate-pop overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-xl shadow-zinc-950/10">
                    <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4">
                      <span className="grid size-10 place-items-center rounded-full bg-[#87482D] text-sm font-bold text-white">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-zinc-900">
                          {session.name}
                        </p>
                        <p className="truncate text-[11px] text-zinc-400">
                          {session.email}
                        </p>
                      </div>
                    </div>

                    <div className="p-1.5">
                      {session.role === "ADMIN" ? (
                        <>
                          <Link
                            href="/settings/users"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                          >
                            <UserRound className="size-4 text-zinc-400" />
                            Manajemen User
                          </Link>
                          <Link
                            href="/settings/backup"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                          >
                            <Settings className="size-4 text-zinc-400" />
                            Pengaturan &amp; Backup
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                        >
                          <LayoutDashboard className="size-4 text-zinc-400" />
                          Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-zinc-100 p-1.5">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="size-4" />
                          Keluar
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-7">
          <div className={cn("mx-auto w-full max-w-7xl")}>{children}</div>
        </main>
      </div>

      {paletteOpen && (
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          role={session.role}
        />
      )}
    </div>
  );
}
