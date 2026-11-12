import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Database,
  DollarSign,
  FileText,
  LayoutDashboard,
  MapPin,
  Package,
  PackageMinus,
  PackagePlus,
  RotateCcw,
  Ruler,
  Settings,
  ShoppingCart,
  Tags,
  TrendingDown,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type UserRole = "ADMIN" | "CASHIER" | "SALESMAN";

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  roles?: UserRole[];
}

export interface MenuGroup {
  label: string;
  icon: LucideIcon;
  items: MenuItem[];
  roles?: UserRole[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Master Data",
    icon: Package,
    roles: ["ADMIN"],
    items: [
      {
        label: "Produk",
        href: "/master/products",
        icon: Package,
        description: "Katalog produk, satuan, dan margin",
      },
      {
        label: "Kategori",
        href: "/master/categories",
        icon: Tags,
        description: "Kelompok produk & margin default",
      },
      {
        label: "Satuan",
        href: "/master/units",
        icon: Ruler,
        description: "Satuan dasar dan konversi",
      },
      {
        label: "Supplier",
        href: "/master/suppliers",
        icon: Truck,
        description: "Data pemasok produk",
      },
      {
        label: "Customer",
        href: "/master/customers",
        icon: Users,
        description: "Data pelanggan toko",
      },
      {
        label: "Salesman",
        href: "/master/salesmen",
        icon: UserCheck,
        description: "Data salesman & wilayah",
      },
      {
        label: "Wilayah",
        href: "/master/regions",
        icon: MapPin,
        description: "Wilayah pemasaran",
      },
    ],
  },
  {
    label: "Transaksi",
    icon: FileText,
    items: [
      {
        label: "Faktur Penjualan",
        href: "/transactions/sales",
        icon: ShoppingCart,
        description: "Kasir, POS, dan riwayat penjualan",
      },
      {
        label: "Faktur Pembelian",
        href: "/transactions/purchases",
        icon: FileText,
        description: "Pembelian stok dari supplier",
        roles: ["ADMIN"],
      },
      {
        label: "Stock Masuk",
        href: "/stock/in",
        icon: PackagePlus,
        description: "Penyesuaian dan riwayat stok masuk",
        roles: ["ADMIN"],
      },
      {
        label: "Stock Keluar",
        href: "/stock/out",
        icon: PackageMinus,
        description: "Penyesuaian dan riwayat stok keluar",
        roles: ["ADMIN"],
      },
      {
        label: "Retur",
        href: "/returns",
        icon: RotateCcw,
        description: "Retur customer dan supplier",
      },
    ],
  },
  {
    label: "Laporan",
    icon: BarChart3,
    roles: ["ADMIN"],
    items: [
      {
        label: "Laporan Stok",
        href: "/reports/stock",
        icon: Boxes,
        description: "Nilai persediaan dan stok aktif",
      },
      {
        label: "Laporan Penjualan",
        href: "/reports/sales",
        icon: ShoppingCart,
        description: "Rekap omzet dan transaksi",
      },
      {
        label: "Laporan Pembelian",
        href: "/reports/purchases",
        icon: FileText,
        description: "Rekap belanja ke supplier",
      },
      {
        label: "Laporan Profit",
        href: "/reports/profit",
        icon: DollarSign,
        description: "Laba kotor berbasis HPP FIFO",
      },
      {
        label: "Fast Moving",
        href: "/reports/fast-moving",
        icon: TrendingUp,
        description: "Produk paling cepat terjual",
      },
      {
        label: "Slow Moving",
        href: "/reports/slow-moving",
        icon: TrendingDown,
        description: "Produk lambat & dead stock",
      },
      {
        label: "Stok Kritis",
        href: "/reports/low-stock",
        icon: AlertTriangle,
        description: "Produk yang perlu segera restock",
      },
    ],
  },
  {
    label: "Pengaturan",
    icon: Settings,
    roles: ["ADMIN"],
    items: [
      {
        label: "Manajemen User",
        href: "/settings/users",
        icon: Users,
        description: "Akun, peran, dan akses pengguna",
      },
      {
        label: "Backup Data",
        href: "/settings/backup",
        icon: Database,
        description: "Panduan backup & restore database",
      },
    ],
  },
];

export function getMenuForRole(role: UserRole): MenuGroup[] {
  return MENU_GROUPS.filter(
    (group) => !group.roles || group.roles.includes(role)
  )
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || item.roles.includes(role)
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function getActiveMenuItem(pathname: string) {
  for (const group of MENU_GROUPS) {
    const item = group.items.find(
      (entry) =>
        pathname === entry.href || pathname.startsWith(`${entry.href}/`)
    );
    if (item) return { group, item };
  }
  return null;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrator",
  CASHIER: "Kasir / Staff",
  SALESMAN: "Salesman",
};

export const DASHBOARD_ITEM: MenuItem = {
  label: "Dashboard",
  href: "/",
  icon: LayoutDashboard,
  description: "Ringkasan operasional toko",
};
