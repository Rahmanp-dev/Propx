"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  IndianRupee,
  Wrench,
  Zap,
  BookOpen,
  MessageCircle,
  UserPlus,
  Settings,
  ReceiptText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { UserButton } from "@/components/shared/user-button";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-sky-500",
    hoverBg: "hover:bg-sky-500/10",
    borderColor: "border-sky-500",
    hoverBorderColor: "hover:border-sky-500",
    hoverColor: "group-hover:text-sky-500",
  },
  {
    label: "Buildings",
    href: "/buildings",
    icon: Building2,
    color: "text-violet-500",
    hoverBg: "hover:bg-violet-500/10",
    borderColor: "border-violet-500",
    hoverBorderColor: "hover:border-violet-500",
    hoverColor: "group-hover:text-violet-500",
  },
  {
    label: "Tenants",
    href: "/tenants",
    icon: Users,
    color: "text-pink-700",
    hoverBg: "hover:bg-pink-700/10",
    borderColor: "border-pink-700",
    hoverBorderColor: "hover:border-pink-700",
    hoverColor: "group-hover:text-pink-700",
  },
  {
    label: "Finance",
    href: "/finance",
    icon: IndianRupee,
    color: "text-emerald-500",
    hoverBg: "hover:bg-emerald-500/10",
    borderColor: "border-emerald-500",
    hoverBorderColor: "hover:border-emerald-500",
    hoverColor: "group-hover:text-emerald-500",
  },
  {
    label: "Electricity",
    href: "/electricity",
    icon: Zap,
    color: "text-yellow-500",
    hoverBg: "hover:bg-yellow-500/10",
    borderColor: "border-yellow-500",
    hoverBorderColor: "hover:border-yellow-500",
    hoverColor: "group-hover:text-yellow-500",
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    color: "text-orange-500",
    hoverBg: "hover:bg-orange-500/10",
    borderColor: "border-orange-500",
    hoverBorderColor: "hover:border-orange-500",
    hoverColor: "group-hover:text-orange-500",
  },
  {
    label: "Ledger",
    href: "/ledger",
    icon: BookOpen,
    color: "text-teal-500",
    hoverBg: "hover:bg-teal-500/10",
    borderColor: "border-teal-500",
    hoverBorderColor: "hover:border-teal-500",
    hoverColor: "group-hover:text-teal-500",
  },
  {
    label: "Receipts",
    href: "/receipts",
    icon: ReceiptText,
    color: "text-indigo-500",
    hoverBg: "hover:bg-indigo-500/10",
    borderColor: "border-indigo-500",
    hoverBorderColor: "hover:border-indigo-500",
    hoverColor: "group-hover:text-indigo-500",
  },
  {
    label: "WhatsApp",
    href: "/whatsapp",
    icon: MessageCircle,
    color: "text-green-500",
    hoverBg: "hover:bg-green-500/10",
    borderColor: "border-green-500",
    hoverBorderColor: "hover:border-green-500",
    hoverColor: "group-hover:text-green-500",
  },
  {
    label: "Inquiries",
    href: "/inquiries",
    icon: UserPlus,
    color: "text-cyan-500",
    hoverBg: "hover:bg-cyan-500/10",
    borderColor: "border-cyan-500",
    hoverBorderColor: "hover:border-cyan-500",
    hoverColor: "group-hover:text-cyan-500",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    color: "text-zinc-400",
    hoverBg: "hover:bg-zinc-400/10",
    borderColor: "border-zinc-400",
    hoverBorderColor: "hover:border-zinc-400",
    hoverColor: "group-hover:text-zinc-300",
  },
];

export function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#0f172a] bg-gradient-to-b from-[#0f172a] via-[#101d35] to-[#0c1425] border-r border-white/5 shadow-2xl">
      {/* ── Logo Area ── */}
      <div className="relative flex items-center gap-3 px-6 py-6">
        {/* Gradient accent behind the logo */}
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-violet-500/8 to-transparent pointer-events-none" />
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 shadow-lg shadow-sky-500/20">
          <span className="text-sm font-extrabold tracking-tight text-white">
            PX
          </span>
        </div>
        <div className="relative">
          <h1 className="text-lg font-bold tracking-wide text-white">
            Prop<span className="text-sky-400">X</span>
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
            Owner Panel
          </p>
        </div>

        {/* Notification bell */}
        <div className="relative ml-auto">
          <NotificationBell />
        </div>
      </div>

      {/* Subtle separator */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/40">
        {navItems.map((item) => {
          const userId = user?.id || user?.name?.toLowerCase().replace(/\s+/g, '-') || 'user';
          const dynamicHref = `/${userId}${item.href}`;
          const isActive =
            pathname === dynamicHref || pathname?.startsWith(dynamicHref + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={dynamicHref}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "border-l-[3px] border-transparent",
                isActive
                  ? cn(
                      item.borderColor,
                      "bg-white/[0.06] text-white",
                    )
                  : cn(
                      "text-slate-400",
                      item.hoverBg,
                      "hover:text-white hover:border-l-[3px]",
                      item.hoverBorderColor,
                    ),
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                  isActive ? item.color : cn("text-slate-500", item.hoverColor),
                )}
              />
              <span
                className={cn(
                  "transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-white",
                )}
              >
                {item.label}
              </span>

              {/* Active indicator glow */}
              {isActive && (
                <span className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-current opacity-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

      {/* ── User / Logout Section ── */}
      <div className="px-3 py-4">
        <UserButton user={user} />
      </div>
    </div>
  );
}
