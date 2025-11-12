import imgMagnifier from "@/assets/admin/topmenu_new/8a2d8145df476a9fdf886c059664e9cd77775dd4.svg";
import imgChat from "@/assets/admin/topmenu_new/045d5cdd34e8f0d2b281ed53c31c07f5e6838cd5.svg";
import imgBell from "@/assets/admin/topmenu_new/8e41a0c6b43a442b8bdbb9cd30564fb44ca6089e.svg";
import { Input } from "@/components/ui/input";
import NotificationBell from "@/components/global/NotificationBell";

export default function TopMenu({ height = 40, sidebarWidth = 80 }) {
  return (
    <header
      className="fixed left-0 top-0 w-full bg-white border-b z-30"
      style={{ height, paddingLeft: sidebarWidth }}
    >
      <div className="flex items-center justify-between h-full px-6 w-full">
        <div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 size-[24px]">
              <img
                alt=""
                className="block max-w-none size-full"
                src={imgMagnifier}
              />
            </span>
            <Input
              placeholder="Search here..."
              className="h-full rounded-full bg-accent pl-12 pr-4 py-3"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative size-[32px] mb-2 mr-6">
            <NotificationBell />
          </div>
          <p
            className="font-bold"
            style={{
              color: "#DF1D01",
              fontFamily: "revert",
              fontSize: 18,
              fontStyle: "normal",
              lineHeight: "normal",
              textTransform: "uppercase",
            }}
          >
            motormate
          </p>
        </div>
      </div>
    </header>
  );
}
