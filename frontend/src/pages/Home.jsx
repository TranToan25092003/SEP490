import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import hero1 from '@/assets/header-img.jpg'
import g1 from '@/assets/gallery-1.jpg'
import g2 from '@/assets/gallery-2.jpg'
import g3 from '@/assets/gallery-3.jpg'
import part1 from '@/assets/part-lopsau.png'
import part2 from '@/assets/part-bugi.png'
import part3 from '@/assets/part-maphanh.png'
import bgParts from '@/assets/bg-parts.png'
import worldMap from '@/assets/world-map.png'
import service1 from '@/assets/service-suaxe.png'
import service2 from '@/assets/service-thaynhot.jpg'
import service3 from '@/assets/service-atvs.jpg'
import service4 from '@/assets/service-ruaxe.png'
import ctaBg from '@/assets/cta-bg.jpg'

function Home() {
  const slides = [hero1, g1, g2, g3]
  const [api, setApi] = React.useState(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [slideCount, setSlideCount] = React.useState(slides.length)

  const featuredParts = [
    {
      id: 1,
      name: 'Lốp sau MotorMate',
      category: 'Phụ Tùng và Phụ Kiện',
      price: '340.000 VND',
      image: part1,
    },
    {
      id: 2,
      name: 'Bugi + IC MotorMate',
      category: 'Phụ Tùng và Phụ Kiện',
      price: '50.000 VND',
      image: part2,
    },
    {
      id: 3,
      name: 'Bố Má Phanh MotorMate',
      category: 'Phụ Tùng và Phụ Kiện',
      price: '110.000 VND',
      image: part3,
    },
  ]

  const services = [
    { id: 1, name: 'SỬA XE', tag: 'New | Used', image: service1 },
    { id: 2, name: 'THAY NHỚT', tag: 'New | Used', image: service2 },
    { id: 3, name: 'ATVS', tag: 'New | Used', image: service3 },
    { id: 4, name: 'RỬA XE', tag: 'New | Used', image: service4 },
  ]

  React.useEffect(() => {
    if (!api) return
    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap())
      setSlideCount(api.scrollSnapList().length)
    }
    onSelect()
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  return (
    <main className="w-full">
      {/* Hero Carousel - full-bleed */}
      <section className="w-full bg-black">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="mx-auto max-w-[1920px]">
            <Carousel className="w-full" setApi={setApi}>
              <CarouselContent className="">
                {slides.map((src, idx) => (
                  <CarouselItem key={src}>
                    <div className="w-full">
                      <div className="relative aspect-[16/7] w-full max-h-[800px]">
                        {/* 1. Image (bottom layer) */}
                        <img
                          src={src}
                          alt={`slide-${idx + 1}`}
                          className="absolute inset-0 h-full w-full object-cover"
                        />

                        {/* 2. Gradient Overlay (middle layer) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                        {/* 3. Content (top layer, with z-index) */}
                        <div className="relative z-10 flex h-full w-full items-start md:items-center">
                          <div className="mx-auto mt-24 space-y-4 p-4 text-center md:mt-0 md:ml-28 md:space-y-6 md:p-0 lg:ml-40 xl:ml-44 2xl:ml-48">
                            <div className="font-['Poppins'] justify-start text-4xl font-semibold text-white/95 md:text-5xl md:text-white xl:text-6xl">
                              MotorMate
                            </div>
                            <div className="font-['Poppins'] text-center text-xl font-extrabold text-white/95 md:text-2xl md:text-white">
                              Phụ tùng tốt nhất cho <br className="hidden md:block" /> mọi nhà
                            </div>
                            <button
                              className="mx-auto inline-flex w-40 items-center justify-center gap-2.5 rounded-lg bg-red-600 p-2.5
                                       font-['Poppins'] text-lg font-bold text-white
                                       transition-all duration-150 ease-in-out
                                       hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg
                                       active:scale-95
                                       cursor-pointer"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-5 w-5"
                              >
                                <path d="M19 5h-2l-1 2h-2l-.72-1.44A2 2 0 0 0 11.46 4H9v2h2.46l1 2H9.5a5.5 5.5 0 1 0 5.37 6.66l1.22-3.66H18a3 3 0 1 0 0-6zm-9.5 12A3.5 3.5 0 1 1 13 13.5 3.5 3.5 0 0 1 9.5 17z" />
                              </svg>
                              Tìm hiểu
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-white/70 hover:bg-white" />
              <CarouselNext className="right-4 bg-white/70 hover:bg-white" />
              {/* dots */}
              {slideCount > 1 && (
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button
                      key={`dot-${i}`}
                      aria-label={`Go to slide ${i + 1}`}
                      onClick={() => api?.scrollTo(i)}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${selectedIndex === i ? 'bg-white' : 'bg-white/50'
                        }`}
                    />
                  ))}
                </div>
              )}
            </Carousel>
          </div>
        </div>
      </section>

      {/* Phụ Tùng Nổi Bật */}
      <section>
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="relative w-full overflow-hidden bg-black">
            {/* Background Image and Overlay */}
            <div className="absolute inset-0">
              <img
                src={bgParts}
                alt="Motorcycle parts background"
                className="h-full w-full object-cover opacity-20"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 px-8 py-16 md:px-12 md:py-24 lg:px-16">
              <div className="mb-12 text-center">
                <h2 className="text-4xl font-bold text-white md:text-5xl">Phụ Tùng Nổi Bật</h2>
                <p className="mt-4 text-lg text-gray-300">Một số phụ tùng nổi bật của MotorMate</p>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {featuredParts.map((part) => (
                  <div key={part.id} className="group relative overflow-hidden rounded-lg bg-white shadow-lg">
                    <div className="p-6">
                      <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                        <img src={part.image} alt={part.name} className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <div className="mt-6 flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{part.name}</h3>
                          <p className="mt-1 text-sm text-gray-500">{part.category}</p>
                          <p className="mt-3 text-lg font-bold text-red-600">{part.price}</p>
                        </div>
                        <button className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition-all duration-200 hover:bg-red-700 active:scale-90">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* --- NEW MOTORMATE QUOTE SECTION --- */}
              <div className="mt-20 grid grid-cols-1 items-center gap-12 md:mt-32 md:grid-cols-2">
                {/* Left side: Text content */}
                <div className="text-center md:text-left">
                  <h3 className="font-['Poppins'] text-lg font-bold uppercase tracking-[0.2em] text-red-600">
                    MotorMate
                  </h3>
                  <p className="font-['Poppins'] mt-6 text-3xl font-semibold leading-tight text-white md:text-4xl">
                    “ Cung cấp dịch vụ trải dài khắp cả{' '}
                    <span className="text-red-500">Việt Nam</span>. Mang đến phụ tùng xe tốt
                    nhất cho mọi nhà. ”
                  </p>
                </div>
                {/* Right side: World Map Image */}
                <div className="flex justify-center md:justify-end">
                  <img src={worldMap} alt="World Map" className="w-full max-w-lg opacity-70" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Services --- */}
      <section className="w-full bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1920px] px-8 md:px-12 lg:px-16">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-red-600 md:text-5xl">Dịch Vụ của MotorMate</h2>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {services.map((service) => (
              <div key={service.id} className="group relative aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-lg shadow-lg">
                {/* Background Image */}
                <img
                  src={service.image}
                  alt={service.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />

                {/* Content */}
                <div className="relative flex h-full items-start p-6">
                  <div className="rounded-md bg-red-600/90 px-5 py-3 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">{service.tag}</p>
                    <h3 className="mt-1 text-xl font-bold">{service.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- NEW CTA SECTION --- */}
      <section className="w-full">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="relative mx-auto max-w-[1920px]">
            <img src={ctaBg} alt="Motorcycle on the road" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 md:justify-end">
              <div className="w-11/12 max-w-xl border-4 border-white  p-8 text-white md:mr-16 lg:mr-24">
                <h2 className="text-3xl font-bold uppercase tracking-wider md:text-4xl">
                  Welcome to the <span className="text-red-500">MotorMate</span>
                </h2>
                <p className="mt-4 text-gray-300">
                  Praesent consequat pharetra commodo. Vestibulum nec lectus nibh. Curabitur tellus leo, euismod sit amet gravida at, egestas sed lectus.
                </p>
                <button
                  className="mt-8 inline-flex items-center justify-center bg-red-600 px-8 py-3
                                     text-base font-bold text-white
                                     transition-all duration-150 ease-in-out
                                     hover:bg-red-700 hover:-translate-y-0.5
                                     active:scale-95"
                >
                  READ MORE
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home