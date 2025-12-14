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

          {/* Contact / Message */}
          <div className="lg:max-w-[240px] xl:max-w-[260px] space-y-3">
            <div className="text-white text-sm uppercase mb-4">
              Liên hệ với chúng tôi
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-600/30 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="text-red-500 text-xl">💬</div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium mb-1">
                      Chúng tôi luôn sẵn sàng hỗ trợ bạn
                    </p>
                    <p className="text-neutral-300 text-xs leading-relaxed">
                      MotorMate cam kết mang đến dịch vụ tốt nhất và trải nghiệm
                      tuyệt vời cho khách hàng
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {email && (
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-500">Email:</span>{" "}
                    <a
                      href={`mailto:${email}`}
                      className="text-white/80 hover:text-white underline transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs">
                  {facebook && (
                    <a
                      href={facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-white underline transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                  {zalo && (
                    <>
                      {facebook && <span className="text-neutral-600">•</span>}
                      <a
                        href={zalo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-400 hover:text-white underline transition-colors"
                      >
                        Zalo
                      </a>
                    </>
                  )}
                </div>
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
