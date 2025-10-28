import { useState, useEffect } from "react"; 
import { useLoaderData, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Search, Pen, Trash2, Star, Eye } from "lucide-react"; 

export default function StaffComplaintsPage() {
    const { complaints = [], pagination = {} } = useLoaderData() || {};
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams(); 
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [selectedItems, setSelectedItems] = useState([]);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        const newSearchParams = new URLSearchParams(searchParams);
        if (value) {
            newSearchParams.set("search", value);
        } else {
            newSearchParams.delete("search");
        }
        newSearchParams.set("page", "1"); 
        
        setSearchParams(newSearchParams, { replace: true }); 
    };

    const handleSelectAll = (checked) => {
        setSelectedItems(checked ? complaints.map((c) => c._id) : []);
    };

    const handleSelectItem = (complaintId, checked) => {
        setSelectedItems((prev) =>
            checked ? [...prev, complaintId] : prev.filter((id) => id !== complaintId)
        );
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("vi-VN");

    const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price || 0);

    const getStatusBadge = (status) => {
        switch (status) {
            case "resolved":
                return <Badge variant="success">Đã giải quyết</Badge>;
            case "pending":
                return <Badge variant="warning">Chờ xử lý</Badge>;
            case "rejected":
                return <Badge variant="destructive">Đã từ chối</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const renderRating = (rating) => {
        if (!rating || rating < 1) return <span className="text-gray-400">-</span>;
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`} />
                ))}
            </div>
        );
    };


    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Quản lý Khiếu nại</h1>
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Input
                        placeholder="Tìm kiếm..."
                        className="pl-9 h-10 rounded-full text-base placeholder:text-gray-500" 
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)} 
                   
                    />
                </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    aria-label="Select all"
                                    checked={selectedItems.length === complaints.length && complaints.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    className="h-5 w-5 border-gray-400"
                                />
                            </TableHead>
                            <TableHead>Mã Dịch Vụ</TableHead>
                            <TableHead>Tên Khiếu Nại</TableHead>
                            <TableHead>Tên Khách Hàng</TableHead>
                            <TableHead>Số Điện Thoại</TableHead>
                            <TableHead>Ngày Tạo</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Trạng Thái</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {complaints.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    Không có khiếu nại nào khớp với tìm kiếm của bạn.
                                </TableCell>
                            </TableRow>
                        ) : (
                            complaints.map((complaint) => (
                                <TableRow key={complaint._id}>
                                    <TableCell>
                                        <Checkbox
                                            aria-label={`Select complaint ${complaint._id}`}
                                            checked={selectedItems.includes(complaint._id)}
                                            onCheckedChange={(checked) => handleSelectItem(complaint._id, checked)}
                                            className="h-5 w-5 border-gray-400"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">#{complaint.so_id?.toString().slice(-6) || 'N/A'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{complaint.title}</div>
                                        <div className="text-sm text-muted-foreground">#{complaint._id.slice(-6)}</div>
                                    </TableCell>
                                    <TableCell>{complaint.customerName || 'N/A'}</TableCell>
                                    <TableCell>{complaint.customerPhone || 'N/A'}</TableCell>
                                    <TableCell>{formatDate(complaint.createdAt)}</TableCell>
                                    <TableCell>{renderRating(complaint.rating)}</TableCell>
                                    <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Pen className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button asChild className="h-8 rounded-md" variant="destructive">
                                                <Link to={`/staff/complaints/${complaint._id}`}>Xem chi tiết</Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination.totalPages > 1 && <AdminPagination pagination={pagination} />}
        </div>
    );
}