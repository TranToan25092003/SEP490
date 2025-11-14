import React from "react";
import {
  sidebarLogo as imgLogo,
  sidebarDividerLine as imgLine,
} from "@/assets/admin/sidebar_new";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Wrench,
  MessageSquareWarning,
  Package,
  Calendar1,
  MessageCircle,
  FileText,
  LogOut,
  Home
} from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";

const items = [
  {
    key: "dashboard",
    label: "Tổng quát",
    icon: Home,
    href: "/staff",
  },
  {
    key: "bookings",
    label: "Quản lý đặt lịch",
    icon: Calendar1,
    href: "/staff/booking",
  },
  {
    key: "orders",
    label: "Quản lý lệnh",
    icon: Package,
    href: "/staff/service-order",
  },
  {
    key: "invoices",
    label: "Hóa đơn",
    icon: FileText,
    href: "/staff/invoices",
  },
  {
    key: "parts",
    label: "Quản lý phụ tùng",
    icon: Wrench,
    href: "/staff/items",
  },
  {
    key: "complaint",
    label: "Khiếu nại",
    icon: MessageSquareWarning,
    href: "/staff/complaints",
  },
  {
    key: "chat",
    label: "Chat",
    icon: MessageCircle,
    href: "/staff/chat",
  },
];

export default function StaffSideBar({
  width = 80,
  offsetTop = 100,
  expanded = true,
  expandedWidth = 200,
  onExpandToggle = () => {},
}) {
  const location = useLocation();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(() => navigate("/"));
      toast.success("Đăng xuất thành công");
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  return (
    <aside
      className="fixed left-0 z-40 bg-white transition-all"
      style={{ top: 0, width: expanded ? expandedWidth : width, bottom: 0 }}
    >
      <div className="absolute inset-y-0 right-0 w-px">
        <img alt="" src={imgLine} className="w-px h-full" />
      </div>
      <div className="flex flex-col h-full item-start pl-7">
        <img alt="" src={imgLogo} className="w-[43px] h-[43px] mt-4" />
        <TooltipProvider>
          <nav
            className="flex flex-col justify-between flex-1 items-start pb-5"
            style={{ marginTop: Math.max(0, offsetTop - 54) }}
          >
            <div className="flex flex-col gap-3">
              {items.map((it) => {
                const Icon = it.icon;
                // Kiểm tra xem mục này có đang hoạt động không
                // Xử lý trường hợp đặc biệt cho trang chủ dashboard
                const isActive =
                  it.href === "/staff"
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
                          className={`rounded-xl size-11 shadow-sm transition-colors ${
                            isActive
                              ? "bg-red-50 text-red-600 hover:bg-red-100" // Style khi active
                              : "text-gray-500 hover:bg-gray-100" // Style khi không active
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
    </aside>
  );
}
