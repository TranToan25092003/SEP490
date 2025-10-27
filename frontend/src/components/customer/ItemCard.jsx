import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import partImage from "@/assets/part-lopsau.png";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

function ItemCard({ product }) {
  const { _id, name, description, sellingPrice, image } = product || {};

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Sản phẩm ${name} đã được thêm vào giỏ hàng.`);
  };

  return (
    <Link to={`/items/${_id}`} className="group block h-full">
      <div className="w-full h-[28rem] p-6 bg-white rounded-3xl shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)] flex flex-col gap-4 overflow-hidden transition-shadow duration-300 group-hover:shadow-xl">
        <div className="self-stretch h-60 relative rounded-[10px] flex items-center justify-center overflow-hidden bg-gray-50">
          <img
            src={image || partImage}
            alt={name || "Product Image"}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.src = partImage;
            }}
          />
        </div>

        <div className="self-stretch flex-grow flex flex-col justify-between">
          <div>
            <h3 className="text-slate-800 text-base font-bold leading-normal tracking-tight truncate">
              {name || "Lốp sau MotorMate"}
            </h3>
            <p className="text-neutral-500 text-sm font-normal leading-tight tracking-tight line-clamp-5">
              {description || "Phụ Tùng và Phụ Kiện"}
            </p>
          </div>

          <div className="flex justify-between items-end">
            <p className="text-red-600 text-base font-bold leading-tight tracking-tight">
              {sellingPrice ? formatPrice(sellingPrice) : "??? VND"}
            </p>
            <Button
              size="icon"
              className="w-10 h-10 bg-red-700 rounded-full shadow-[0px_1px_10px_0px_rgba(0,0,0,0.10)] flex-shrink-0 hover:bg-red-800"
              onClick={handleAddToCart}
            >
              <Plus className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ItemCard;
