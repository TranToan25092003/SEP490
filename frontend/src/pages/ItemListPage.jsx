import React, { useState, useEffect } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom';
import { Search, Package, Users, BarChart, ShieldCheck } from 'lucide-react'
import CountUp from 'react-countup'
import productHeroBg from '@/assets/product-hero-bg.jpg'
import statsBg from '@/assets/stats-bg.jpg'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ItemList from '@/components/customer/ItemList'


const mockCategories = [
    { id: 'lop-xe', name: 'Lốp Xe' },
    { id: 'bugi', name: 'Bugi & IC' },
    { id: 'phanh', name: 'Phanh' },
    { id: 'nhot', name: 'Dầu nhớt' },
];

const sortOptions = [
    { value: 'sellingPrice,asc', label: 'Giá Tăng dần' },
    { value: 'sellingPrice,desc', label: 'Giá Giảm dần' },
    { value: 'name,asc', label: 'Tên A-Z' },
    { value: 'name,desc', label: 'Tên Z-A' },
];

const AnimatedCounter = ({ endValue }) => {
  return (
    <CountUp
      end={endValue}
      duration={2.5}
      separator=","
      enableScrollSpy
      scrollSpyDelay={200}
      scrollSpyOnce={true}
    />
  );
};

const stats = [
  { icon: Package, value: 100, label: "Phụ Tùng" },
  { icon: Users, value: 1234, label: "Khách Hàng" },
  { icon: BarChart, value: 3459, label: "Truy Cập" },
  { icon: ShieldCheck, value: 247, label: "Tin Tưởng" },
];

function ItemListPage() {
  // Get data from the React Router loader
  const { parts, pagination } = useLoaderData();
  const navigate = useNavigate();

  // State for filter controls to manage their current values
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('sellingPrice,asc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // This can still be used to fetch static filter options
    const fetchFilterData = () => {
      setTimeout(() => {
        setCategories(mockCategories);
      }, 500);
    };

    fetchFilterData();
  }, []);

  // Update URL to trigger the loader to re-fetch data
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) {
        params.set('search', searchQuery);
    }
    if (selectedCategory) {
        params.set('category', selectedCategory);
    }
    if(selectedSort) {
        const [sortBy, sortOrder] = selectedSort.split(',');
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
    }
    // Navigate to the same page but with new query params, which triggers the loader
    navigate(`?${params.toString()}`);
  };

  return (
    <main className="w-full bg-white">
      {/* --- HERO & FILTER SECTION --- */}
      <section className="relative w-full mb-32 md:mb-24">
        <div className="h-[500px] w-full md:h-[600px]">
          <img src={productHeroBg} alt="Motorcycle" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white">
            <h1 className="text-5xl font-bold md:text-7xl">Phụ Tùng</h1>
            <p className="mt-4 text-lg md:text-xl">Danh sách phụ tùng của chúng tôi</p>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 w-11/12 max-w-6xl -translate-x-1/2 translate-y-1/2">
          <div>
            <div className="inline-block rounded-t-md bg-zinc-800 px-6 py-3">
              <h2 className="text-base font-bold text-white">Bộ Lọc</h2>
            </div>
            <div className="rounded-b-md rounded-tr-md bg-zinc-800 p-6 shadow-2xl">
              <div className="flex w-full flex-wrap items-center gap-4">
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

      {/* --- PRODUCT GRID SECTION --- */}
      <section className="w-full px-8 pb-24 md:px-12 lg:px-16">
        <div className="mx-auto max-w-6xl">
          {/* ItemList now receives the products directly from the loader */}
          <ItemList products={parts} />
          <div className="mt-12 flex justify-center">
            {/* TODO: Add pagination logic here using the 'pagination' object */}
            <Button className="h-11 w-44 rounded-sm bg-red-700 text-sm font-bold uppercase tracking-tight text-white shadow-lg transition-colors hover:bg-red-800">
              Xem tất cả
            </Button>
          </div>
        </div>
      </section>

      {/*STATS SECTION */}
      <section className="w-full mb-20">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="relative mx-auto max-w-[1920px]">
            <img src={statsBg} alt="Abstract background" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0"></div>
            <div className="relative z-10 grid grid-cols-1 gap-12 px-8 py-28 text-white sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center justify-center gap-4">
                  <stat.icon className="h-14 w-14 flex-shrink-0 text-white" strokeWidth={1.5} />
                  <div className="flex flex-col">
                    <div className="text-5xl font-bold leading-10">
                      <AnimatedCounter endValue={stat.value} />+
                    </div>
                    <div className="mt-2 text-sm font-normal uppercase leading-none">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ItemListPage
