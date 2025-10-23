import { useState } from "react";
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
import { Search, Pen, Trash2 } from "lucide-react";

// --- Mock Data (to be replaced by loader) ---
const mockComplaints = [
    {
        _id: "complaint001",
        so_id: {
            _id: "so001",
            booking_id: {
                clerkId: {
                    name: "Nguyễn Văn A",
                    phone: "0123456789",
                }
            },
        },
        title: "Dịch Vụ",
        createdAt: "2025-10-25T10:00:00.000Z",
        status: "resolved", // pending, resolved, rejected
        totalPrice: 120000, // This would likely be on the service order
    },
    {
        _id: "complaint002",
        so_id: {
            _id: "so002",
            booking_id: {
                clerkId: {
                    name: "Trần Thị B",
                    phone: "0987654321",
                }
            },
        },
        title: "Nhân viên",
        createdAt: "2025-10-25T11:30:00.000Z",
        status: "pending",
        totalPrice: 250000,
    },
    {
        _id: "complaint003",
        so_id: {
            _id: "so003",
            booking_id: {
                clerkId: {
                    name: "Lê Văn C",
                    phone: "0123123123",
                }
            },
        },
        title: "Cửa Hàng",
        createdAt: "2025-10-26T09:00:00.000Z",
        status: "rejected",
        totalPrice: 50000,
    },
];

const mockLoaderData = {
    complaints: mockComplaints,
    pagination: {
        currentPage: 1,
        totalPages: 3,
        totalItems: 21,
        itemsPerPage: 7,
    }
}
// --- End Mock Data ---


export default function StaffComplaintsPage() {
    // const { complaints = [], pagination = {} } = useLoaderData() || {}; // Use this when loader is ready
    const { complaints = [], pagination = {} } = mockLoaderData; // Using mock data for now

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [selectedItems, setSelectedItems] = useState([]);

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


    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Quản lý Khiếu nại</h1>
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm..."
                        className="pl-9 h-10 rounded-md"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                {/* Add filter dropdowns or other actions here if needed */}
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
                            <TableHead>Đơn Khiếu Nại Dịch Vụ</TableHead>
                            <TableHead>Ngày Tạo</TableHead>
                            <TableHead>Tên Khách Hàng</TableHead>
                            <TableHead>Số Điện Thoại</TableHead>
                            <TableHead>Trạng Thái</TableHead>
                            <TableHead>Giá</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {complaints.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Không có khiếu nại nào.
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
                                        <div className="font-medium">{complaint.title}</div>
                                        <div className="text-sm text-muted-foreground">#{complaint._id.slice(-6)}</div>
                                    </TableCell>
                                    <TableCell>{formatDate(complaint.createdAt)}</TableCell>
                                    <TableCell>{complaint.so_id.booking_id.clerkId.name}</TableCell>
                                    <TableCell>{complaint.so_id.booking_id.clerkId.phone}</TableCell>
                                    <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                                    <TableCell>{formatPrice(complaint.totalPrice)} vnđ</TableCell>
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