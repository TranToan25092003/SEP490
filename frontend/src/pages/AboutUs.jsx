import React from 'react'
// --- Map Library Imports ---
// Make sure to install these packages: npm install react-leaflet leaflet
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css' // Required for map styling
import L from 'leaflet'

import aboutMotorcycle from '@/assets/about-motorcycle.png'

// --- Custom SVG Icon for map markers to match the design ---
const createMapIcon = (color) => {
    return new L.divIcon({
        html: `<svg viewBox="0 0 100 125" fill="${color}"><path d="M50,0A39.4,39.4,0,0,0,10.6,39.4c0,21.8,25.9,55.4,35.8,69.5a2.9,2.9,0,0,0,3.6,0C60,94.8,89.4,61.2,89.4,39.4A39.4,39.4,0,0,0,50,0Zm0,58.8A19.4,19.4,0,1,1,69.4,39.4,19.4,19.4,0,0,1,50,58.8Z"/></svg>`,
        className: 'bg-transparent border-0',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
    });
};

const bluePin = createMapIcon('#4285F4');
const redPin = createMapIcon('#DB4437');


function About() {
  // Set position to Hanoi, Vietnam coordinates
  const position = [21.0285, 105.8542] 

  return (
    <main className="w-full overflow-x-hidden">
      {/* This section now has a relative position to create a stacking context */}
      <section className="relative z-10 w-full bg-white pb-24 md:pb-32">
        <div className="mx-auto max-w-[1920px] px-8 lg:px-16 xl:px-20">
          {/* Main Content Area */}
          <div className="grid grid-cols-1 items-center gap-12 pt-16 md:grid-cols-2 md:pt-24">
            {/* Left Column: Text Content */}
            <div className="text-center md:text-left">
              <h1 className="font-['Poppins'] text-4xl font-semibold text-neutral-700 md:text-5xl lg:text-6xl">
                About <span className="text-red-600">MotorMate</span>
              </h1>
              <p className="font-['Poppins'] mt-2 text-xl font-semibold text-zinc-900 md:text-2xl">
                Phụ tùng tốt nhất cho mọi nhà
              </p>
              <p className="font-['Poppins'] mt-4 text-base text-zinc-900 md:text-lg">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi lobortis maximus nunc
              </p>
              <button
                className="font-['Poppins'] mt-8 rounded-lg bg-zinc-700 px-6 py-3
                                     text-base font-normal text-white
                                     transition-all duration-150 ease-in-out
                                     hover:bg-zinc-800 hover:-translate-y-0.5
                                     active:scale-95"
              >
                Tìm hiểu
              </button>
            </div>

            {/* Right Column: Interactive Map */}
            <div className="relative h-[400px] w-full md:h-[460px]">
              <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="h-full w-full rounded-lg">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[21.03, 105.85]} icon={bluePin}></Marker>
                <Marker position={[21.02, 105.86]} icon={redPin}></Marker>
              </MapContainer>
              {/* Motorcycle image with higher z-index to appear on top of the map */}
              <img 
                src={aboutMotorcycle} 
                alt="Red motorcycle" 
                className="absolute z-40 bottom-[-100px] right-[-60px] w-[140%] max-w-none h-auto drop-shadow-2xl" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Red Bar - full bleed, with a lower z-index */}
      <section className="relative z-0 bg-red-700">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="mx-auto max-w-[1920px] px-8 pt-16 pb-12 lg:px-16 xl:px-20">
              <div className="flex flex-col gap-5">
                   {/* Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
                      <div className="flex items-center gap-6">
                          <h3 className="font-['Poppins'] text-2xl font-medium leading-7 text-white">Thành Lập</h3>
                          <div className="flex items-center gap-5 font-['Poppins'] text-base font-medium leading-7 text-rose-300">
                              <a href="#" className="border-b border-white pb-1 text-white">Thành Lập</a>
                              <a href="#" className="transition-colors hover:text-white">Giá Trị</a>
                              <a href="#" className="transition-colors hover:text-white">Sứ Mệnh</a>
                          </div>
                      </div>
                  </div>
                   {/* Form Controls */}
                  <div className="flex flex-wrap items-center gap-4">
                      <select className="h-10 w-32 rounded bg-white px-4 py-2 font-['Poppins'] text-base font-medium leading-7 text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-800">
                          <option>2025</option>
                      </select>
                      <select className="h-10 w-32 rounded bg-white px-4 py-2 font-['Poppins'] text-base font-medium leading-7 text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-800">
                          <option>09</option>
                      </select>
                      <select className="h-10 w-32 rounded bg-white px-4 py-2 font-['Poppins'] text-base font-medium leading-7 text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-800">
                          <option>26</option>
                      </select>
                      <input type="text" defaultValue="Thành Phố Hồ Chí Minh, Việt Nam" className="h-10 flex-grow rounded bg-white px-4 py-2 font-['Poppins'] text-base font-medium leading-7 text-zinc-600 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-800 md:w-[485px]" />
                      <button className="h-10 w-48 rounded bg-zinc-800 px-4 py-2 font-['Poppins'] text-base font-medium leading-7 text-white transition-colors hover:bg-black">
                          Xem trên bản đồ
                      </button>
                  </div>
              </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default About