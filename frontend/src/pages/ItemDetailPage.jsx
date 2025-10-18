import React, { useState, useEffect } from 'react'
import detailBg from '@/assets/detail-bg.jpg'
import productImage from '@/assets/part-lopsau.png'
import ItemDetail from '@/components/customer/ItemDetail';
import { Button } from '@/components/ui/button';
import ItemList from '@/components/customer/ItemList';

const mockProduct = {
  id: '123',
  name: "Lốp xe sau MotorMate",
  isFeatured: true,
  category: "lop-xe",
  rating: 5,
  description: [
    "Sản phẩm chất lượng cao, cân bằng và ổn định.",
    "Chứa hợp chất chống oxy hóa (vitamin E và selenium) cho hệ thống bền bỉ.",
    "Rãnh gai được thiết kế để thoát nước tốt và tăng cường độ bám đường.",
    "Được gia cố với canxi, phốt pho và vitamin D cho khung xương lốp vững chắc.",
  ],
  images: [
    productImage,
    productImage,
    productImage,
  ],
  stock: 23,
};

function ItemDetailPage() {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setProduct(mockProduct);
    }, 500);
  }, []);

  if (!product) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <main className="w-full">
      {/* --- HERO SECTION --- */}
      <section className="relative w-full py-16 md:py-24 mt-10 mb-6">
        <div className="absolute inset-0">
          <img src={detailBg} alt="Abstract red background" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold md:text-6xl">Chi Tiết Phụ Tùng</h1>
            <p className="mt-4 text-lg text-white/80">
              Chi Tiết {product.name}
            </p>
          </div>

          {/* Item Detail */}
          <div className="mt-12">
            <ItemDetail product={product} />
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS SECTION */}
      <section className="w-full bg-gray-100/70">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="mx-auto max-w-[1920px] px-8 py-16 md:py-24 lg:px-16 xl:px-20">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-4xl font-semibold text-red-700 md:text-5xl">Sản Phẩm Liên Quan</h2>
              <Button className="h-12 rounded-lg bg-red-700 px-6 text-base font-semibold text-white transition-colors hover:bg-red-800">
                Xem tất cả
              </Button>
            </div>
            {/* Item List */}
            <ItemList
              filters={{ category: product.category }}
              size={3}
            />
          </div>
        </div>
      </section>
    </main>
  )
}

export default ItemDetailPage