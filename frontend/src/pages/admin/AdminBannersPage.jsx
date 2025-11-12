import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Các tùy chọn sắp xếp cho Banner
const sortOptions = [
    { value: "display_order,asc", label: "Thứ tự (Tăng)" },
    { value: "display_order,desc", label: "Thứ tự (Giảm)" },
    { value: "createdAt,desc", label: "Mới nhất" },
    { value: "createdAt,asc", label: "Cũ nhất" },
    { value: "title,asc", label: "Tên (A-Z)" },
];

// Dữ liệu rỗng cho việc tạo banner
const defaultBannerState = {
    title: "",
    image_url: "",
    link_url: "",
    is_active: true,
    display_order: 0,
};

export default function AdminBannersPage() {
    const { banners = [], pagination = {} } = useLoaderData();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [selectedSort, setSelectedSort] = useState(
        `${searchParams.get("sortBy") || "display_order"},${searchParams.get("sortOrder") || "asc"}`
    );

    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);

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

    const handleOpenAddModal = () => {
        setSelectedBanner(defaultBannerState);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (banner) => {
        setSelectedBanner(banner);
        setIsModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setSelectedBanner((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleActiveStatusChange = (value) => {
        setSelectedBanner((prev) => ({
            ...prev,
            is_active: value === "true",
        }));
    };

    const handleFormSubmit = async () => {
        if (!selectedBanner) return;

        // Validation
        const { title, image_url, display_order } = selectedBanner;
        if (!title || title.trim() === "") {
            toast.error("Lỗi Validation", { description: "Tiêu đề không được để trống." });
            return;
        }
        if (!image_url || image_url.trim() === "") {
            toast.error("Lỗi Validation", { description: "URL Hình ảnh không được để trống." });
            return;
        }
        if (display_order === null || display_order === undefined || isNaN(Number(display_order))) {
            toast.error("Lỗi Validation", { description: "Thứ tự hiển thị phải là một con số." });
            return;
        }

        const isEditMode = !!selectedBanner._id;
        const url = isEditMode
            ? `/admin/banners/${selectedBanner._id}`
            : "/admin/banners";
        const method = isEditMode ? "PATCH" : "POST";

        setIsSubmitting(true);
        try {
            const response = await customFetch(url, {
                method: method,
                data: selectedBanner,
            });

            if (response.data.success) {
                toast.success(
                    isEditMode
                        ? "Cập nhật banner thành công."
                        : "Tạo banner mới thành công."
                );
                setIsModalOpen(false);
                setSelectedBanner(null);
                navigate(0);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error(isEditMode ? "Lỗi khi cập nhật" : "Lỗi khi tạo mới", {
                description: error.message || `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} banner.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBanner = async (bannerId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa banner này?")) return;
        setIsDeleting(true);
        try {
            const response = await customFetch.delete(`/admin/banners/${bannerId}`);
            if (response.data.success) {
                toast.success("Banner đã được xóa thành công.");
                navigate(0);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error("Lỗi khi xóa banner", {
                description: error.message || "Không thể xóa banner.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full max-w-[520px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm theo tiêu đề banner..."
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

                <Button onClick={handleOpenAddModal}>
                    + Thêm banner
                </Button>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hình ảnh</TableHead>
                            <TableHead>Tiêu đề</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead>Thứ tự</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {banners.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Không có banner nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            banners.map((banner) => (
                                <TableRow key={banner._id}>
                                    <TableCell>
                                        <img
                                            src={banner.image_url}
                                            alt={banner.title}
                                            className="w-24 h-12 object-cover rounded-md bg-gray-100"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-[#2e2e3a]">{banner.title}</div>
                                        <div className="text-sm text-[#9a9aaf]">#{banner._id.slice(-6).toUpperCase()}</div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {banner.link_url || "N/A"}
                                        </a>
                                    </TableCell>
                                    <TableCell>{banner.display_order}</TableCell>
                                    <TableCell>
                                        {banner.is_active ? (
                                            <Badge variant="success">Hoạt động</Badge>
                                        ) : (
                                            <Badge variant="destructive">Không hoạt động</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenEditModal(banner)}
                                            >
                                                <Pen className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteBanner(banner._id)}
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

            {/* Modal cho Thêm/Sửa Banner */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedBanner?._id ? "Chỉnh sửa Banner" : "Tạo Banner Mới"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedBanner?._id
                                ? "Cập nhật thông tin chi tiết cho banner."
                                : "Điền thông tin chi tiết cho banner mới."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Tiêu đề <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                name="title"
                                value={selectedBanner?.title || ''}
                                onChange={handleFormChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image_url" className="text-right">URL Hình ảnh <span className="text-red-500">*</span></Label>
                            <Input
                                id="image_url"
                                name="image_url"
                                value={selectedBanner?.image_url || ''}
                                onChange={handleFormChange}
                                className="col-span-3"
                                required
                                placeholder="https://example.com/image.png"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="link_url" className="text-right">URL Liên kết</Label>
                            <Input
                                id="link_url"
                                name="link_url"
                                value={selectedBanner?.link_url || ''}
                                onChange={handleFormChange}
                                className="col-span-3"
                                placeholder="/items/some-product-id"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="display_order" className="text-right">Thứ tự <span className="text-red-500">*</span></Label>
                            <Input
                                id="display_order"
                                name="display_order"
                                type="number"
                                value={selectedBanner?.display_order || 0}
                                onChange={handleFormChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="is_active" className="text-right">Hoạt động</Label>
                            <Select
                                name="is_active"
                                value={String(selectedBanner?.is_active ?? true)}
                                onValueChange={handleActiveStatusChange}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Hoạt động</SelectItem>
                                    <SelectItem value="false">Không hoạt động</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={() => setSelectedBanner(null)}>Hủy</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {selectedBanner?._id ? "Lưu thay đổi" : "Tạo mới"}
                            </Button>
                        </DialogFooter>
                    </form>

                </DialogContent>
            </Dialog>

        </div>
    );
}