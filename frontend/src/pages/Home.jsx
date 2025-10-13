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

function Home() {
  const slides = [hero1, g1, g2, g3]
  const [api, setApi] = React.useState(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [slideCount, setSlideCount] = React.useState(slides.length)

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
                            {/* --- SIMPLIFIED AND CORRECTED BUTTON --- */}
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
    </main>
  )
}

export default Home