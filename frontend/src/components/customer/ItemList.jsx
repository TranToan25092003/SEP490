import React from 'react';
import ItemCard from './ItemCard'; // Giả sử ItemCard là một component anh em

/**
 * @param {{
 * products: Array<Object>; // Mảng các đối tượng sản phẩm để hiển thị
 * size?: number; // Số lượng sản phẩm muốn hiển thị
 * }} props
 */
function ItemList({ products = [], size }) {
  // Kiểm tra nếu không có sản phẩm nào
  if (!products || products.length === 0) {
    return <p className="text-center text-gray-500">Không tìm thấy sản phẩm nào.</p>;
  }

  // Cắt mảng sản phẩm theo 'size' nếu được cung cấp
  const displayedProducts = size ? products.slice(0, size) : products;

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {/* Lặp qua mảng sản phẩm đã được xử lý và hiển thị */}
      {displayedProducts.map((product) => (
        <ItemCard key={product._id} product={product} />
      ))}
    </div>
  );
}

export default ItemList;

