import React from "react";
import {
  sidebarDividerLine as imgLine,
} from "@/assets/admin/sidebar_new";
import imgLogo from "@/assets/logo-with-brand.png";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  Home,
  Wrench,
  ClipboardList,
  Building2,
  Users,
  CalendarCheck,
  Gift,
  ScrollText,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";

const items = [
  { key: "home", label: "Dashboard", icon: Home, href: "/manager" },
  {
    key: "parts",
    label: "Quản lý phụ tùng",
    icon: Wrench,
    href: "/manager/items",
  },
  {
    key: "goodReceipts",
    label: "Quản lý phiếu nhập ",
    icon: ClipboardList,
    href: "/manager/goods-receipt-list",
  },
  {
    key: "bays",
    label: "Quản lý bay",
    icon: Building2,
    href: "/manager/bays",
  },
  { key: "staff", label: "Staff", icon: Users, href: "/manager/staff" },
  {
    key: "attendance",
    label: "Điểm danh",
    icon: CalendarCheck,
    href: "/manager/attendance-tracking",
  },
  {
    key: "loyalty",
    label: "Điểm thưởng",
    icon: Gift,
    href: "/manager/loyalty",
  },
];

export default function ManagerSidebar({
  width = 80,
  offsetTop = 100,
  expanded = true,
  expandedWidth = 200,
  onExpandToggle = () => { },
}) {
  const location = useLocation();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      toast.success("Đăng xuất thành công");
      await signOut(() => navigate("/"));
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  return (
    <aside
      className="fixed left-0 z-40 bg-white transition-all"
      // Loại bỏ style width cứng để dùng class của Tailwind
      style={{ top: 0, width: expanded ? expandedWidth : width, bottom: 0 }}
    >
      <div className="absolute inset-y-0 right-0 w-px">
        <img alt="imgLine" src={imgLine} className="w-px h-full" />
      </div>
      <div className="flex flex-col h-full item-start pl-7">
        <div className="flex flex-col items-center pr-7">
          <Link to={"/manager"}>
            <img
              alt="imgLogo"
              src={imgLogo}
              className="w-24 h-24 mt-4"
            />

          </Link>
        </div>
        <TooltipProvider>
          <nav
            className="flex flex-col justify-between flex-1 items-start pb-5"
            style={{ marginTop: Math.max(0, offsetTop - 54) }}
          >
            <div className="flex flex-col gap-3">
              {items.map((it) => {
                const Icon = it.icon; // Icon giờ luôn là component
                const isActive =
                  it.href === "/manager"
                    ? location.pathname === it.href
                    : location.pathname.startsWith(it.href);

                return (
                  <Tooltip key={it.key}>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <span
                          className={cn(
                            "absolute ml-4 left-full top-1/2 transform -translate-y-1/2 whitespace-nowrap text-sm font-medium transition",
                            {
                              "opacity-0": !expanded,
                              "opacity-100": expanded,
                              "font-semibold text-red-600": isActive, // Style text khi active
                              "text-gray-700": !isActive,
                            }
                          )}
                        >
                          {it.label}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-xl size-11 shadow-sm transition-colors ${isActive
                            ? "bg-red-50 text-red-600 hover:bg-red-100" // Style nút khi active
                            : "text-gray-500 hover:bg-gray-100" // Style nút khi không active
                            }`}
                          asChild={Boolean(it.href)}
                        >
                          {it.href ? (
                            <Link
                              to={it.href}
                              aria-current={isActive ? "page" : undefined}
                            >
                              <Icon className="size-7" />
                            </Link>
                          ) : (
                            <Icon className="size-7" />
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">{it.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <span
                      className={cn(
                        "absolute ml-4 left-full top-1/2 transform -translate-y-1/2 whitespace-nowrap text-sm font-medium transition",
                        {
                          "opacity-0": !expanded,
                          "opacity-100": expanded,
                        }
                      )}
                    >
                      Đăng xuất
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="rounded-xl size-11 shadow-sm transition-colors text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="size-7" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Đăng xuất</TooltipContent>
              </Tooltip>
              <Button variant="ghost" onClick={onExpandToggle}>
                <ChevronRight
                  className={cn(
                    "size-6 transition-transform",
                    expanded ? "rotate-180" : "rotate-0"
                  )}
                />
              </Button>
            </div>
          </nav>
        </TooltipProvider>
      </div>
    </aside >
  );
}
