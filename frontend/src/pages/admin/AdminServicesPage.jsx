import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Search, Pen, Trash2, Loader2 } from "lucide-react";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";

const sortOptions = [
    { value: "createdAt,desc", label: "Mới nhất" },
    { value: "createdAt,asc", label: "Cũ nhất" },
    { value: "base_price,asc", label: "Giá tăng dần" },
    { value: "base_price,desc", label: "Giá giảm dần" },
    { value: "name,asc", label: "Tên (A-Z)" },
    { value: "name,desc", label: "Tên (Z-A)" },
];

// (MỚI) Dữ liệu rỗng cho việc tạo service
const defaultServiceState = {
    name: "",
    base_price: "",
    description: "",
    estimated_time: "",
};

export default function AdminServicesPage() {
    const { services = [], pagination = {} } = useLoaderData();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [selectedSort, setSelectedSort] = useState(
        `${searchParams.get("sortBy") || "createdAt"},${searchParams.get("sortOrder") || "desc"}`
    );

    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Đổi tên từ isEditing
    const [isModalOpen, setIsModalOpen] = useState(false);

    // (THAY ĐỔI) Dùng state này để giữ dữ liệu cho cả việc Thêm và Sửa
    // Nếu là null -> không có gì. 
    // Nếu là object rỗng -> chế độ Thêm. 
    // Nếu là object có data -> chế độ Sửa.
    const [selectedService, setSelectedService] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (searchParams.get("search") || "")) {
                const newSearchParams = new URLSearchParams(searchParams);
                if (searchTerm) {
                    newSearchParams.set("search", searchTerm);
                } else {
                    newSearchParams.delete("search");
                }
                newSearchParams.set("page", "1");
                setSearchParams(newSearchParams, { replace: true });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, searchParams, setSearchParams]);

    const handleSortChange = (value) => {
        setSelectedSort(value);
        const [sortBy, sortOrder] = value.split(',');
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("sortBy", sortBy);
        newSearchParams.set("sortOrder", sortOrder);
        newSearchParams.set("page", "1");
        setSearchParams(newSearchParams, { replace: true });
    };

    // --- (MỚI) Logic Modal ---
    const handleOpenAddModal = () => {
        setSelectedService(defaultServiceState); // Set data rỗng
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (service) => {
        setSelectedService(service); // Set data của service được chọn
        setIsModalOpen(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setSelectedService((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFormSubmit = async () => {
        if (!selectedService) return;

        const { name, base_price, estimated_time } = selectedService;

        if (!name || name.trim() === "") {
            toast.error("Lỗi Validation", { description: "Tên dịch vụ không được để trống." });
            return;
        }
        if (!base_price || parseFloat(base_price) <= 0) {
            toast.error("Lỗi Validation", { description: "Giá cơ bản phải là một số lớn hơn 0." });
            return;
        }
        if (!estimated_time || parseInt(estimated_time, 10) <= 0) {
            toast.error("Lỗi Validation", { description: "Thời gian (phút) phải là một số lớn hơn 0." });
            return;
        }

        const isEditMode = !!selectedService._id;
        const url = isEditMode
            ? `/admin/services/${selectedService._id}`
            : "/admin/services";
        const method = isEditMode ? "PATCH" : "POST";

        setIsSubmitting(true);
        try {
            const response = await customFetch(url, {
                method: method,
                data: selectedService, 
            });

            if (response.data.success) {
                toast.success(
                    isEditMode
                        ? "Cập nhật dịch vụ thành công."
                        : "Tạo dịch vụ mới thành công."
                );
                setIsModalOpen(false); 
                setSelectedService(null); 
                navigate(0);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error(isEditMode ? "Lỗi khi cập nhật" : "Lỗi khi tạo mới", {
                description: error.message || `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} dịch vụ.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) return;
        setIsDeleting(true);
        try {
            const response = await customFetch.delete(`/admin/services/${serviceId}`);
            if (response.data.success) {
                toast.success("Dịch vụ đã được xóa thành công.");
                navigate(0);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error("Lỗi khi xóa dịch vụ", {
                description: error.message || "Không thể xóa dịch vụ.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full max-w-[520px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm theo tên hoặc mô tả dịch vụ..."
                        className="pl-9 h-10 rounded-full text-[16px] placeholder:text-[#656575]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-full sm:w-auto">
                    <Select value={selectedSort} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-full">
                            <SelectValue placeholder="Sắp xếp theo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {sortOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* --- (THAY ĐỔI) Nút Thêm Dịch Vụ --- */}
                <Button onClick={handleOpenAddModal}>
                    + Thêm dịch vụ
                </Button>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên dịch vụ</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead>Giá cơ bản</TableHead>
                            <TableHead>Thời gian (phút)</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Không có dịch vụ nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            services.map((service) => (
                                <TableRow key={service._id}>
                                    <TableCell>
                                        <div className="font-medium text-[#2e2e3a]">{service.name}</div>
                                        <div className="text-sm text-[#9a9aaf]">#{service._id}</div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{service.description || "N/A"}</TableCell>
                                    <TableCell>{formatPrice(service.base_price)}</TableCell>
                                    <TableCell>{service.estimated_time} phút</TableCell>
                                    <TableCell>{formatDate(service.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenEditModal(service)}
                                            >
                                                <Pen className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteService(service._id)}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                )}
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

            {/* --- (CẬP NHẬT) MODAL DÙNG CHUNG --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        {/* Tiêu đề động */}
                        <DialogTitle>
                            {selectedService?._id ? "Chỉnh sửa Dịch vụ" : "Tạo Dịch vụ Mới"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedService?._id
                                ? "Cập nhật thông tin chi tiết cho dịch vụ."
                                : "Điền thông tin chi tiết cho dịch vụ mới."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    {/* Form dùng chung */}
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Tên dịch vụ</Label>
                            <Input
                                id="name"
                                name="name"
                                value={selectedService?.name || ''}
                                onChange={handleEditFormChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="base_price" className="text-right">Giá cơ bản</Label>
                            <Input
                                id="base_price"
                                name="base_price"
                                type="number"
                                value={selectedService?.base_price || ''}
                                onChange={handleEditFormChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="estimated_time" className="text-right">Thời gian (phút)</Label>
                            <Input
                                id="estimated_time"
                                name="estimated_time"
                                type="number"
                                value={selectedService?.estimated_time || ''}
                                onChange={handleEditFormChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right mt-2">Mô tả</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Mô tả chi tiết dịch vụ..."
                                value={selectedService?.description || ''}
                                onChange={handleEditFormChange}
                                className="col-span-3 min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" onClick={() => setSelectedService(null)}>Hủy</Button>
                        </DialogClose>
                        {/* Nút bấm động */}
                        <Button onClick={handleFormSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {selectedService?._id ? "Lưu thay đổi" : "Tạo mới"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}