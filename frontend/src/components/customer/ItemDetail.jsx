import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import productImagePlaceholder from '@/assets/part-lopsau.png';

function ItemDetail({ product }) {
    const [activeImage, setActiveImage] = useState('');

    useEffect(() => {
        // Set the active image when the product data is available
        if (product && product.media && product.media.length > 0) {
            setActiveImage(product.media[0].url);
        } else if (product) {
            setActiveImage(productImagePlaceholder);
        }
    }, [product]);

    if (!product) {
        return null;
    }

    const descriptionLines = product.description ? product.description.split('\n').filter(line => line.trim() !== '') : [];
    const thumbnails = product.media && product.media.length > 0 ? product.media.map(m => m.url) : [productImagePlaceholder];

    return (
        <div className="grid grid-cols-1 gap-8 rounded-3xl bg-gray-50 p-6 shadow-2xl md:grid-cols-2 md:p-8 lg:p-12">
            {/* Left Column: Image Gallery */}
            <div className="flex flex-col gap-4">
                <a href="/items" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-500 hover:text-indigo-700">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Listing
                </a>
                <div className="aspect-square w-full rounded-lg bg-white p-4">
                    <img src={activeImage} alt={product.name} className="h-full w-full object-contain" />
                </div>
            </div>

            {/* Right Column: Product Info */}
            <div className="flex flex-col gap-5 pt-0 md:pt-8">
                {product.isFeatured && (
                    <div className="w-fit rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                        Nổi bật
                    </div>
                )}
                <h2 className="text-3xl font-semibold text-black">{product.name}</h2>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium tracking-widest text-red-700">{product.brand}</span>
                    <div className="h-4 w-px bg-stone-300"></div>
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < product.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`} />
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-base font-semibold tracking-tight text-black">Mô Tả</h3>
                    <ul className="mt-2.5 list-disc pl-5 text-sm font-light leading-normal tracking-tight text-black">
                        {descriptionLines.map((line, index) => (
                            <li key={index}>{line}</li>
                        ))}
                    </ul>
                </div>

                {/* Thumbnail images are now here */}
                <div className="flex justify-start gap-4">
                    {thumbnails.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveImage(img)}
                            className={`h-16 w-16 rounded-md bg-white p-1 transition-all ${activeImage === img ? 'outline outline-2 outline-red-600' : 'opacity-70 hover:opacity-100'}`}
                        >
                            <img src={img} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-contain" />
                        </button>
                    ))}
                </div>

                <div>
                    <h4 className="text-xs font-semibold tracking-tight text-black">Số Lượng Tồn Kho</h4>
                    <div className="mt-2.5 inline-block rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white">
                        {product.quantity} cái
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ItemDetail;