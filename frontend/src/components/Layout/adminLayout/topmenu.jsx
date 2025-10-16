import imgLine from "@/assets/admin/topmenu_new/820dac35a2744d583612e8a08d813bb4f7d1fb00.svg";
import imgMagnifier from "@/assets/admin/topmenu_new/8a2d8145df476a9fdf886c059664e9cd77775dd4.svg";
import imgChat from "@/assets/admin/topmenu_new/045d5cdd34e8f0d2b281ed53c31c07f5e6838cd5.svg";
import imgBell from "@/assets/admin/topmenu_new/8e41a0c6b43a442b8bdbb9cd30564fb44ca6089e.svg";
import { Input } from "@/components/ui/input";

export default function TopMenu({ height = 100, sidebarWidth = 80 }) {
  const searchWidth = 291;
  const searchHeight = 60;
  const vertical = Math.max(0, (height - searchHeight) / 2);
  return (
    <header
      className="fixed left-0 top-0 w-full bg-white z-30"
      style={{ height }}
    >
      <div className="absolute left-0 right-0 bottom-0 h-[2px]">
        <img alt="" className="block w-full h-full" src={imgLine} />
      </div>
      <div className="relative h-full" style={{ marginLeft: sidebarWidth }}>
        <div
          style={{
            position: "absolute",
            top: vertical,
            left: "50%",
            transform: "translateX(-50%)",
            width: `${searchWidth}px`,
            height: `${searchHeight}px`,
          }}
        >
          <div className="relative h-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 size-[24px]">
              <img
                alt=""
                className="block max-w-none size-full"
                src={imgMagnifier}
              />
            </span>
            <Input
              placeholder="Search here..."
              className="h-full rounded-[20px] bg-[#ffecec] pl-12 pr-4 text-[18px] placeholder:text-[#a098ae]"
            />
          </div>
        </div>
        <div
          className="flex items-center gap-[15px]"
          style={{ position: "absolute", top: vertical + 10, right: 24 }}
        >
          <div className="relative size-[32px]">
            <img alt="" className="block max-w-none size-full" src={imgChat} />
            <span className="absolute -top-2 -right-2 bg-[#df1d01] text-white text-[12px] rounded px-1 leading-none">
              2
            </span>
          </div>
          <div className="relative size-[32px]">
            <img alt="" className="block max-w-none size-full" src={imgBell} />
            <span className="absolute -top-2 -right-2 bg-[#df1d01] text-white text-[12px] rounded px-1 leading-none">
              2
            </span>
          </div>
          <p className="text-[#df1d01] text-[18px] font-bold">MOTORMATE</p>
        </div>
      </div>
    </header>
  );
}
