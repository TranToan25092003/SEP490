import React from 'react'
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import partImage from '@/assets/part-lopsau.png'; 

// Function to format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

function ItemCard({ product }) {
  const { name, description, price, image } = product || {};

  return (
    <div className="w-full h-auto p-6 bg-white rounded-3xl shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)] flex flex-col gap-7 overflow-hidden">
      <div className="self-stretch h-60 relative rounded-[10px] bg-gray-100 flex items-center justify-center">
        <img src={image || partImage} alt={name || "Product Image"} className="h-full w-full object-contain p-4" />
      </div>
      
      <div className="self-stretch flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h3 className="text-slate-800 text-base font-bold leading-normal tracking-tight">{name || 'Lốp sau MotorMate'}</h3>
          <p className="text-neutral-500 text-sm font-normal leading-tight tracking-tight">{description || 'Phụ Tùng và Phụ Kiện'}</p>
          <p className="text-red-600 text-base font-bold leading-tight tracking-tight">{price ? formatPrice(price) : '340.000 VND'}</p>
        </div>
        <Button size="icon" className="w-10 h-10 bg-red-700 rounded-full shadow-[0px_1px_10px_0px_rgba(0,0,0,0.10)] flex-shrink-0 hover:bg-red-800">
          <Plus className="w-5 h-5 text-white" />
        </Button>
      </div>
    </div>
  )
}

export default ItemCard
