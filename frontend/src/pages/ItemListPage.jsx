import React, { useState, useEffect, useMemo } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Package, Users, BarChart, ShieldCheck, FilterX } from 'lucide-react'
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import ItemList from '@/components/customer/ItemList'

const sortOptions = [
  { value: 'sellingPrice,asc', label: 'Giá Tăng dần' },
  { value: 'sellingPrice,desc', label: 'Giá Giảm dần' },
  { value: 'name,asc', label: 'Tên A-Z' },
  { value: 'name,desc', label: 'Tên Z-A' },
];

const AnimatedCounter = ({ endValue }) => {
  return (
    <CountUp end={endValue} duration={2.5} separator="," enableScrollSpy scrollSpyDelay={200} scrollSpyOnce={true} />
  );
};

const stats = [
  { icon: Package, value: 100, label: "Phụ Tùng" },
  { icon: Users, value: 1234, label: "Khách Hàng" },
  { icon: BarChart, value: 3459, label: "Truy Cập" },
  { icon: ShieldCheck, value: 247, label: "Tin Tưởng" },
];

function ItemListPage() {
  const { parts, pagination, groupedModels } = useLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('vehicleModel') || '');
  const [selectedSort, setSelectedSort] = useState(`${searchParams.get('sortBy') || 'sellingPrice'},${searchParams.get('sortOrder') || 'asc'}`);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const brands = useMemo(() => groupedModels.map(group => group.brand), [groupedModels]);
  const models = useMemo(() => {
    if (selectedBrand) {
      const brandData = groupedModels.find(group => group.brand === selectedBrand);
      return brandData ? brandData.models : [];
    }
    return groupedModels.flatMap(group => group.models);
  }, [selectedBrand, groupedModels]);

  useEffect(() => {
    const modelIdFromUrl = searchParams.get('vehicleModel');
    if (modelIdFromUrl && groupedModels.length > 0) {
      for (const group of groupedModels) {
        const foundModel = group.models.find(model => model._id === modelIdFromUrl);
        if (foundModel) {
          setSelectedBrand(group.brand);
          break;
        }
      }
    }
  }, [searchParams, groupedModels]);

  const updateUrlParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    for (const key in newParams) {
      if (newParams[key]) {
        params.set(key, newParams[key]);
      } else {
        params.delete(key);
      }
    }
    navigate(`?${params.toString()}`);
  }

  const handleSearch = () => {
    const [sortBy, sortOrder] = selectedSort.split(',');
    updateUrlParams({
      search: searchQuery,
      brand: selectedBrand,
      vehicleModel: selectedModel,
      sortBy,
      sortOrder,
      page: 1, 
    });
  };

  const handleClearFilters = () => {
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedSort('sellingPrice,asc');
    setSearchQuery('');
    navigate('/items');
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    navigate(`?${params.toString()}`);
  }

  return (
    <main className="w-full bg-white">
      <section className="relative w-full mb-20 md:mb-16">
        <div className="h-[500px] w-full md:h-[600px]">
          <img src={productHeroBg} alt="Motorcycle" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white">
            <h1 className="text-5xl font-bold md:text-7xl">Phụ Tùng</h1>
            <p className="mt-4 text-lg md:text-xl">Danh sách phụ tùng của chúng tôi</p>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 w-11/12 max-w-7xl -translate-x-1/2 translate-y-1/2">
          <div className="rounded-md bg-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between rounded-t-md px-6 py-3">
              <h2 className="text-base font-bold text-white">Bộ Lọc</h2>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-white/70 hover:bg-zinc-700 hover:text-white"
                onClick={handleClearFilters}
              >
                <FilterX className="h-4 w-4" />
                Bỏ lọc
              </Button>
            </div>
            <div className="rounded-b-md bg-zinc-800 p-6 pt-2">
              <div className="flex w-full flex-col gap-4 lg:flex-row">
                <div className="flex-1 min-w-[180px]">
                  <Select onValueChange={(value) => { setSelectedBrand(value); setSelectedModel(''); }} value={selectedBrand}>
                    <SelectTrigger className="h-11 w-full rounded-sm border-0 bg-white text-sm text-zinc-900 focus:ring-2 focus:ring-red-600">
                      <SelectValue placeholder="Hãng xe" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Select onValueChange={setSelectedModel} value={selectedModel}>
                    <SelectTrigger className="h-11 w-full rounded-sm border-0 bg-white text-sm text-zinc-900 focus:ring-2 focus:ring-red-600">
                      <SelectValue placeholder="Dòng xe" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model._id} value={model._id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Select onValueChange={setSelectedSort} value={selectedSort}>
                    <SelectTrigger className="h-11 w-full rounded-sm border-0 bg-white text-sm text-zinc-900 focus:ring-2 focus:ring-red-600">
                      <SelectValue placeholder="Sắp xếp theo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-1 min-w-[250px] gap-2">
                  <Input
                    type="text"
                    placeholder="Nhập tên..."
                    className="h-9 w-full rounded-sm border-0 bg-white px-4 text-sm text-zinc-900 placeholder-zinc-500 focus-visible:ring-2 focus-visible:ring-red-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button
                    className="h-9 gap-2 rounded-sm bg-red-700 px-6 text-sm font-bold uppercase text-white transition-colors hover:bg-red-800"
                    onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                    <span>Tìm</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 pb-16 md:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <ItemList products={parts} />
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.currentPage > 1) {
                          handlePageChange(pagination.currentPage - 1);
                        }
                      }}
                      isActive={pagination.currentPage > 1}
                    />
                  </PaginationItem>

                  {[...Array(pagination.totalPages).keys()].map(page => (
                    <PaginationItem key={page + 1}>
                      <PaginationLink
                        href="#"
                        isActive={pagination.currentPage === page + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page + 1);
                        }}
                      >
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.currentPage < pagination.totalPages) {
                          handlePageChange(pagination.currentPage + 1);
                        }
                      }}
                      isActive={pagination.currentPage < pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </section>

      <section className="w-full mb-12">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="relative mx-auto max-w-[1920px]">
            <img src={statsBg} alt="Abstract background" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-zinc-800/80"></div>
            <div className="relative z-10 grid grid-cols-1 gap-8 px-8 py-16 text-white sm:grid-cols-2 lg:grid-cols-4">
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
