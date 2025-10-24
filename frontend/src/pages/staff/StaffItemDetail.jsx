import React from 'react';
import { useLoaderData, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from 'lucide-react';
import productImagePlaceholder from '@/assets/part-lopsau.png';

// Component con để hiển thị một trường thông tin chi tiết
const DetailField = ({ label, children }) => (
    <div>
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        <div className="mt-1 text-base text-gray-900">{children}</div>
    </div>
);

function StaffItemDetail() {
    // Lấy dữ liệu sản phẩm từ loader
    const product = useLoaderData();

    // Xử lý trường hợp loader trả về null (có lỗi xảy ra)
    if (!product) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 p-6">
                <p className="text-xl">Không thể tải thông tin sản phẩm.</p>
                <Link to="/staff/items">
                    <Button>Quay lại danh sách</Button>
                </Link>
            </div>
        );
    }

    // Hàm định dạng giá tiền
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price || 0);
    };

    // Hàm định dạng ngày tháng
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("vi-VN", {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const mainImage = product.media && product.media.length > 0 ? product.media[0].url : productImagePlaceholder;

    return (
        <main className="p-6 space-y-6">
            {/* Header với nút quay lại */}
            <div>
                <Link to="/staff/items">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại danh sách
                    </Button>
                </Link>
            </div>

            {/* Thẻ thông tin chi tiết sản phẩm */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Cột hình ảnh */}
                    <div className="md:col-span-1">
                        <div className="aspect-square w-full rounded-lg p-4">
                            <img src={mainImage} alt={product.name} className="h-full w-full object-contain" />
                        </div>
                        {product.media && product.media.length > 1 && (
                            <div className="mt-4 grid grid-cols-4 gap-2">
                                {product.media.map((img, index) => (
                                    <div key={index} className="aspect-square rounded-md bg-gray-100 p-1">
                                        <img src={img.url} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-contain" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cột thông tin chi tiết */}
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold">{product.name}</h1>
                            <p className="text-sm text-gray-500 mt-1">Mã sản phẩm: {product.code || 'N/A'}</p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            <DetailField label="Trạng thái">
                                {product.status === 'active' ? (
                                    <Badge variant="success">Hoạt động</Badge>
                                ) : (
                                    <Badge variant="destructive">Không hoạt động</Badge>
                                )}
                            </DetailField>
                            <DetailField label="Thương hiệu">{product.brand || 'Chưa có'}</DetailField>
                            <DetailField label="Số lượng tồn kho">{product.quantity} cái</DetailField>
                            <DetailField label="Giá bán">{formatPrice(product.sellingPrice)}</DetailField>
                            <DetailField label="Giá nhập">{formatPrice(product.costPrice)}</DetailField>
                            <DetailField label="Tồn kho tối thiểu">{product.minStock || 0} cái</DetailField>
                            <DetailField label="Ngày tạo">{formatDate(product.createdAt)}</DetailField>
                            <DetailField label="Cập nhật lần cuối">{formatDate(product.updatedAt)}</DetailField>
                        </div>

                        <div className="pt-4 border-t">
                            <DetailField label="Mô tả">
                                <p className="whitespace-pre-wrap text-sm">{product.description || 'Không có mô tả.'}</p>
                            </DetailField>
                        </div>

                        {product.compatible_model_ids && product.compatible_model_ids.length > 0 && (
                            <div className="pt-4 border-t">
                                <DetailField label="Dòng xe tương thích">
                                    <div className="flex flex-wrap gap-2">
                                        {product.compatible_model_ids.map(model => (
                                            <Badge key={model._id} variant="outline">{model.name}</Badge>
                                        ))}
                                    </div>
                                </DetailField>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default StaffItemDetail;