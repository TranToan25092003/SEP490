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
import logo from "../../assets/logo-with-brand-rmbg.png";
import { LuAlignLeft } from "react-icons/lu"; // Giữ lại import nếu bạn dùng ở nơi khác, nhưng đã xóa khỏi nút
import SignOutLink from "../navbar/SignOutLink";
import SearchIcon from "../icons/SearchIcon";
import NotificationBell from "./NotificationBell"; // Đổi tên import
import { ArrowUpDown, ChevronsUpDown } from "lucide-react";

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
          <Link to="/" className="flex-shrink-0">
            <img
              className="h-20 w-auto md:h-36"
              src={logo}
              alt="MotorMate Logo"
            />
          </Link>
          <div className="hidden items-center justify-center md:flex">
            <div className="mx-2 h-[20px] w-0 border-l-2 border-[rgba(170,168,173,0.6)]" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div className="hidden select-none flex-col items-center justify-center p-[5px] text-foreground/70 sm:flex md:p-[8px]">
              <p className="text-[15px] font-extrabold leading-[1.2] md:text-[18px] xl:text-[22px]">
                How we move you
              </p>
              <p className="text-[11px] font-medium leading-[1.2] md:text-[14px] xl:text-[16px]">
                MotorMate
              </p>
            </div>
            <div className="ml-auto flex items-center justify-center gap-[16px] p-[8px] md:gap-[20px]">
              {/* <SearchIcon /> */}

              {isSignedIn ? (
                <>
                  <div className="mt-2 md:mt-6 lg:mt-10 scale-80 md:scale-85 lg:scale-90">
                    <NotificationBell />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={"ghost"}
                        className="mt-2 md:mt-6 lg:mt-8 flex max-w-[100px] gap-4 hover:!bg-transparent focus:!bg-transparent active:!bg-transparent focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-0"
                      >
                        <img
                          src={profileImage}
                          className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 rounded-full object-cover"
                          alt={user?.firstName || "User Avatar"}
                        ></img>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-60"
                      align="end"
                      sideOffset={10}
                    >
                      <SignedIn>
                        {/* Thêm thông tin người dùng ở đây nếu muốn */}
                        <DropdownMenuItem className="focus:bg-transparent">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {user?.publicMetadata?.fullName || user?.fullName || "Người dùng"}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user?.primaryEmailAddress?.emailAddress}
                            </p>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => navigate("/profile")}>
                          Thông tin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => navigate("/profile?tab=history")}
                        >
                          Lịch sử sửa xe
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => navigate("/booking-tracking")}
                        >
                          Theo dõi tiến độ
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => navigate("/invoices")}
                        >
                          Hóa Đơn - Thanh Toán
                        </DropdownMenuItem>

                        <DropdownMenuItem onSelect={() => navigate("/loyalty")}>
                          Điểm thưởng
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => navigate("/complaint")}
                        >
                          Khiếu Nại
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700">
                          <SignOutLink></SignOutLink>
                        </DropdownMenuItem>
                      </SignedIn>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="mt-2 md:mt-6 lg:mt-8 flex cursor-pointer items-center gap-2 rounded-[8px] bg-[#DF1D01] px-3 py-2 text-[14px] font-bold text-white hover:brightness-110 md:px-4 md:text-[16px] xl:text-[18px]"
                >
                  <MotorcycleIcon />
                  Đăng Nhập
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lower section with Navigation */}
        <div className="flex items-end gap-0">
          <div className="relative hidden h-[90px] w-[340px] overflow-hidden rounded-tr-[35px] lg:block xl:w-[500px] xl:rounded-tr-[35px]">
            <img
              src={headerImg}
              alt="decorative"
              className="h-full w-full object-cover "
            />
            <div className="absolute inset-0 bg-[rgba(255,28,28,0.2)]" />
          </div>

          <nav className="h-[46px] sm:h-[56px] md:h-[62px] flex-1 bg-[#323B44]">
            <ul className="relative flex h-full items-stretch gap-1 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10">
              <li className="shrink-0">
                <Link
                  to="/"
                  className="flex h-full w-[80px] sm:w-[120px] md:w-[150px] lg:w-[170px] xl:w-[190px] items-center justify-center bg-[#323B44] text-[10px] sm:text-[12px] md:text-[13px] lg:text-[15px] xl:text-[17px] font-semibold text-slate-100 hover:bg-[#3a454f]"
                >
                  Trang Chủ
                </Link>
              </li>
              <li className="shrink-0">
                <Link
                  to="/booking"
                  className="flex h-full w-[80px] sm:w-[120px] md:w-[150px] lg:w-[170px] xl:w-[190px] items-center justify-center bg-[#323B44] text-[10px] sm:text-[12px] md:text-[13px] lg:text-[15px] xl:text-[17px] font-semibold text-slate-100 hover:bg-[#3a454f]"
                >
                  Đặt Lịch
                </Link>
              </li>

              <li
                className="shrink-0"
                onMouseEnter={() => setIsPartsMenuOpen(true)}
                onMouseLeave={() => setIsPartsMenuOpen(false)}
              >
                <Link
                  to="/items"
                  className={`flex h-full w-[80px] sm:w-[120px] md:w-[150px] lg:w-[170px] xl:w-[190px] items-center justify-center bg-[#323B44] text-[10px] sm:text-[12px] md:text-[13px] lg:text-[15px] xl:text-[17px] font-semibold text-slate-100 hover:bg-[#3a454f] ${
                    isPartsMenuOpen ? "bg-[#3a454f]" : ""
                  }`}
                >
                  Phụ Tùng{" "}
                  <ChevronsUpDown className="ml-0.5 sm:ml-2 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                </Link>
                {isPartsMenuOpen && (
                  <div className="absolute top-full left-0 w-full bg-zinc-800 shadow-lg border-t border-zinc-700">
                    <div className="mx-auto max-w-7xl p-6 columns-2 md:columns-3 lg:columns-4 gap-x-8">
                      {groupedModels.map((group) => (
                        <div
                          key={group.brand}
                          className="break-inside-avoid mb-6"
                        >
                          <h3 className="mb-3 text-sm font-bold uppercase text-red-500">
                            <Link
                              to={`/items?brand=${group.brand}`}
                              className="hover:text-red-400"
                            >
                              Phụ Tùng {group.brand}
                            </Link>
                          </h3>
                          <ul className="space-y-2">
                            {group.models.map((model) => (
                              <li key={model._id}>
                                <Link
                                  to={`/items?vehicleModel=${model._id}&brand=${group.brand}`}
                                  className="text-sm text-slate-300 hover:text-white hover:underline"
                                >
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
                <Link
                  to="/about"
                  className="flex h-full w-[80px] sm:w-[120px] md:w-[150px] lg:w-[170px] xl:w-[190px] items-center justify-center bg-[#323B44] text-[10px] sm:text-[12px] md:text-[13px] lg:text-[15px] xl:text-[17px] font-semibold text-slate-100 hover:bg-[#3a454f]"
                >
                  Giới Thiệu
                </Link>
              </li>

              <li className="flex-1">
                {/* <div
                  className="relative h-[46px] sm:h-[56px] md:h-[62px] w-full bg-[#323B44] bg-cover bg-no-repeat"
                  style={{
                    backgroundImage: `url(${headerBackground})`,
                    backgroundPosition: "center 35%",
                  }}
                >
                  <div className="absolute inset-0 bg-[#323B44]/80"></div>
                </div> */}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
