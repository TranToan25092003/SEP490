import React from "react";
import { useLoaderData } from "react-router-dom";

const PartnerLogos = () => {
  const placeholders = Array.from({ length: 7 });
  return (
    <div className="w-full bg-zinc-900">
      <div className="max-w-[1920px] mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {placeholders.map((_, idx) => (
            <div key={idx} className="w-32 h-20 flex items-center justify-center">
              <img
                className="w-32 h-16 opacity-80 object-contain"
                src={`https://placehold.co/133x66`}
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
  return (
    <div className="w-full bg-zinc-900 text-white">
      <div className="max-w-[1920px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About / Address */}
          <div>
            <div className="text-red-600 text-sm uppercase font-['Poppins'] mb-3">MotorMATE</div>
            <div className="text-neutral-400 text-xs font-['Poppins'] leading-tight mb-3">
              {address || "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}
            </div>
            <div className="text-neutral-400 text-xs font-['Poppins'] leading-tight">
              {phone || "(000) 000-0000"}
            </div>
            {iframe && (
              <div className="mt-3" dangerouslySetInnerHTML={{ __html: iframe }} />
            )}
          </div>

          {/* Photo Gallery */}
          <div>
            <div className="text-white text-sm uppercase font-['Exo'] mb-4">Photo Gallery</div>
            <div className="grid grid-cols-2 gap-3">
              <img className="w-24 h-11 object-cover" src="https://placehold.co/100x46" alt="gallery-1" />
              <img className="w-24 h-10 object-cover" src="https://placehold.co/100x40" alt="gallery-2" />
              <img className="w-24 h-12 object-cover" src="https://placehold.co/100x46" alt="gallery-3" />
              <img className="w-24 h-12 object-cover" src="https://placehold.co/100x51" alt="gallery-4" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="text-white text-sm uppercase font-['Poppins'] mb-4">Quick Links</div>
            <ul className="space-y-3 text-white/70 text-xs font-['Poppins']">
              <li className="border-b border-white/50 pb-2">Trang Chủ</li>
              <li className="border-b border-white/50 pb-2">Sắp Ra Mắt</li>
              <li className="border-b border-white/50 pb-2">Phụ Tùng</li>
              <li className="border-b border-white/50 pb-2">Dịch Vụ</li>
              <li className="border-b border-white/50 pb-2">Giới Thiệu</li>
              <li className="border-b border-white/50 pb-2">Liên Hệ</li>
            </ul>
          </div>

          {/* Contact / Subscribe */}
          <div>
            <div className="text-white text-sm uppercase font-['Poppins'] mb-4">Để lại lời nhắn</div>
            <div className="space-y-3">
              <div className="text-zinc-500 text-sm font-['Poppins']">Nhận thông tin mới nhất</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Họ và Tên"
                  className="bg-white/80 text-neutral-600 placeholder-neutral-600 text-xs px-3 py-2 rounded w-full"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email..."
                  className="bg-white/80 text-neutral-600 placeholder-neutral-600 text-xs px-3 py-2 rounded w-full"
                />
              </div>
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

const BottomBar = () => {
  const year = new Date().getFullYear();
  return (
    <div className="w-full bg-zinc-900 text-zinc-500">
      <div className="max-w-[1920px] mx-auto px-4 py-4">
        <div className="h-px bg-neutral-700 mb-3" />
        <div className="text-xs font-['Poppins'] text-center">
          Copyright © {year}. MotorMate – Design by WinnerTech
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
