import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import productHeroBg from '@/assets/product-hero-bg.jpg'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const mockCategories = [
    { id: 'lop-xe', name: 'Lốp Xe' },
    { id: 'bugi', name: 'Bugi & IC' },
    { id: 'phanh', name: 'Phanh' },
    { id: 'nhot', name: 'Dầu nhớt' },
];

const sortOptions = [
    { value: 'price-asc', label: 'Giá Tăng dần' },
    { value: 'price-desc', label: 'Giá Giảm dần' },
    { value: 'name-asc', label: 'Tên A-Z' },
    { value: 'name-desc', label: 'Tên Z-A' },
];

function ItemList() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('price-asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchFilterData = () => {
        setTimeout(() => {
            setCategories(mockCategories);
        }, 500);
    };

    fetchFilterData();
  }, []);

  const handleSearch = () => {
    console.log('Searching with filters:', {
        category: selectedCategory,
        sort: selectedSort,
        query: searchQuery,
    });
  };

  return (
    <main className="w-full">
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

      <section className="w-full bg-zinc-800">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="mx-auto max-w-[1920px]">
            <div className="flex flex-col lg:flex-row">
              <div className="flex h-12 w-full flex-shrink-0 items-center justify-center bg-zinc-700 lg:h-auto lg:w-40">
                <h2 className="text-base font-bold leading-snug text-white">Bộ Lọc</h2>
              </div>
              <div className="flex w-full flex-wrap items-center gap-4 bg-zinc-700 p-6 lg:p-4">
                <div className="w-full sm:w-auto sm:flex-1 lg:max-w-xs">
                    <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                      <SelectTrigger className="h-11 w-full rounded-sm border-0 bg-gray-100 text-sm text-neutral-800 focus:ring-2 focus:ring-red-600">
                        <SelectValue placeholder="Loại phụ tùng" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-auto sm:flex-1 lg:max-w-xs">
                    <Select onValueChange={setSelectedSort} defaultValue={selectedSort}>
                      <SelectTrigger className="h-11 w-full rounded-sm border-0 bg-gray-100 text-sm text-neutral-800 focus:ring-2 focus:ring-red-600">
                        <SelectValue placeholder="Sắp xếp theo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="w-full lg:flex-1">
                  <Input
                    type="text"
                    placeholder="Nhập tên phụ tùng..."
                    className="h-11 w-full rounded-sm border-0 bg-gray-100 px-4 text-sm text-neutral-800 placeholder-neutral-500 focus-visible:ring-2 focus-visible:ring-red-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  className="h-11 w-full gap-2 rounded-sm bg-red-700 text-sm font-bold uppercase tracking-tight text-white transition-colors hover:bg-red-800 sm:w-auto sm:px-8"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                  <span>Tìm kiếm</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ItemList