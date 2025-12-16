import { useState } from "react";
import { useLoaderData, useSearchParams, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Search, Eye } from "lucide-react";
import imgBg from "@/assets/admin/figma_selection/faeefebc0dff5a2e07fafd82684d5fe511a5f7d1.png";

export default function StaffItemsPage() {
    const loaderData = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(
        searchParams.get("search") || ""
    );
    const [statusFilter, setStatusFilter] = useState(
        searchParams.get("statusFilter") || "all"
    );

    const { parts = [], pagination = {} } = loaderData || {};

    // Handle search
    const handleSearch = (value) => {
        setSearchTerm(value);
        const newSearchParams = new URLSearchParams(searchParams);
        if (value) {
            newSearchParams.set("search", value);
        } else {
            newSearchParams.delete("search");
        }
        newSearchParams.delete("page");
        setSearchParams(newSearchParams);
    };

    // Handle status filter
    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        const newSearchParams = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            newSearchParams.set("statusFilter", value);
        } else {
            newSearchParams.delete("statusFilter");
        }
        newSearchParams.delete("page");
        setSearchParams(newSearchParams);
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative w-full max-w-[520px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm..."
                            className="pl-9 h-10 rounded-full text-[16px] placeholder:text-[#656575]"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                        <SelectTrigger className="w-[200px] h-10">
                            <SelectValue placeholder="Lọc theo trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="available">Có sẵn</SelectItem>
                            <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                            <SelectItem value="inactive">Bị vô hiệu hóa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Action buttons are removed for staff view */}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tên sản phẩm/ Mã sản phẩm</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Thương hiệu</TableHead>
                        <TableHead>Số lượng tồn kho</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Giá Bán</TableHead>
                        <TableHead className="text-right">Chi tiết</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {parts.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                Không có sản phẩm nào
                            </TableCell>
                        </TableRow>
                    ) : (
                        parts.map((part) => (
                            <TableRow key={part._id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-9 h-9">
                                            {part.media && part.media.length > 0 ? (
                                                <img
                                                    src={part.media[0].url}
                                                    alt={part.name}
                                                    className="w-8 h-8 rounded object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={imgBg}
                                                    alt="default"
                                                    className="w-8 h-8 rounded object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="leading-4">
                                            <div className="text-[#2e2e3a] text-[14px] font-bold tracking-[-0.126px]">
                                                {part.name}
                                            </div>
                                            <div className="text-[#9a9aaf] text-[12px]">
                                                #{part._id.slice(-6).toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{formatDate(part.createdAt)}</TableCell>
                                <TableCell>{part.brand || "Chưa phân loại"}</TableCell>
                                <TableCell>{part.quantity} cái</TableCell>
                                <TableCell>
                                    {part.status === 'active' ? (
                                        part.quantity > 0 ? (
                                            <Badge variant="secondary"
                                                    className="bg-green-500 text-white dark:bg-blue-600">
                                                Có sẵn
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary"
                                                    className="bg-orange-500 text-white">
                                                Hết hàng
                                            </Badge>
                                        )
                                    ) : (
                                        <Badge variant="destructive">
                                            Không có sẵn (inactive)
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>{formatPrice(part.sellingPrice)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link to={`/staff/items/${part._id}`}>
                                            <Eye className="h-5 w-5 text-gray-500" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {pagination.totalPages > 1 && <AdminPagination pagination={pagination} />}
        </div>
    );
}
