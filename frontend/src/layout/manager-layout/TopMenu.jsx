import { Input } from "@/components/ui/input";
import NotificationBell from "@/components/global/NotificationBell";

export default function TopMenu({ height = 40, sidebarWidth = 80 }) {
  return (
    <header
      className="fixed left-0 top-0 w-full bg-white border-b z-30"
      style={{ height, paddingLeft: sidebarWidth }}
    >
      <div className="flex items-center justify-between h-full px-6 w-full">
        <div></div>
        <div className="flex items-center gap-4">
          <div className="relative size-[32px] -mt-7 mr-6">
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
