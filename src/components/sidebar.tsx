"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PawPrint,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";
import { logoutAction } from "@/server/actions/auth.action";
import { getMenuForRole, ROLE_LABEL } from "@/lib/navigation";

interface SidebarProps {
  session: SessionPayload;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  session,
  isMobileOpen,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const groups = getMenuForRole(session.role);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Master Data": true,
    Transaksi: true,
    Laporan: true,
    Pengaturan: true,
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const initials = session.name.charAt(0).toUpperCase();

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-zinc-950/45 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          isMobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col overflow-hidden bg-[#87482D] text-white shadow-[18px_0_50px_-24px_rgba(109,58,36,0.65)] transition-[width,transform] duration-300 ease-out lg:static lg:z-auto lg:h-screen lg:translate-x-0",
          collapsed ? "w-[272px] lg:w-[88px]" : "w-[272px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Decorative layers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-20 size-64 rounded-full bg-white/[0.07] blur-2xl" />
          <div className="absolute -bottom-20 -left-16 size-64 rounded-full bg-black/10 blur-2xl" />
          <div className="absolute left-1/2 top-1/3 size-40 -translate-x-1/2 rounded-full bg-white/[0.04] blur-xl" />
        </div>

        {/* Brand */}
        <div
          className={cn(
            "relative flex h-20 shrink-0 items-center border-b border-white/10 px-4",
            collapsed ? "lg:justify-center" : "justify-between"
          )}
        >
          <Link
            href="/"
            onClick={onMobileClose}
            className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#FBF7F3] text-[#87482D] shadow-lg shadow-black/10 transition-transform duration-200 group-hover:-rotate-6">
              <PawPrint className="size-6" />
            </div>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <h1 className="font-display text-base font-bold leading-tight tracking-tight">
                MOFU
              </h1>
              <p className="text-[11px] font-medium text-white/55">
                Petshop &amp; Care
              </p>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            aria-label="Tutup menu"
            className="grid size-10 place-items-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>

          {/* Desktop collapse */}
          {!collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              aria-label="Ciutkan sidebar"
              className="hidden size-9 place-items-center rounded-xl text-white/45 transition-colors hover:bg-white/10 hover:text-white lg:grid"
            >
              <PanelLeftClose className="size-4.5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-3 py-4">
          <NavLink
            href="/"
            icon={<LayoutDashboard className="size-4.5" />}
            label="Dashboard"
            active={pathname === "/"}
            collapsed={collapsed}
            onNavigate={onMobileClose}
          />

          {groups.map((group) => {
            const isOpen = collapsed || openGroups[group.label];

            return (
              <div
                key={group.label}
                className={cn("pt-2", collapsed && "lg:pt-0")}
              >
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white/70",
                    collapsed && "lg:hidden"
                  )}
                  aria-expanded={isOpen}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      isOpen ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "mt-1 space-y-1 overflow-hidden",
                    !isOpen && "hidden"
                  )}
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    return (
                      <NavLink
                        key={item.href}
                        href={item.href}
                        icon={<Icon className="size-4.5" />}
                        label={item.label}
                        active={isActive}
                        collapsed={collapsed}
                        onNavigate={onMobileClose}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="relative shrink-0 border-t border-white/10 p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl bg-white/[0.08] p-2.5 ring-1 ring-white/10",
              collapsed && "lg:flex-col lg:gap-2 lg:p-2"
            )}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FBF7F3] text-sm font-bold text-[#87482D] shadow-sm">
              {initials}
            </div>
            <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
              <p className="truncate text-[13px] font-semibold text-white">
                {session.name}
              </p>
              <p className="truncate text-[11px] text-white/50">
                {ROLE_LABEL[session.role]}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Keluar"
                aria-label="Keluar dari akun"
                className="grid size-9 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>

          {collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              aria-label="Perluas sidebar"
              className="mt-2 hidden w-full place-items-center rounded-xl py-2 text-white/45 transition-colors hover:bg-white/10 hover:text-white lg:grid"
            >
              <PanelLeftOpen className="size-4.5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-11 items-center gap-3 rounded-2xl px-3 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20",
        collapsed && "lg:justify-center lg:px-0",
        active
          ? "bg-[#FBF7F3] font-semibold text-[#87482D] shadow-[0_10px_28px_-14px_rgba(0,0,0,0.55)]"
          : "text-white/70 hover:bg-white/10 hover:text-white active:scale-[0.99]"
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
          active ? "bg-[#87482D]/10 text-[#87482D]" : "text-white/60 group-hover:text-white"
        )}
      >
        {icon}
      </span>
      <span className={cn("truncate", collapsed && "lg:hidden")}>{label}</span>
      {active && !collapsed && (
        <span className="ml-auto size-1.5 rounded-full bg-[#87482D]" />
      )}
    </Link>
  );
}
