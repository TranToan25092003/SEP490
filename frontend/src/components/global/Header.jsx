import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignedIn, useUser } from "@clerk/clerk-react";
import { customFetch } from "@/utils/customAxios";

// Shadcn UI Components
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Icons and Assets
import headerImg from "@/assets/header-img.jpg";
import MotorcycleIcon from "../icons/MotorcycleIcon";
import avatarImg from "../../assets/avatar.png";
import { LuAlignLeft } from "react-icons/lu";
import SignOutLink from "../navbar/SignOutLink";
import SearchIcon from "../icons/SearchIcon";
import NotificationAlertIcon from "../icons/NotificationAlertIcon";

const Header = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const [groupedModels, setGroupedModels] = useState([]);
  const [isPartsMenuOpen, setIsPartsMenuOpen] = useState(false);

  const profileImage = user?.imageUrl || avatarImg;

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await customFetch.get("/models/grouped-by-brand");
        if (response.data.success) {
          setGroupedModels(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    };
    fetchModels();
  }, []);

  return (
    <header className="relative z-50 w-full bg-white">
      <div className="mx-auto max-w-[1920px]">
        {/* Top section */}
        <div className="flex h-[70px] items-center gap-[8px] px-[8px] pl-[20px] md:h-[80px] md:pl-[36px] xl:h-[88px] xl:pl-[70px]">
          <p className="select-none text-[22px] font-extrabold leading-none text-[#E82917] md:text-[28px] xl:text-[32px]">
            MotorMate
          </p>
          <div className="hidden items-center justify-center md:flex">
            <div className="mx-2 h-[20px] w-0 border-l-2 border-[rgba(170,168,173,0.6)]" />
          </div>
          <div className="hidden select-none flex-col items-center justify-center p-[5px] text-foreground/70 sm:flex md:p-[8px]">
            <p className="text-[15px] font-extrabold leading-[1.2] md:text-[18px] xl:text-[22px]">
              How we move you
            </p>
            <p className="text-[11px] font-medium leading-[1.2] md:text-[14px] xl:text-[16px]">
              MotorMate
            </p>
          </div>
          <div className="ml-auto flex items-center justify-center gap-[16px] p-[8px] md:gap-[20px]">
            <SearchIcon />
            <NotificationAlertIcon />

            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"outline"} className="flex max-w-[100px] gap-4">
                    <LuAlignLeft className="h-6 w-6"></LuAlignLeft>
                    <img src={profileImage} className="h-7 w-7 rounded object-cover"></img>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40" align="center" sideOffset={10}>
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
                onClick={() => navigate("/login")}
                className="flex cursor-pointer items-center gap-2 rounded-[8px] bg-[#DF1D01] px-3 py-2 text-[14px] font-bold text-white hover:brightness-110 md:px-4 md:text-[16px] xl:text-[18px]"
              >
                <MotorcycleIcon />
                Đăng Nhập
              </button>
            )}
          </div>
        </div>

        {/* Lower section with Navigation */}
        <div className="flex items-end gap-0">
          <div className="relative hidden h-[124px] w-[340px] overflow-hidden rounded-tr-[36px] lg:block xl:w-[500px] xl:rounded-tr-[68px]">
            <img src={headerImg} alt="decorative" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[rgba(255,28,28,0.2)]" />
          </div>

          <nav className="h-[62px] flex-1">
            <ul className="relative flex h-full items-stretch gap-0">
              <li className="shrink-0">
                <Link to="/" className="flex h-full w-[128px] items-center justify-center bg-[#323B44] text-[13px] font-semibold text-slate-100 hover:bg-[#3a454f] md:w-[148px] md:text-[15px] xl:w-[158px] xl:text-[17px]">
                  Trang Chủ
                </Link>
              </li>
              <li className="shrink-0">
                <Link to="/booking" className="flex h-full w-[128px] items-center justify-center bg-[#323B44] text-[13px] font-semibold text-slate-100 hover:bg-[#3a454f] md:w-[148px] md:text-[15px] xl:w-[158px] xl:text-[17px]">
                  Đặt Lịch
                </Link>
              </li>

              <li
                className="shrink-0"
                onMouseEnter={() => setIsPartsMenuOpen(true)}
                onMouseLeave={() => setIsPartsMenuOpen(false)}
              >
                <button className={`flex h-full w-[128px] items-center justify-center bg-[#323B44] text-[13px] font-semibold text-slate-100 hover:bg-[#3a454f] md:w-[148px] md:text-[15px] xl:w-[158px] xl:text-[17px] ${isPartsMenuOpen ? 'bg-[#3a454f]' : ''}`}>
                  Phụ Tùng
                </button>
                {isPartsMenuOpen && (
                  <div className="absolute top-full left-0 w-full bg-zinc-800 shadow-lg border-t border-zinc-700">
                    <div className="mx-auto max-w-7xl p-6 columns-2 md:columns-3 lg:columns-4 gap-x-8">
                      {groupedModels.map((group) => (
                        <div key={group.brand} className="break-inside-avoid mb-6">
                          <h3 className="mb-3 text-sm font-bold uppercase text-red-500">
                            Phụ Tùng {group.brand}
                          </h3>
                          <ul className="space-y-2">
                            {group.models.map((model) => (
                              <li key={model._id}>
                                <Link to={`/items?vehicleModel=${model._id}&brand=${group.brand}`} className="text-sm text-slate-300 hover:text-white hover:underline">
                                  {model.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>

              <li className="shrink-0">
                <Link to="/about" className="flex h-full w-[128px] items-center justify-center bg-[#323B44] text-[13px] font-semibold text-slate-100 hover:bg-[#3a454f] md:w-[148px] md:text-[15px] xl:w-[158px] xl:text-[17px]">
                  Giới Thiệu
                </Link>
              </li>

              <li className="flex-1">
                <div className="h-[62px] w-full bg-[#323B44]" />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;