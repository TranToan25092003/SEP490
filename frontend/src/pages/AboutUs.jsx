import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// --- Map Library Imports ---
// Make sure to install these packages: npm install react-leaflet leaflet
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Required for map styling
import L from "leaflet";
// --- Icon Imports ---
import { Cog, CalendarDays, Play } from "lucide-react";
import AboutCar from "@/components/icons/AboutCar";
import AboutWheel from "@/components/icons/AboutWheel";
import AboutCoin from "@/components/icons/AboutCoin";

import aboutMotorcycle from "@/assets/about-motorcycle.png";
// --- Placeholder images for new section ---
import storyImage from "@/assets/story-image.jpg";
import ceoAvatar from "@/assets/ducati.png";
import missionImage from "@/assets/mission-image.jpg";
import coreValuesImage from "@/assets/core-image.png";

// --- Custom SVG Icon for map markers to match the design ---
const createMapIcon = (color) => {
  return new L.divIcon({
    html: `<svg viewBox="0 0 100 125" fill="${color}"><path d="M50,0A39.4,39.4,0,0,0,10.6,39.4c0,21.8,25.9,55.4,35.8,69.5a2.9,2.9,0,0,0,3.6,0C60,94.8,89.4,61.2,89.4,39.4A39.4,39.4,0,0,0,50,0Zm0,58.8A19.4,19.4,0,1,1,69.4,39.4,19.4,19.4,0,0,1,50,58.8Z"/></svg>`,
    className: "bg-transparent border-0",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
};

const bluePin = createMapIcon("#4285F4");
const redPin = createMapIcon("#DB4437");

function About() {
  const navigate = useNavigate();
  const position = [21.0285, 105.8542];

  // Refs for each section to scroll to
  const establishmentRef = useRef(null);
  const missionRef = useRef(null);
  const valuesRef = useRef(null);
  const bottomSectionRef = useRef(null); // For "Tìm hiểu" button scroll
  const [activeSection, setActiveSection] = useState("establishment");

  // Function to handle smooth scrolling
  const scrollToSection = (ref) => {
    if (ref?.current) {
      const element = ref.current;
      // Use scrollIntoView with scroll-margin-top (already set in className)
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };

  // Scroll to bottom section (for "Tìm hiểu" button)
  const scrollToBottom = () => {
    if (bottomSectionRef?.current) {
      const element = bottomSectionRef.current;
      // Use scrollIntoView with scroll-margin-top (already set in className)
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };

  // Handle Google Maps link
  const handleViewMap = () => {
    window.open(
      "https://www.google.com/maps/dir/21.102592,105.4408704/Tr%C6%B0%E1%BB%9Dng+%C4%90%E1%BA%A1i+h%E1%BB%8Dc+FPT+H%C3%A0+N%E1%BB%99i,+Khu+C%C3%B4ng+Ngh%E1%BB%87+Cao+H%C3%B2a+L%E1%BA%A1c,+km+29,+%C4%90%E1%BA%A1i+l%E1%BB%99,+Th%C4%83ng+Long,+H%C3%A0+N%E1%BB%99",
      "_blank"
    );
  };

  // Handle navigate to services
  const handleNavigateToServices = () => {
    navigate("/booking");
  };

  useEffect(() => {
    const sections = [
      { id: "establishment", ref: establishmentRef },
      { id: "mission", ref: missionRef },
      { id: "values", ref: valuesRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" } // Set active when section is in the middle of the viewport
    );

    sections.forEach((section) => {
      if (section.ref.current) {
        observer.observe(section.ref.current);
      }
    });

    return () => {
      sections.forEach((section) => {
        if (section.ref.current) {
          observer.unobserve(section.ref.current);
        }
      });
    };
  }, []);

  // Animation on scroll effect
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in-up");
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, observerOptions);

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const animatedElements = document.querySelectorAll(".animate-on-scroll");
      animatedElements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      const animatedElements = document.querySelectorAll(".animate-on-scroll");
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="w-full overflow-x-hidden">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-on-scroll {
          opacity: 0;
        }
      `}</style>
      {/* About MotorMate */}
      <section
        id="establishment"
        ref={establishmentRef}
        className="relative z-10 w-full bg-white scroll-mt-24"
      >
        <div className="mx-auto max-w-[1440px] px-8 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 items-center gap-12 pt-16 md:grid-cols-2 md:pt-24">
            <div className="pr-12 text-center md:text-left animate-on-scroll">
              <h1 className="text-4xl font-semibold text-neutral-700 md:text-5xl lg:text-6xl">
                About <span className="text-red-600">MotorMate</span>
              </h1>
              <p className="mt-2 text-xl font-semibold text-zinc-900 md:text-2xl">
                Phụ tùng tốt nhất cho mọi nhà
              </p>
              <p className="mt-4 text-base text-zinc-900 md:text-lg">
                Tìm hiểu về hành trình của MotorMate - nơi chúng tôi biến cam
                kết về chất lượng thành những sản phẩm đáng tin cậy, trở thành
                người bạn đồng hành cho mọi gia đình trên mỗi nẻo đường.
              </p>
              <button
                type="button"
                onClick={scrollToBottom}
                className="mt-8 rounded-lg bg-zinc-700 px-6 py-3
                                     text-base font-normal text-white
                                     transition-all duration-150 ease-in-out
                                     hover:bg-zinc-800 hover:-translate-y-0.5
                                     active:scale-95"
              >
                Tìm hiểu
              </button>
            </div>

            <div className="relative h-[400px] w-full md:h-[460px] animate-on-scroll">
              <MapContainer
                center={position}
                zoom={13}
                scrollWheelZoom={false}
                className="absolute inset-0 z-10 h-full w-full rounded-lg"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[21.03, 105.85]} icon={bluePin}></Marker>
                <Marker position={[21.02, 105.86]} icon={redPin}></Marker>
              </MapContainer>
              <img
                src={aboutMotorcycle}
                alt="Red motorcycle"
                className="absolute z-20 w-[90%] max-w-none h-auto drop-shadow-2xl pointer-events-none
                               bottom-[-80px] left-1/2 -translate-x-1/2
                               md:bottom-[-160px] md:left-[-160px] md:translate-x-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Red Bar */}
      <section className="relative z-0 bg-red-700">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="mx-auto max-w-[1440px] px-8 pt-28 pb-12 lg:px-16 xl:px-20">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
                <div className="flex items-center gap-6">
                  <h3 className="text-2xl font-medium leading-7 text-white">
                    Thành Lập
                  </h3>
                  <div className="flex items-center gap-5 text-base font-medium leading-7">
                    <button
                      type="button"
                      onClick={() => scrollToSection(establishmentRef)}
                      className={`pb-1 transition-colors ${
                        activeSection === "establishment"
                          ? "border-b border-white text-white"
                          : "text-rose-300 hover:text-white"
                      }`}
                    >
                      Thành Lập
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection(missionRef)}
                      className={`pb-1 transition-colors ${
                        activeSection === "mission"
                          ? "border-b border-white text-white"
                          : "text-rose-300 hover:text-white"
                      }`}
                    >
                      Sứ mệnh
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection(valuesRef)}
                      className={`pb-1 transition-colors ${
                        activeSection === "values"
                          ? "border-b border-white text-white"
                          : "text-rose-300 hover:text-white"
                      }`}
                    >
                      Giá trị
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 animate-on-scroll">
                <div className="h-10 w-32 rounded bg-white px-4 py-2 text-base font-medium leading-7 text-zinc-600 flex items-center">
                  2025
                </div>
                <div className="h-10 w-32 rounded bg-white px-4 py-2 text-base font-medium leading-7 text-zinc-600 flex items-center">
                  09
                </div>
                <div className="h-10 w-32 rounded bg-white px-4 py-2 text-base font-medium leading-7 text-zinc-600 flex items-center">
                  26
                </div>
                <input
                  type="text"
                  defaultValue="Thôn 1, Thạch Hòa, Thạch Thất, thành phố Hà Nội, Việt Nam"
                  readOnly
                  className="h-10 flex-grow rounded bg-white px-4 py-2 text-base font-medium leading-7 text-zinc-600 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-800 md:w-[485px]"
                />
                <button
                  onClick={handleViewMap}
                  className="h-10 w-48 rounded bg-zinc-800 px-4 py-2 text-base font-medium leading-7 text-white transition-colors hover:bg-black"
                >
                  Xem trên bản đồ
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story  */}
      <section
        ref={bottomSectionRef}
        className="w-full bg-white py-16 md:py-24 scroll-mt-24"
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-8 lg:grid-cols-2 lg:px-16 xl:px-20">
          <div className="relative h-[550px] w-full lg:h-[650px] animate-on-scroll">
            <img
              src={storyImage}
              alt="Mechanic working on a motorcycle"
              className="h-full w-full rounded-lg object-cover"
            />
            <div
              className="absolute bottom-18 left-8 right-8 rounded-lg bg-zinc-800/90 p-6 text-2xl leading-9 text-white backdrop-blur-sm
                           lg:left-auto lg:right-[-5rem] lg:w-72"
            >
              Chúng tôi luôn đem đến giải pháp tốt nhất
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:pl-20 animate-on-scroll">
            <div>
              <h2 className="text-4xl font-medium text-neutral-700">
                Câu chuyện và lý do lựa chọn kinh doanh
              </h2>
              <p className="mt-1 text-lg text-stone-500">
                MotorMate được thành lập từ niềm đam mê mãnh liệt với xe máy và
                mong muốn tạo ra một địa chỉ đáng tin cậy cho cộng đồng. Chúng
                tôi nhận thấy nhu cầu về một nơi không chỉ cung cấp phụ tùng
                chất lượng mà còn mang đến dịch vụ tư vấn chuyên nghiệp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-10 items-center gap-1.5 rounded-lg bg-zinc-100 px-6 py-2">
                <div className="h-5 w-5 rounded-full bg-red-600 p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="white"
                    className="h-full w-full"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
                <span className="text-base text-slate-700">Bắt Đầu</span>
              </div>
              <div className="flex h-10 items-center gap-1.5 rounded-lg bg-zinc-100 px-6 py-2">
                <div className="h-5 w-5 rounded-full bg-red-600 p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="white"
                    className="h-full w-full"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
                <span className="text-base text-slate-700">
                  Phát Triển Mạnh
                </span>
              </div>
            </div>

            <p className="text-lg text-stone-500">
              Từ những ngày đầu khởi nghiệp, chúng tôi đã đặt chất lượng và sự
              hài lòng của khách hàng làm trọng tâm. Qua nhiều năm phát triển,
              MotorMate đã không ngừng mở rộng danh mục sản phẩm và nâng cao tay
              nghề đội ngũ, tự hào trở thành người bạn đồng hành đáng tin cậy
              trên mỗi chặng đường của bạn.
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <button
                onClick={handleNavigateToServices}
                className="h-12 rounded-lg bg-red-600 px-6 py-2 text-base text-white transition-colors hover:bg-red-700"
              >
                Dịch Vụ
              </button>
              <div className="flex items-center gap-2.5">
                <img
                  className="h-14 w-14 rounded-full border-4 border-red-500 object-cover"
                  src={ceoAvatar}
                  alt="CEO Avatar"
                />
                <div>
                  <div className="text-xl font-normal text-slate-700">
                    MotorMate
                  </div>
                  <div className="text-base text-zinc-600">
                    CEO & CO Founder
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION  */}
      <section id="mission" ref={missionRef} className="w-full scroll-mt-24">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="relative mx-auto max-w-[1920px] pt-14">
            <div className="absolute top-14 left-1/2 z-20 w-full -translate-x-1/2 -translate-y-1/2 px-8 lg:px-16 xl:px-20">
              <div className="mx-auto max-w-[1440px] bg-red-700 py-6 text-center text-2xl font-semibold text-white">
                Sứ Mệnh - MOTORMATE
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-zinc-700 px-8 pt-24 pb-16 text-white md:px-16 lg:px-24 animate-on-scroll">
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-4xl font-medium">
                      Sứ mệnh - Thúc đẩy thành công trong dự án.
                    </h2>
                    <p className="mt-2 text-base font-light leading-7">
                      Chúng tôi không chỉ bán phụ tùng, chúng tôi cung cấp giải
                      pháp. Sứ mệnh của MotorMate là đơn giản hóa việc chăm sóc
                      xe, giúp mọi người dễ dàng tiếp cận sản phẩm chính hãng và
                      dịch vụ chuyên nghiệp, từ đó nâng cao trải nghiệm và hiệu
                      suất cho chiếc xe của bạn.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-6">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-red-600">
                        <Cog className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <h3 className="text-xl font-semibold">
                          Chất Lượng Tối Ưu
                        </h3>
                        <p className="text-base font-light leading-7">
                          Chúng tôi áp dụng công nghệ và quy trình kiểm tra
                          nghiêm ngặt để đảm bảo mỗi sản phẩm đều đạt chất lượng
                          cao nhất.
                        </p>
                      </div>
                    </div>
                    <hr className="my-2 border-slate-800" />
                    <div className="flex items-start gap-6">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-red-600">
                        <CalendarDays className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <h3 className="text-xl font-semibold">
                          Đối Tác Tin Cậy
                        </h3>
                        <p className="text-base font-light leading-7">
                          MotorMate cam kết đồng hành lâu dài, trở thành đối tác
                          tin cậy trong việc bảo dưỡng và chăm sóc xe của bạn.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[400px] w-full lg:min-h-0 animate-on-scroll">
                <img
                  src={missionImage}
                  alt="Workshop"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="values"
        ref={valuesRef}
        className="w-full bg-gray-100 scroll-mt-24"
      >
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="mx-auto max-w-[1920px] px-12 py-16 md:py-24 lg:px-24 xl:px-32">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="animate-on-scroll">
                <h2 className="text-4xl font-medium text-red-600">
                  Giá Trị Cốt Lõi
                </h2>
                <p className="mt-4 text-base leading-7 text-stone-500">
                  Giá trị của chúng tôi không chỉ nằm ở sản phẩm, mà còn ở niềm
                  tin và sự hài lòng mà chúng tôi mang lại cho mỗi khách hàng.
                </p>
              </div>
              <div className="flex justify-center lg:justify-end animate-on-scroll">
                <img
                  src={coreValuesImage}
                  alt="Motorcycle parts"
                  className="max-w-md"
                />
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-4 rounded-lg bg-white p-6 shadow-sm animate-on-scroll">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AboutCar />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-700">
                    Chất Lượng Toàn Diện
                  </h3>
                  <p className="mt-2 text-base leading-7 text-zinc-600">
                    Mỗi phụ tùng đều được kiểm định nghiêm ngặt, đảm bảo chất
                    lượng và độ tương thích hoàn hảo cho chiếc xe của bạn.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-lg bg-white p-6 shadow-sm animate-on-scroll">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AboutWheel />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-700">
                    Hiệu Suất Vượt Trội
                  </h3>
                  <p className="mt-2 text-base leading-7 text-zinc-600">
                    Chúng tôi tập trung vào việc cung cấp các sản phẩm giúp tối
                    ưu hóa hiệu suất, mang lại trải nghiệm lái an toàn và mạnh
                    mẽ.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-lg bg-white p-6 shadow-sm animate-on-scroll">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AboutCoin />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-700">
                    Giá Cả Cạnh Tranh
                  </h3>
                  <p className="mt-2 text-base leading-7 text-zinc-600">
                    Cam kết mang đến những sản phẩm chất lượng cao với mức giá
                    hợp lý nhất, đảm bảo giá trị tốt nhất cho khách hàng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;
