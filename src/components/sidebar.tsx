"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Tags,
  Ruler,
  Truck,
  Users,
  UserCheck,
  MapPin,
  FileText,
  ShoppingCart,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  BarChart3,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  PawPrint,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Settings,
  BoxesIcon,
  DollarSign,
  Database,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";
import { logoutAction } from "@/server/actions/auth.action";

// ────────── Menu Configuration ──────────

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ("ADMIN" | "CASHIER" | "SALESMAN")[];
}

interface MenuGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
  roles?: ("ADMIN" | "CASHIER" | "SALESMAN")[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Master Data",
    icon: Package,
    roles: ["ADMIN"],
    items: [
      { label: "Produk", href: "/master/products", icon: Package },
      { label: "Kategori", href: "/master/categories", icon: Tags },
      { label: "Satuan", href: "/master/units", icon: Ruler },
      { label: "Supplier", href: "/master/suppliers", icon: Truck },
      { label: "Customer", href: "/master/customers", icon: Users },
      { label: "Salesman", href: "/master/salesmen", icon: UserCheck },
      { label: "Wilayah", href: "/master/regions", icon: MapPin },
    ],
  },
  {
    label: "Transaksi",
    icon: FileText,
    items: [
      { label: "Faktur Penjualan", href: "/transactions/sales", icon: ShoppingCart },
      { label: "Faktur Pembelian", href: "/transactions/purchases", icon: FileText, roles: ["ADMIN"] },
      { label: "Stock Masuk", href: "/stock/in", icon: PackagePlus, roles: ["ADMIN"] },
      { label: "Stock Keluar", href: "/stock/out", icon: PackageMinus, roles: ["ADMIN"] },
      { label: "Retur", href: "/returns", icon: RotateCcw },
    ],
  },
  {
    label: "Laporan",
    icon: BarChart3,
    roles: ["ADMIN"],
    items: [
      { label: "Laporan Stok", href: "/reports/stock", icon: BoxesIcon },
      { label: "Laporan Penjualan", href: "/reports/sales", icon: ShoppingCart },
      { label: "Laporan Pembelian", href: "/reports/purchases", icon: FileText },
      { label: "Laporan Profit", href: "/reports/profit", icon: DollarSign },
      { label: "Fast Moving", href: "/reports/fast-moving", icon: TrendingUp },
      { label: "Slow Moving", href: "/reports/slow-moving", icon: TrendingDown },
      { label: "Stok Kritis", href: "/reports/low-stock", icon: AlertTriangle },
    ],
  },
  {
    label: "Pengaturan",
    icon: Settings,
    roles: ["ADMIN"],
    items: [
      { label: "Manajemen User", href: "/settings/users", icon: Users },
      { label: "Backup Data", href: "/settings/backup", icon: Database },
    ],
  },
];

// ────────── Sidebar Component ──────────

interface SidebarProps {
  session: SessionPayload;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ session, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Master Data": true,
    "Transaksi": true,
    "Laporan": true,
    "Pengaturan": true,
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Filter menu berdasarkan role
  const filteredGroups = menuGroups
    .filter((group) => !group.roles || group.roles.includes(session.role))
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || item.roles.includes(session.role)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrator",
    CASHIER: "Kasir",
    SALESMAN: "Salesman",
  };

  return (
    <>
      {/* Overlay mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-zinc-200/80 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto shadow-xs",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#87482D] rounded-xl flex items-center justify-center shadow-sm shadow-[#87482D]/20">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-zinc-900 font-bold text-sm leading-tight tracking-tight">MOFU</h1>
              <p className="text-zinc-400 text-xs">Petshop & Care</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Dashboard link */}
          <Link
            href="/"
            onClick={onMobileClose}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              pathname === "/"
                ? "bg-[#87482D] text-white shadow-sm shadow-[#87482D]/25 font-semibold"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          {/* Menu groups */}
          {filteredGroups.map((group) => (
            <div key={group.label} className="pt-3">
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform",
                    openGroups[group.label] ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>

              {openGroups[group.label] && (
                <div className="space-y-0.5 mt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileClose}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm transition-all duration-150",
                          isActive
                            ? "bg-[#87482D] text-white font-medium shadow-sm shadow-[#87482D]/25"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User info & Logout */}
        <div className="border-t border-zinc-100 p-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#87482D]/10 flex items-center justify-center text-[#87482D] font-bold text-sm border border-[#87482D]/20">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">
                {session.name}
              </p>
              <p className="text-xs text-zinc-400">{roleLabel[session.role]}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-zinc-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-zinc-200/60 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
