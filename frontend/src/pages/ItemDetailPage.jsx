import React from 'react'
import detailBg from '@/assets/detail-bg.jpg' 

function ItemDetailPage() {
  // This will later come from an API call based on the product ID in the URL
  const productName = "Lốp xe sau MotorMate";

  return (
    <main className="w-full bg-white">
      <section className="w-full my-16 md:my-24">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="relative mx-auto max-w-[1920px]">
            <img src={detailBg} alt="Abstract red background" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/70"></div>

            <div className="relative z-10 py-24 text-center text-white">
              <h1 className="text-5xl font-bold md:text-6xl">Chi Tiết Phụ Tùng</h1>
              <p className="mt-4 text-lg text-white/80">
                Chi Tiết {productName}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The rest of the page content will go here */}
    </main>
  )
}

export default ItemDetailPage
