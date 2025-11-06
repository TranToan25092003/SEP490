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
  LayoutDashboard,
  Wrench,
  MessageSquareWarning,
  Package,
  Calendar1,
  MessageCircle,
  LogOut,
} from "lucide-react";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";

const items = [
  {
    key: "dashboard",
    label: "Tổng quát",
    icon: LayoutDashboard,
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
    key: "parts",
    label: "Quản lý phụ tùng",
    icon: Wrench,
    href: "/staff/items",
  },
  {
    key: "complaint",
    label: "Xem tồn kho",
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
            className="flex flex-col items-center w-full"
            style={{ marginTop: Math.max(0, offsetTop - 54) }}
          >
            {items.map((it, index) => {
              const Icon = it.icon;
              // Kiểm tra xem mục này có đang hoạt động không
              // Xử lý trường hợp đặc biệt cho trang chủ dashboard
              const isActive =
                it.href === "/staff"
                  ? location.pathname === it.href
                  : location.pathname.startsWith(it.href);

              return (
                <div key={it.key} className="w-full flex flex-col items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-xl size-11 shadow-sm transition-colors mb-2 ${
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
                            <div className="flex flex-col items-center gap-1">
                              <Icon className="size-7" />
                              <span className="text-[10px] leading-none text-gray-700">
                                {it.label}
                              </span>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Icon className="size-7" />
                            <span className="text-[10px] leading-none text-gray-700">
                              {it.label}
                            </span>
                          </div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{it.label}</TooltipContent>
                  </Tooltip>
                  {index < items.length - 1 && (
                    <div className="w-3/4 border-b border-gray-200 my-2"></div>
                  )}
                </div>
              );
            })}
          </nav>
        </TooltipProvider>
      </div>
    </aside>
  );
}
