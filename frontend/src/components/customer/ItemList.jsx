import React from 'react'
import partImage1 from '@/assets/part-lopsau.png';
import partImage2 from '@/assets/part-bugi.png';
import partImage3 from '@/assets/part-maphanh.png';
import ItemCard from './ItemCard';

// Mock product data based on your schema
const mockProducts = [
    { _id: '1', name: 'Lốp sau MotorMate', price: 340000, description: 'Phụ Tùng và Phụ Kiện', image: partImage1, category: 'lop-xe' },
    { _id: '2', name: 'Bugi + IC MotorMate', price: 50000, description: 'Phụ Tùng và Phụ Kiện', image: partImage2, category: 'bugi' },
    { _id: '3', name: 'Bố Má Phanh MotorMate', price: 110000, description: 'Phụ Tùng và Phụ Kiện', image: partImage3, category: 'phanh' },
    { _id: '4', name: 'Dầu nhớt cao cấp', price: 150000, description: 'Dầu nhớt', image: partImage1, category: 'nhot' },
    { _id: '5', name: 'Lốp trước địa hình', price: 420000, description: 'Phụ Tùng và Phụ Kiện', image: partImage2, category: 'lop-xe' },
    { _id: '6', name: 'Xích tải nặng', price: 250000, description: 'Phụ Tùng và Phụ Kiện', image: partImage3, category: 'phu-tung-khac' },
    { _id: '7', name: 'Lốp sau loại B', price: 280000, description: 'Phụ Tùng và Phụ Kiện', image: partImage1, category: 'lop-xe' },
    { _id: '8', name: 'Bugi Iridium', price: 120000, description: 'Phụ Tùng và Phụ Kiện', image: partImage2, category: 'bugi' },
    { _id: '9', name: 'Má phanh sau', price: 90000, description: 'Phụ Tùng và Phụ Kiện', image: partImage3, category: 'phanh' },
];

/**
 * A component to display a list of products with filtering and size limiting.
 * @param {{
 * filters: { category?: string; sortBy?: string; query?: string; };
 * size?: number;
 * }} props
 */
function ItemList({ filters = {}, size }) {
    const [products, setProducts] = React.useState([]);

    React.useEffect(() => {

        const fetchAndFilterProducts = async () => {
            let fetchedProducts = await new Promise(resolve => setTimeout(() => resolve(mockProducts), 500));

            if (filters.category) {
                fetchedProducts = fetchedProducts.filter(p => p.category === filters.category);
            }
            if (filters.query) {
                fetchedProducts = fetchedProducts.filter(p => p.name.toLowerCase().includes(filters.query.toLowerCase()));
            }

            if (filters.sortBy) {
                fetchedProducts.sort((a, b) => {
                    switch (filters.sortBy) {
                        case 'price-asc':
                            return a.price - b.price;
                        case 'price-desc':
                            return b.price - a.price;
                        case 'name-asc':
                            return a.name.localeCompare(b.name);
                        case 'name-desc':
                            return b.name.localeCompare(a.name);
                        default:
                            return 0;
                    }
                });
            }

            if (size) {
                fetchedProducts = fetchedProducts.slice(0, size);
            }

            setProducts(fetchedProducts);
        };

        fetchAndFilterProducts();
    }, [filters, size]);

    return (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
                <ItemCard key={product._id} product={product} />
            ))}
        </div>
    )
}

export default ItemList
