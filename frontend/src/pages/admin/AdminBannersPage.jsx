import { useState, useEffect, useRef, useCallback } from "react"; // Thêm
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
import { Search, Pen, Trash2, Loader2, UploadCloud, X } from "lucide-react"; // Thêm
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";
import { uploadImageToFolder, validateFile } from "@/utils/uploadCloudinary"; // Thêm

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
        `${searchParams.get("sortBy") || "display_order"},${searchParams.get("sortOrder") || "asc"
        }`
    );

    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);

    // --- (MỚI) State và Ref cho logic tải ảnh ---
    const [preview, setPreview] = useState(null); // Chỉ 1 ảnh
    const fileInputRef = useRef(null);
    // ---

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
        const [sortBy, sortOrder] = value.split(",");
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("sortBy", sortBy);
        newSearchParams.set("sortOrder", sortOrder);
        newSearchParams.set("page", "1");
        setSearchParams(newSearchParams, { replace: true });
    };

    const handleOpenAddModal = () => {
        setSelectedBanner(defaultBannerState);
        setPreview(null); // Reset ảnh xem trước
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (banner) => {
        setSelectedBanner(banner);
        // Hiển thị ảnh hiện tại
        setPreview(banner.image_url ? { url: banner.image_url, file: null } : null);
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

    // --- (MỚI) Logic xử lý tải ảnh ---
    const onFiles = useCallback((files) => {
        const file = files[0]; // Chỉ lấy file đầu tiên
        if (!file) return;

        const validation = validateFile(file, {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
            allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
        });

        if (!validation.isValid) {
            toast.error("Lỗi file", {
                description: validation.errors.join(", "),
            });
            return;
        }

        // Set file mới để chuẩn bị upload
        setPreview({
            file: file,
            url: URL.createObjectURL(file), // Tạo URL xem trước
        });
    }, []);

    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
        },
        [onFiles]
    );

    const onPick = useCallback(
        (e) => {
            if (e.target?.files?.length) onFiles(e.target.files);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        [onFiles]
    );

    const removePreview = useCallback(() => {
        setPreview((prev) => {
            if (prev?.url && prev.file) { // Chỉ revoke nếu là file mới (có file object)
                try {
                    URL.revokeObjectURL(prev.url);
                } catch (error) {
                    console.warn("Failed to revoke object URL:", error);
                }
            }
            return null;
        });
        // Xóa luôn ảnh khỏi selectedBanner nếu đang sửa
        setSelectedBanner(prev => ({ ...prev, image_url: "" }));
    }, []);
    // --- Kết thúc logic tải ảnh ---


    // --- (CẬP NHẬT) Logic Submit Form ---
    const handleFormSubmit = async () => {
        if (!selectedBanner) return;

        const { title, display_order } = selectedBanner;
        let finalImageUrl = selectedBanner.image_url; // Lấy URL ảnh hiện có

        // Validation
        if (!title || title.trim() === "") {
            toast.error("Lỗi Validation", { description: "Tiêu đề không được để trống." });
            return;
        }
        if (display_order === null || display_order === undefined || isNaN(Number(display_order))) {
            toast.error("Lỗi Validation", { description: "Thứ tự hiển thị phải là một con số." });
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Kiểm tra xem có file mới được chọn để upload không
            if (preview && preview.file) {
                toast.info("Đang tải ảnh lên...");
                const uploadResult = await uploadImageToFolder(preview.file); // Dùng hàm upload
                finalImageUrl = uploadResult.url; // Lấy URL mới
                toast.success("Tải ảnh lên thành công!");
            }

            // 2. Kiểm tra lại xem có URL ảnh không (mới hoặc cũ)
            if (!finalImageUrl) {
                toast.error("Lỗi Validation", { description: "Hình ảnh banner là bắt buộc." });
                setIsSubmitting(false);
                return;
            }

            const isEditMode = !!selectedBanner._id;
            const url = isEditMode
                ? `/admin/banners/${selectedBanner._id}`
                : "/admin/banners";
            const method = isEditMode ? "PATCH" : "POST";

            // 3. Chuẩn bị data gửi đi
            const submitData = {
                ...selectedBanner,
                image_url: finalImageUrl, // Gửi URL cuối cùng
            };

            const response = await customFetch(url, {
                method: method,
                data: submitData,
            });

            if (response.data.success) {
                toast.success(isEditMode ? "Cập nhật banner thành công." : "Tạo banner mới thành công.");
                setIsModalOpen(false);
                setSelectedBanner(null);
                setPreview(null); // Reset preview
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
        // ... (Giữ nguyên logic)
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* ... (Phần Search và Sort giữ nguyên) ... */}
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
                    {/* ... (Phần Table Header và Table Body giữ nguyên) ... */}
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

            {/* --- (CẬP NHẬT) Modal cho Thêm/Sửa Banner --- */}
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

                        {/* --- (THAY THẾ) Vùng tải ảnh mới --- */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="image_url" className="text-right pt-2">Hình ảnh <span className="text-red-500">*</span></Label>
                            <div className="col-span-3">
                                <div
                                    className="flex-grow flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-100 transition-colors p-4 min-h-[150px]"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={onDrop}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        className="hidden"
                                        onChange={onPick}
                                    />
                                    {preview ? (
                                        <div className="w-full h-full relative">
                                            <img src={preview.url} alt="Banner preview" className="w-full h-32 object-contain rounded-md" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removePreview(); }}
                                                className="absolute -top-2 -right-2 transition rounded-full bg-red-600 text-white w-6 h-6 grid place-items-center shadow leading-none"
                                                aria-label="Remove image"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                            <UploadCloud className="mx-auto h-12 w-12 text-stone-700/25" />
                                            <p className="mt-2 text-xs capitalize text-stone-700/75">Kéo thả hoặc <span className="underline">chọn file</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* --- Kết thúc thay thế --- */}

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
                                value={selectedBanner?.display_order ?? 0}
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
                                <Button type="button" variant="outline" onClick={() => { setSelectedBanner(null); setPreview(null); }}>Hủy</Button>
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