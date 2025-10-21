import React from "react";
import { useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  useClerk,
  useUser,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";
import headerImg from "@/assets/header-img.jpg";
import MotorcycleIcon from "../icons/MotorcycleIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import avatarImg from "../../assets/avatar.png";
import { Button } from "../ui/button";
import { LuAlignLeft } from "react-icons/lu";
import SignOutLink from "../navbar/SignOutLink";
import SearchIcon from "../icons/SearchIcon";
import NotificationAlertIcon from "../icons/NotificationAlertIcon";
import NotificationIcon from "../icons/NotificationIcon";

const Header = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  const profileImage = user?.imageUrl || avatarImg;

  return (
    <header className="w-full">
      {/* Constrain to 1920px wide while responsive */}
      <div className="max-w-[1920px] mx-auto">
        {/* Top section */}
        <div className="flex items-center gap-[8px] h-[70px] md:h-[80px] xl:h-[88px] px-[8px] pl-[20px] md:pl-[36px] xl:pl-[70px]">
          <p className="text-[#E82917] text-[22px] md:text-[28px] xl:text-[32px] font-extrabold leading-none select-none">
            MotorMate
          </p>
          <div className="hidden md:flex items-center justify-center">
            <div className="mx-2 h-[20px] w-0 border-l-2 border-[rgba(170,168,173,0.6)]" />
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center p-[5px] md:p-[8px] text-foreground/70 select-none">
            <p className="text-[15px] md:text-[18px] xl:text-[22px] leading-[1.2] font-extrabold">
              How we move you
            </p>
            <p className="text-[11px] md:text-[14px] xl:text-[16px] leading-[1.2] font-medium">
              MotorMate
            </p>
          </div>
          <div className="ml-auto flex items-center justify-center gap-[16px] md:gap-[20px] p-[8px]">
            <SearchIcon />

            {/* Use NotificationAlertIcon if there are new notifications, else use NotificationIcon*/}
            <NotificationAlertIcon />  

            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="flex gap-4 max-w-[100px]"
                  >
                    <LuAlignLeft className="w-6 h-6"></LuAlignLeft>

                    <img
                      src={profileImage}
                      className="h-7 w-7 object-cover rounded"
                    ></img>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-40"
                  align="center"
                  sideOffset={10}
                >
                  <SignedIn>
                    <DropdownMenuSeparator></DropdownMenuSeparator>{" "}
                    <DropdownMenuItem>
                      <a href="/profile">Profile</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <SignOutLink></SignOutLink>
                    </DropdownMenuItem>
                  </SignedIn>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => {
                  navigate("/login");
                }}
                disabled={isSignedIn}
                className="bg-[#DF1D01] text-white rounded-[8px] px-3 md:px-4 py-2 text-[14px] md:text-[16px] xl:text-[18px] font-bold flex items-center gap-2 hover:brightness-110 cursor-pointer"
              >
                <MotorcycleIcon />
                Đăng Nhập
              </button>
            )}
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
