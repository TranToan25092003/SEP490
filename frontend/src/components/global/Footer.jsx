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
      <div className="max-w-[1920px] mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {logos.map((src, idx) => (
            <div key={`${idx}`} className="w-32 h-20 flex items-center justify-center">
              <img
                className="w-32 h-16 opacity-80 object-contain"
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
    'Trang Chủ',
    'Sắp Ra Mắt',
    'Phụ Tùng',
    'Dịch Vụ',
    'Giới Thiệu',
    'Liên Hệ',
  ]

  return (
    <div className="w-full bg-zinc-900 text-white">
      {/* Constrain inner content to match Figma container width */}
      <div className="max-w-[1350px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About / Address */}
          <div>
            <div className="text-red-600 text-sm uppercase mb-3">MotorMATE</div>
            <div className="text-neutral-400 text-xs leading-tight mb-3">
              {address || "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}
            </div>
            <div className="text-neutral-400 text-xs leading-tight">
              {phone || "(000) 000-0000"}
            </div>
            {iframe && (
              <div className="mt-3" dangerouslySetInnerHTML={{ __html: iframe }} />
            )}
          </div>

          {/* Photo Gallery */}
          <div>
            <div className="text-white text-sm uppercase mb-4">Photo Gallery</div>
            <div className="grid grid-cols-2 gap-2">
              <img className="w-30 h-12 object-cover" src={g1} alt="gallery-1" />
              <img className="w-30 h-12 object-cover" src={g2} alt="gallery-2" />
              <img className="w-30 h-12 object-cover" src={g3} alt="gallery-3" />
              <img className="w-30 h-12 object-cover" src={g4} alt="gallery-4" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="w-full bg-black p-8">
            <div className="lg:max-w-[220px] xl:max-w-[240px]">
              <div className="mb-4 font-['Poppins'] text-sm uppercase text-white">
                Quick Links
              </div>
              <ul className="space-y-3 font-['Poppins'] text-xs">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="group flex items-center gap-x-3 text-white/70 underline transition-colors duration-200 hover:text-white"
                    >
                      <ArrowIcon />
                      <span>{link}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact / Subscribe */}
          <div className="lg:max-w-[240px] xl:max-w-[260px]">
            <div className="text-white text-sm uppercase mb-4">Để lại lời nhắn</div>
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
              <div className="text-zinc-500 text-sm">Nhận thông tin mới nhất</div>
              <button className="bg-red-600/75 text-white text-sm font-bold tracking-tight uppercase px-4 py-2 rounded shadow-[0px_2px_0px_0px_rgba(223,29,1,0.75)]">
                Gửi
              </button>
              <div className="text-xs text-neutral-400 mt-2">
                {email ? `Email: ${email}` : null}
              </div>
              <div className="text-xs text-neutral-400">
                {facebook ? (
                  <a href={facebook} target="_blank" rel="noreferrer" className="underline">Facebook</a>
                ) : null}
                {zalo ? (
                  <>
                    {facebook ? " • " : null}
                    <a href={zalo} target="_blank" rel="noreferrer" className="underline">Zalo</a>
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
      <div className="max-w-[1350px] mx-auto px-4 py-4">
        <div className="h-px bg-neutral-700 mb-3" />
        <div className="text-xs text-left">
          Copyright © {year}. MotorMate
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
