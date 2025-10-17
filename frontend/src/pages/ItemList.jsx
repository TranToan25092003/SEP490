import { Search } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import React from 'react'
import productHeroBg from '@/assets/product-hero-bg.jpg'

function ItemList() {
    return (
        <main className="w-full">
            {/* --- HERO SECTION --- */}
            <section className="relative w-full bg-black">
                <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[500px] w-screen md:h-[600px]">
                    <div className="absolute inset-0">
                        <img src={productHeroBg} alt="Motorcycle" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/60"></div>
                    </div>
                    <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
                        <h1 className="text-5xl font-bold md:text-7xl">Phụ Tùng</h1>
                        <p className="mt-4 text-lg md:text-xl">Danh sách phụ tùng của chúng tôi</p>
                    </div>
                </div>
            </section>

            {/* --- FILTER SECTION --- */}
            <section className="w-full bg-zinc-800">
                <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
                    <div className="mx-auto max-w-[1920px]">
                        <div className="flex flex-col lg:flex-row">
                            {/* Filter Title */}
                            <div className="flex h-12 w-full flex-shrink-0 items-center justify-center bg-zinc-700 lg:h-auto lg:w-40">
                                <h2 className="text-base font-bold leading-snug text-white">Bộ Lọc</h2>
                            </div>
                            {/* Filter Controls */}
                            <div className="flex w-full flex-wrap items-center gap-4 bg-zinc-700 p-6 lg:p-4">
                                {/* Category Select */}
                                <div className="relative w-full sm:w-auto sm:flex-1 lg:max-w-xs">
                                    <select className="h-11 w-full appearance-none rounded-sm bg-gray-100 px-4 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-600">
                                        <option>Loại phụ tùng</option>
                                        {/* Add other options here */}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                </div>
                                {/* Sort Select */}
                                <div className="relative w-full sm:w-auto sm:flex-1 lg:max-w-xs">
                                    <select className="h-11 w-full appearance-none rounded-sm bg-gray-100 px-4 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-600">
                                        <option>Giá Tăng dần</option>
                                        <option>Giá Giảm dần</option>
                                        {/* Add other options here */}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                </div>
                                {/* Search Input */}
                                <div className="relative w-full lg:flex-1">
                                    <input
                                        type="text"
                                        placeholder="Nhập tên phụ tùng..."
                                        className="h-11 w-full rounded-sm bg-gray-100 px-4 text-sm text-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                                    />
                                </div>
                                {/* Search Button */}
                                <button className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-red-700 text-sm font-bold uppercase tracking-tight text-white transition-colors hover:bg-red-800 sm:w-auto sm:px-8">
                                    <Search className="h-4 w-4" />
                                    <span>Tìm kiếm</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default ItemList
