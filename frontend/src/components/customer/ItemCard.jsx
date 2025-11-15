import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Import Button
import { ChevronLeft, ChevronRight } from "lucide-react";
import partImage from "@/assets/part-lopsau.png";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

function ItemCard({ product }) {
  const { _id, name, description, sellingPrice, media } = product || {};

  // Get the first image from media array, or use placeholder
  const productImage =
    media && media.length > 0 && media[0].url ? media[0].url : partImage;

  // Lấy URL từ đối tượng media (đã được populate)
  const images =
    media && media.length > 0
      ? media.map((m) => m.url) // Giả sử media là [{ url: '...' }, ...]
      : [partImage]; // Fallback

  // State để quản lý index của ảnh hiện tại
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index khi product hoặc images thay đổi
  useEffect(() => {
    setCurrentIndex(0);
  }, [product?._id, images.length]);

  const handleInteraction = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const prevImage = (e) => {
    handleInteraction(e);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    handleInteraction(e);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Link to={`/items/${_id}`} className="group block h-full">
      <div className="w-full h-[28rem] p-6 bg-white rounded-3xl shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)] flex flex-col gap-4 overflow-hidden transition-shadow duration-300 group-hover:shadow-xl">
        <div className="self-stretch h-60 relative rounded-[10px] flex items-center justify-center bg-gray-50 overflow-hidden">
          <img
            src={images[currentIndex]}
            alt={name || "Product Image"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" // Đã thay đổi từ object-contain p-4
            onError={(e) => {
              e.target.src = partImage;
            }}
          />

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50 transition-opacity"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50 transition-opacity"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i === currentIndex ? "bg-red-600" : "bg-white/70"
                    } transition-all`}
                  />
                ))}
              </div>
            </>
          )}
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
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ItemCard;
