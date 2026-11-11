"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Menu, Search, Bell } from "lucide-react";
import type { SessionPayload } from "@/lib/auth";

interface DashboardShellProps {
  session: SessionPayload;
  children: React.ReactNode;
}

export function DashboardShell({ session, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        session={session}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-zinc-200/80 flex items-center justify-between px-4 lg:px-6 shrink-0">
          {/* Left: hamburger + search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-zinc-600 hover:text-zinc-900 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-zinc-100/80 border border-zinc-200/50 rounded-xl px-3 py-2 w-72">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari produk, faktur..."
                className="bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none w-full"
              />
            </div>
          </div>

          {/* Right: notifications */}
          <div className="flex items-center gap-3">
            <button className="relative text-zinc-500 hover:text-zinc-800 p-2 rounded-xl hover:bg-zinc-100 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
