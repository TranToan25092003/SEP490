import React from "react";
import { sidebarDividerLine as imgLine } from "@/assets/admin/sidebar_new";
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
  Cog,
  Car,
  Image,
  Users,
  ScrollText,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveStaffFullName } from "@/utils/staffNameResolver";

const items = [
  {
    key: "dashboard",
    label: "Tổng quát",
    icon: Home,
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
  // {
  //   key: "staff",
  //   label: "Quản lý staff",
  //   icon: Users,
  //   href: "/admin/staff",
  // },
  {
    key: "log",
    label: "Log",
    icon: ScrollText,
    href: "/admin/activity-logs",
  },
];

export default function AdminSidebar({
  width = 80,
  offsetTop = 100,
  expanded = true,
  expandedWidth = 200,
  onExpandToggle = () => {},
}) {
  const location = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
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
        <img alt="imgLine" src={imgLine} className="w-px h-full" />
      </div>
      <div className="flex flex-col h-full item-start pl-7">
        <div className="flex flex-col items-center pr-7">
          <Link to={"/admin"}>
            <img alt="imgLogo" src={imgLogo} className="w-24 h-24 mt-4" />
          </Link>
        </div>
        <TooltipProvider
          delayDuration={expanded ? 999999 : 700}
          disableHoverableContent
        >
          <nav
            className="flex flex-col justify-between flex-1 items-start pb-5"
            style={{ marginTop: Math.max(0, offsetTop - 54) }}
          >
            <div className="flex flex-col gap-3">
              {items.map((it) => {
                const Icon = it.icon;
                // Cập nhật logic kiểm tra active
                const isActive =
                  it.href === "/admin"
                    ? location.pathname === it.href
                    : location.pathname.startsWith(it.href);

                return (
                  <Tooltip key={it.key} open={expanded ? false : undefined}>
                    <TooltipTrigger asChild disabled={expanded}>
                      <div className="relative group">
                        {it.href ? (
                          <Link
                            to={it.href}
                            className={cn(
                              "absolute ml-4 left-full top-1/2 transform -translate-y-1/2 whitespace-nowrap text-sm font-medium transition cursor-pointer hover:text-red-600",
                              {
                                "opacity-0 pointer-events-none": !expanded,
                                "opacity-100 pointer-events-auto": expanded,
                                "font-semibold text-red-600": isActive,
                                "text-gray-700": !isActive,
                              }
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {it.label}
                          </Link>
                        ) : (
                        <span
                          className={cn(
                            "absolute ml-4 left-full top-1/2 transform -translate-y-1/2 whitespace-nowrap text-sm font-medium transition group-hover:text-red-600",
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
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-xl size-11 shadow-sm transition-colors ${
                            isActive
                              ? "bg-red-50 text-red-600 hover:text-red-600 hover:bg-red-50 active:bg-red-50 focus:bg-red-50 focus-visible:bg-red-50" // Style khi active - giữ background và màu đỏ
                              : "text-gray-500 hover:text-red-600 hover:bg-transparent active:bg-transparent focus:bg-transparent focus-visible:bg-transparent" // Style khi không active - không có background, chỉ đổi màu chữ
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
                    {!expanded && (
                      <TooltipContent side="right">{it.label}</TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              {/* User Info Section */}
              <div
                className={cn("flex items-center gap-3 py-2 rounded-lg", {
                  "justify-center": !expanded,
                  "justify-start pl-0": expanded,
                })}
              >
                <Avatar className="size-10">
                  <AvatarImage
                    src={user?.imageUrl}
                    alt={user?.fullName || "User"}
                  />
                  <AvatarFallback className="bg-red-100 text-red-600">
                    {user?.firstName?.[0] ||
                      user?.emailAddresses?.[0]?.emailAddress?.[0] ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                {expanded && (
                  <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {resolveStaffFullName(user, { fallback: "Người dùng" })}
                    </span>
                    {user?.primaryEmailAddress && (
                      <span className="text-xs text-gray-500 truncate">
                        {user.primaryEmailAddress.emailAddress}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Tooltip open={expanded ? false : undefined}>
                <TooltipTrigger asChild disabled={expanded}>
                  <div className="relative">
                    <span
                      onClick={handleLogout}
                      className={cn(
                        "absolute ml-20 top-1/2 transform -translate-y-1/2 whitespace-nowrap text-sm font-medium transition cursor-pointer text-gray-700 hover:text-red-600",
                        {
                          "opacity-0 pointer-events-none": !expanded,
                          "opacity-100 pointer-events-auto": expanded,
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
                {!expanded && (
                  <TooltipContent side="right">Đăng xuất</TooltipContent>
                )}
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
