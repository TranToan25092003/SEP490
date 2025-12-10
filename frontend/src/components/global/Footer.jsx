import React from "react";
import PropTypes from "prop-types";
import ducati from "@/assets/ducati.png";
import honda from "@/assets/honda.png";
import kawasaki from "@/assets/kawasaki.png";
import semdo from "@/assets/semdo.png";
import star from "@/assets/star.png";
import suzuki from "@/assets/suzuki.png";
import yamaha from "@/assets/yamaha.png";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import { useLoaderData } from "react-router-dom";
import ArrowIcon from "../icons/ArrowIcon";

const PartnerLogos = () => {
  const logos = [ducati, honda, kawasaki, semdo, star, suzuki, yamaha];

  return (
    <div className="w-full bg-zinc-900">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-5">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {logos.map((src, idx) => (
            <div
              key={`${idx}`}
              className="w-24 h-14 sm:w-28 sm:h-16 md:w-32 md:h-20 flex items-center justify-center"
            >
              <img
                className="w-full h-full opacity-80 object-contain"
                src={src}
                alt={`partner-${idx + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MainFooterContent = ({ footerInfo }) => {
  const { address, email, facebook, iframe, phone, zalo } = footerInfo || {};

  const links = [
    { text: "Trang Chủ", href: "/" },
    { text: "Phụ Tùng", href: "/items" },
    { text: "Dịch Vụ", href: "/" },
    { text: "Giới Thiệu", href: "/about" },
    { text: "Liên Hệ", href: "/" },
  ];

  return (
    <div className="w-full bg-zinc-900 text-white">
      {/* Constrain inner content to match Figma container width */}
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* About / Address */}
          <div className="space-y-3">
            <div className="text-red-600 text-sm uppercase">MotorMATE</div>
            <div className="text-neutral-400 text-xs leading-tight">
              {address ||
                "MotorMate cam kết đồng hành lâu dài, trở thành đối tác tin cậy trong việc bảo dưỡng và chăm sóc xe của bạn."}
            </div>
            <div className="text-neutral-400 text-xs leading-tight">
              {phone || "(+84) 0377-043-903"}
            </div>
            {iframe && (
              <div
                className="mt-3"
                dangerouslySetInnerHTML={{ __html: iframe }}
              />
            )}
          </div>

          {/* Photo Gallery */}
          <div className="space-y-3">
            <div className="text-white text-sm uppercase mb-4">
              Photo Gallery
            </div>
            <div className="grid grid-cols-2 gap-2">
              <img
                className="w-full h-16 object-cover"
                src={g1}
                alt="gallery-1"
              />
              <img
                className="w-full h-16 object-cover"
                src={g2}
                alt="gallery-2"
              />
              <img
                className="w-full h-16 object-cover"
                src={g3}
                alt="gallery-3"
              />
              <img
                className="w-full h-16 object-cover"
                src={g4}
                alt="gallery-4"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="w-full md:pl-8 lg:pl-12 hidden md:block">
            <div className="lg:max-w-[220px] xl:max-w-[240px]">
              <div className="mb-4 font-['Poppins'] text-sm uppercase text-white">
                Quick Links
              </div>
              <ul className="space-y-3 font-['Poppins'] text-xs">
                {links.map((link) => (
                  <li key={link.text}>
                    <a
                      href={link.href}
                      className="group flex items-center gap-x-3 text-white/70 underline transition-colors duration-200 hover:text-white"
                    >
                      <ArrowIcon />
                      <span>{link.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact / Subscribe */}
          <div className="lg:max-w-[240px] xl:max-w-[260px] space-y-3">
            <div className="text-white text-sm uppercase mb-4">
              Để lại lời nhắn
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Họ và Tên"
                  className="bg-white/80 text-neutral-600 placeholder-neutral-600 text-xs px-3 py-2  w-full"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email..."
                  className="bg-white/80 text-neutral-600 placeholder-neutral-600 text-xs px-3 py-2  w-full"
                />
              </div>
              <div className="text-zinc-500 text-sm">
                Nhận thông tin mới nhất
              </div>
              <button className="bg-red-600/75 text-white text-sm font-bold tracking-tight uppercase px-4 py-2 rounded shadow-[0px_2px_0px_0px_rgba(223,29,1,0.75)]">
                Gửi
              </button>
              <div className="text-xs text-neutral-400 mt-2">
                {email ? `Email: ${email}` : null}
              </div>
              <div className="text-xs text-neutral-400">
                {facebook ? (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Facebook
                  </a>
                ) : null}
                {zalo ? (
                  <>
                    {facebook ? " • " : null}
                    <a
                      href={zalo}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Zalo
                    </a>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MainFooterContent.propTypes = {
  footerInfo: PropTypes.shape({
    address: PropTypes.string,
    email: PropTypes.string,
    facebook: PropTypes.string,
    iframe: PropTypes.string,
    phone: PropTypes.string,
    zalo: PropTypes.string,
  }),
};

const BottomBar = () => {
  const year = new Date().getFullYear();
  return (
    <div className="w-full bg-zinc-900 text-zinc-500">
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-10 py-4">
        <div className="h-px bg-neutral-700 mb-3" />
        <div className="text-xs text-left">
          Copyright © {year}. MotorMate - Design By TuongHuy
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  const { footerInfo = {} } = useLoaderData();
  return (
    <footer className="w-full">
      <PartnerLogos />
      <MainFooterContent footerInfo={footerInfo} />
      <BottomBar />
    </footer>
  );
};

export default Footer;
