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
  ClipboardList,
  Cog,
  Car,
  Image,
  Users,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";

const items = [
  {
    key: "dashboard",
    label: "Tổng quát",
    icon: LayoutDashboard,
    href: "/admin", 
  },
  {
    key: "services",
    label: "Quản lý service",
    icon: Cog,
    href: "/admin/services", 
  },
  {
    key: "models",
    label: "Quản lý model",
    icon: Car,
    href: "/admin/models", 
  },
  {
    key: "banners",
    label: "Quản lý banner",
    icon: Image,
    href: "/admin/banners", 
  },
  {
    key: "staff",
    label: "Quản lý staff",
    icon: Users,
    href: "/admin/staff", 
  },
];

export default function AdminSidebar({
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
                // Cập nhật logic kiểm tra active
                const isActive = (it.href === "/admin") 
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
                              "font-semibold text-red-600": isActive, 
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
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "text-gray-500 hover:bg-gray-100"
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