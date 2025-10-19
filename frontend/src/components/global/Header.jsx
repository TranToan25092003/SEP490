import React from "react";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import headerImg from "@/assets/header-img.jpg";
import MotorcycleIcon from "../icons/MotorcycleIcon";

const Header = () => {
  const navigate = useNavigate();
  const { openSignIn } = useClerk();

  return (
    <header className="w-full">
      {/* Constrain to 1920px wide while responsive */}
      <div className="max-w-[1920px] mx-auto">
        {/* Top section */}
        <div className="flex items-center gap-[8px] h-[70px] md:h-[80px] xl:h-[88px] px-[8px] pl-[20px] md:pl-[36px] xl:pl-[70px]">
          <p className="text-[#E82917] text-[22px] md:text-[28px] xl:text-[32px] font-extrabold leading-none select-none">MotorMate</p>
          <div className="hidden md:flex items-center justify-center">
            <div className="mx-2 h-[20px] w-0 border-l-2 border-[rgba(170,168,173,0.6)]" />
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center p-[5px] md:p-[8px] text-foreground/70 select-none">
            <p className="text-[15px] md:text-[18px] xl:text-[22px] leading-[1.2] font-extrabold">How we move you</p>
            <p className="text-[11px] md:text-[14px] xl:text-[16px] leading-[1.2] font-medium">MotorMate</p>
          </div>
          <div className="ml-auto flex items-center justify-center gap-[16px] md:gap-[20px] p-[8px]">
            <button aria-label="Search" className="size-[26px] md:size-[30px] text-[#323232] hover:opacity-80 cursor-pointer" onClick={() => navigate("/")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            <button aria-label="Cart" className="size-[26px] md:size-[30px] text-[#323232] hover:opacity-80 cursor-pointer" onClick={() => navigate("/cart")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6l-1-3H3"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
            </button>
            <button
              onClick={() => openSignIn?.({})}
              className="bg-[#DF1D01] text-white rounded-[8px] px-3 md:px-4 py-2 text-[14px] md:text-[16px] xl:text-[18px] font-bold flex items-center gap-2 hover:brightness-110 cursor-pointer"
            >
              <MotorcycleIcon />
              Đăng Nhập
            </button>
          </div>
        </div>

        {/* Lower section: image 2x height of nav, bottoms aligned */}
        <div className="flex items-end gap-0">
          {/* Decorative image with red overlay */}
          <div className="hidden lg:block relative w-[340px] xl:w-[500px] h-[124px] rounded-tr-[36px] xl:rounded-tr-[68px] overflow-hidden">
            <img
              src={headerImg}
              alt="decorative"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[rgba(255,28,28,0.2)]" />
          </div>

          {/* Nav strip */}
          <nav className="flex-1 flex items-stretch overflow-x-auto h-[62px]">
            <ul className="flex items-stretch gap-0 w-full">
              <li className="shrink-0">
                <button
                  onClick={() => navigate("/")}
                  className="bg-[#323B44] text-white text-[13px] md:text-[15px] xl:text-[17px] font-bold h-[62px] w-[128px] md:w-[148px] xl:w-[158px] hover:bg-[#3a454f] transition-colors cursor-pointer"
                >
                  Trang Chủ
                </button>
              </li>
              <li className="shrink-0">
                <button
                  onClick={() => navigate("/booking")}
                  className="bg-[#323B44] text-white text-[13px] md:text-[15px] xl:text-[17px] font-bold h-[62px] w-[128px] md:w-[148px] xl:w-[158px] hover:bg-[#3a454f] transition-colors cursor-pointer"
                >
                  Đặt Lịch
                </button>
              </li>
              <li className="shrink-0">
                <button
                  onClick={() => navigate("/items")}
                  className="bg-[#323B44] text-white text-[13px] md:text-[15px] xl:text-[17px] font-bold h-[62px] w-[128px] md:w-[148px] xl:w-[158px] hover:bg-[#3a454f] transition-colors cursor-pointer"
                >
                  Phụ Tùng
                </button>
              </li>
              <li className="shrink-0">
                <button
                  onClick={() => navigate("/about")}
                  className="bg-[#323B44] text-white text-[13px] md:text-[15px] xl:text-[17px] font-bold h-[62px] w-[128px] md:w-[148px] xl:w-[158px] hover:bg-[#3a454f] transition-colors cursor-pointer"
                >
                  Giới Thiệu
                </button>
              </li>
              <li className="flex-1">
                <div className="bg-[#323B44] h-[62px] w-full" />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;


