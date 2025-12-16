import React from 'react';
import { useLoaderData, Link } from 'react-router-dom';
import detailBg from '@/assets/detail-bg.jpg';
import ItemDetail from '@/components/customer/ItemDetail';
import { Button } from '@/components/ui/button';
import ItemList from '@/components/customer/ItemList';

function ItemDetailPage() {
  const { product, relatedProducts } = useLoaderData();

  if (!product) {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <p className="text-xl">Không thể tải thông tin sản phẩm.</p>
            <Link to="/items">
                <Button>Quay lại danh sách</Button>
            </Link>
        </div>
    );
  }

  return (
    <main className="w-full">
      <section className="relative w-full py-16 md:py-24 mb-6">
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

            <div className="mt-12">
                <ItemDetail product={product} />
            </div>
        </div>
      </section>

      <section className="w-full bg-gray-100/70">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="mx-auto max-w-[1920px] px-8 py-16 md:py-24 lg:px-16 xl:px-20">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-4xl font-semibold text-red-700 md:text-5xl">Sản Phẩm Liên Quan</h2>
              <Button asChild className="h-12 rounded-lg bg-red-700 px-6 text-base font-semibold text-white transition-colors hover:bg-red-800">
                <Link to={`/items?brand=${product.brand}`}>
                  Xem tất cả
                </Link>
              </Button>
            </div>

            <ItemList
              products={relatedProducts}
              size={3}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default ItemDetailPage;
