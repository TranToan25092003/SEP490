import React, { useState, useEffect, useMemo } from "react"; // Thêm useEffect và useMemo
import background from "../../assets/cool-motorcycle-indoors.png";
import { useAuth, useUser } from "@clerk/clerk-react";
import avatarImg from "../../assets/avatar.png";
import {
  useNavigate,
  useLoaderData,
  useSearchParams,
  Link,
} from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import VehicleProfile from "./VehicleProfile";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { PopoverContent } from "@radix-ui/react-popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { vehicleSchema } from "@/utils/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Upload,
  Image,
  User,
  Car,
  History,
  Loader2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
} from "lucide-react"; // Thêm Loader2
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
// UserProfile.jsx giờ đã được tích hợp
import { customFetch } from "@/utils/customAxios";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadImage } from "@/utils/uploadCloudinary";
import { toast } from "sonner";
import UserProfile from "./UserProfile";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { getUserBookings } from "@/api/bookings";
import { translateBookingStatus } from "@/utils/enumsTranslator";

export const layoutProfileLoader = async () => {
  try {
    const data = (await customFetch("/profile/models/get")).data;
    console.log(data);
    const { brand } = data.data;

    const res = await customFetch("/profile/vehicles/get");
    const vehicles = res.data.data || [];
    console.log(brand);
    return { brand, vehicles };
  } catch (error) {
    console.log(error);
  }
};

const engineTypes = [
  { value: "gasoline", label: "Động cơ xăng" },
  { value: "diesel", label: "Động cơ diesel" },
  { value: "hybrid", label: "Động cơ hybrid (xăng + điện)" },
  { value: "electric", label: "Động cơ điện" },
];

const LayoutProfile = () => {
  const { user, isLoaded: authLoaded } = useUser();
  const { isSignedIn, isLoaded: userLoaded } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") || "personal"
  );
  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { brand, vehicles } = useLoaderData();

  // State cho logic update profile
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    gender: "",
  });

  // State cho lịch sử sửa xe
  const [bookings, setBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // State cho filter
  const [searchText, setSearchText] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Tối ưu: Sử dụng useMemo để cache kết quả filter và pagination
  const { filteredBookings, currentBookings, totalPages } = useMemo(() => {
    // Áp dụng filter
    let filtered = bookings.filter((booking) => {
      // Filter theo tìm kiếm
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          booking.id?.toLowerCase().includes(searchLower) ||
          booking.vehicle?.licensePlate?.toLowerCase().includes(searchLower) ||
          booking.vehicle?.brand?.toLowerCase().includes(searchLower) ||
          booking.vehicle?.model?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filter theo xe
      if (selectedVehicleId !== "all") {
        const vehicleId = booking.vehicle?.id || booking.vehicle?._id;
        if (vehicleId !== selectedVehicleId) {
          return false;
        }
      }

      // Filter theo trạng thái
      if (selectedStatus !== "all") {
        if (booking.status !== selectedStatus) return false;
      }

      return true;
    });

    // Tính toán pagination
    const total = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const current = filtered.slice(startIndex, endIndex);

    return {
      filteredBookings: filtered,
      currentBookings: current,
      totalPages: total,
    };
  }, [
    bookings,
    searchText,
    selectedVehicleId,
    selectedStatus,
    currentPage,
    itemsPerPage,
  ]);

  // Tải dữ liệu người dùng vào state của form
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.publicMetadata?.fullName || user.fullName || "",
        phone:
          user.publicMetadata?.phone ||
          user.primaryPhoneNumber?.phoneNumber ||
          "",
        email: user.emailAddresses?.[0]?.emailAddress || "",
        address: user.publicMetadata?.address || "",
        gender: user.publicMetadata?.gender || "",
      });
    }
  }, [user]);

  // Tải lịch sử sửa xe khi tab history được mở
  useEffect(() => {
    if (activeTab === "history" && isSignedIn) {
      const fetchBookings = async () => {
        setIsLoadingBookings(true);
        try {
          const data = await getUserBookings();
          setBookings(data || []);
          setCurrentPage(1); // Reset về trang 1 khi tải lại dữ liệu
        } catch (error) {
          console.error("Failed to fetch bookings:", error);
          toast.error("Không thể tải lịch sử sửa xe");
        } finally {
          setIsLoadingBookings(false);
        }
      };
      fetchBookings();
    }
  }, [activeTab, isSignedIn]);

  // Logic cho Popover (Thêm xe)
  const vehicleForm = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      brand: "",
      year: 2024,
      engine_type: "gasoline",
      description: "",
      license_plate: "",
      odo_reading: "",
    },
  });

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    control,
  } = vehicleForm;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsUploading(true);
      try {
        const uploadedUrl = await uploadImage(file);
        setImagePreview(uploadedUrl);
        console.log("✅ Uploaded to Cloudinary:", uploadedUrl);
      } catch (error) {
        console.error("❌ Upload failed:", error);
        alert("Upload ảnh thất bại! Sẽ dùng ảnh mặc định.");
        setImagePreview(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const onSubmitVehicle = async (data) => {
    // ... (logic onSubmit của vehicle giữ nguyên, đổi tên)
    try {
      const res = await customFetch.post("/profile/models/create", {
        ...data,
        image: imagePreview,
      });
      toast.success("Thành công");
      reset();
      setImagePreview(null);
      setImageFile(null);
      setOpen(false);
      navigate("/profile");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  // Logic cho Form (Thông tin cá nhân)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const tab = searchParams.get("tab") || "personal";
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (value === "personal") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      return params;
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (!user) return;

      const publicMetadataPayload = {
        fullName: form.fullName || undefined,
        address: form.address || undefined,
        gender: form.gender || undefined,
        phone: form.phone || undefined,
      };

      await customFetch.patch("/profile/public-metadata", {
        publicMetadata: publicMetadataPayload,
      });

      // Cập nhật lại user của Clerk sau khi update
      await user.reload();

      toast.success("Cập nhật thông tin thành công");
      setIsEditing(false); // Tắt chế độ chỉnh sửa
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      toast.error("❌ Cập nhật thất bại, vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  if (!authLoaded || !userLoaded) {
    return <div className="text-center p-8">⏳ Đang tải...</div>;
  }

  if (!isSignedIn) {
    navigate("/");
    return;
  }

  const profileImage = user?.imageUrl || avatarImg;
  const fullName = user?.fullName || "Not available";
  const email = user?.emailAddresses?.[0]?.emailAddress;

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "65% 35%",
      }}
    >
      <Card className="w-full max-w-6xl shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={profileImage}
                alt={fullName}
                className="h-16 w-16 rounded-full border-2 border-gray-200"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                <p className="text-sm text-gray-500">{email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {activeTab === "personal" && isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Hủy
                </Button>
              )}

              {activeTab === "personal" && (
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={
                    isEditing ? handleSaveProfile : () => setIsEditing(true)
                  }
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isEditing ? "Lưu thay đổi" : "Chỉnh sửa"}
                </Button>
              )}

              {activeTab === "vehicle" && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#DF1D01] hover:bg-red-800">
                      Thêm xe
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle className={"text-center text-2xl"}>
                        Thêm xe mới
                      </DialogTitle>
                    </DialogHeader>
                    {/* Form thêm xe (logic giữ nguyên) */}
                    <form
                      className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
                      onSubmit={handleSubmit(onSubmitVehicle)}
                    >
                      {/* name */}
                      <div>
                        <Label htmlFor="name">Tên xe *</Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="Ví dụ: Air Blade"
                          className="mt-1"
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      {/* brand */}
                      <div>
                        <Label htmlFor="brand">Hãng xe *</Label>
                        <select
                          id="brand"
                          {...register("brand")}
                          defaultValue=""
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled>
                            -- Chọn brand --
                          </option>
                          {brand.map((brandName) => (
                            <option key={brandName} value={brandName}>
                              {brandName}
                            </option>
                          ))}
                        </select>
                        {errors.brand && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.brand.message}
                          </p>
                        )}
                      </div>
                      {/* license plate */}
                      <div>
                        <Label htmlFor="license_plate">Biển số xe *</Label>
                        <Input
                          id="license_plate"
                          {...register("license_plate")}
                          placeholder="29-G1-12345"
                          className="mt-1"
                        />
                        {errors.license_plate && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.license_plate.message}
                          </p>
                        )}
                      </div>
                      {/* odo reading */}
                      <div>
                        <Label htmlFor="odo_reading">Số km</Label>
                        <Input
                          id="odo_reading"
                          {...register("odo_reading", { valueAsNumber: true })}
                          type={"number"}
                          placeholder="2000"
                          className="mt-1"
                        />
                        {errors.odo_reading && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.odo_reading.message}
                          </p>
                        )}
                      </div>
                      {/* year */}
                      <div>
                        <Label htmlFor="year">Năm sản xuất</Label>
                        <Input
                          id="year"
                          type="number"
                          {...register("year", { valueAsNumber: true })}
                          placeholder="2024"
                          className="mt-1"
                        />
                        {errors.year && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.year.message}
                          </p>
                        )}
                      </div>
                      {/* Engine Type */}
                      <div>
                        <Label htmlFor="engine_type">Loại động cơ</Label>
                        <Controller
                          name="engine_type"
                          control={control}
                          defaultValue="gasoline"
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Chọn loại động cơ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {engineTypes.map(({ label, value }) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.engine_type && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.engine_type.message}
                          </p>
                        )}
                      </div>
                      {/* Description */}
                      <div className="md:col-span-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                          id="description"
                          {...register("description")}
                          placeholder="Thông tin bổ sung về xe..."
                          rows={3}
                          className="mt-1"
                        />
                        {errors.description && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.description.message}
                          </p>
                        )}
                      </div>
                      {/* IMAGE UPLOAD */}
                      <div className="md:col-span-2">
                        <Label>Ảnh xe</Label>
                        <Input
                          id="image-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="mt-1"
                        />
                        {isUploading && (
                          <p className="text-sm text-blue-600 mt-2">
                            Đang tải ảnh lên...
                          </p>
                        )}
                        {imagePreview && (
                          <div className="mt-2">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-24 object-cover rounded-md border"
                            />
                          </div>
                        )}
                      </div>
                      {/* Buttons */}
                      <DialogFooter className="md:col-span-2 flex justify-start items-center gap-2 pt-2">
                        <DialogClose asChild>
                          <Button type="button" variant="outline" size="sm">
                            Hủy
                          </Button>
                        </DialogClose>
                        <Button
                          type="submit"
                          size="sm"
                          className="bg-[#DF1D01] hover:bg-red-800"
                          disabled={
                            vehicleForm.formState.isSubmitting || isUploading
                          }
                        >
                          {vehicleForm.formState.isSubmitting
                            ? "Đang thêm..."
                            : "Thêm xe"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 max-w-lg bg-gray-100 rounded-lg">
              <TabsTrigger
                value="personal"
                className="gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md"
              >
                <User className="h-4 w-4" /> Thông tin cá nhân
              </TabsTrigger>
              <TabsTrigger
                value="vehicle"
                className="gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md"
              >
                <Car className="h-4 w-4" /> Thông Tin Xe
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md"
              >
                <History className="h-4 w-4" /> Lịch sử sửa xe
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 min-h-[450px]">
              {/* Tab 1: Thông tin cá nhân  */}
              <TabsContent value="personal">
                <UserProfile
                  isEditing={isEditing}
                  form={form}
                  handleChange={handleChange}
                  handleSelectChange={handleSelectChange}
                />
              </TabsContent>

              <TabsContent value="vehicle">
                <VehicleProfile vehicles={vehicles} />
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-4">
                  {isLoadingBookings ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner className="h-8 w-8" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-muted-foreground mb-2">
                          Chưa có lịch sử sửa xe
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Bạn chưa có đơn đặt lịch nào. Hãy tạo đặt lịch mới!
                        </p>
                        <Button asChild>
                          <Link to="/booking">Đặt lịch mới</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Thanh filter */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Filter className="size-5" />
                            Bộ Lọc
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Tìm kiếm */}
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Tìm kiếm theo mã đơn, biển số..."
                                value={searchText}
                                onChange={(e) => {
                                  setSearchText(e.target.value);
                                  setCurrentPage(1);
                                }}
                                className="pl-9"
                              />
                            </div>

                            {/* Lọc theo xe */}
                            <Select
                              value={selectedVehicleId}
                              onValueChange={(value) => {
                                setSelectedVehicleId(value);
                                setCurrentPage(1);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tất cả xe" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Tất cả xe</SelectItem>
                                {vehicles.map((vehicle) => (
                                  <SelectItem
                                    key={vehicle._id}
                                    value={vehicle._id}
                                  >
                                    {vehicle.license_plate} - {vehicle.brand}{" "}
                                    {vehicle.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Lọc theo trạng thái */}
                            <Select
                              value={selectedStatus}
                              onValueChange={(value) => {
                                setSelectedStatus(value);
                                setCurrentPage(1);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tất cả trạng thái" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  Tất cả trạng thái
                                </SelectItem>
                                <SelectItem value="booked">Đã đặt</SelectItem>
                                <SelectItem value="checked_in">
                                  Đã tiếp nhận
                                </SelectItem>
                                <SelectItem value="in_progress">
                                  Đang thực hiện
                                </SelectItem>
                                <SelectItem value="completed">
                                  Hoàn thành
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Đã hủy
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Nút xóa filter */}
                          {(searchText ||
                            selectedVehicleId !== "all" ||
                            selectedStatus !== "all") && (
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSearchText("");
                                  setSelectedVehicleId("all");
                                  setSelectedStatus("all");
                                  setCurrentPage(1);
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Xóa bộ lọc
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Hiển thị kết quả đã được tối ưu */}
                      {filteredBookings.length === 0 ? (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium text-muted-foreground mb-2">
                              Không tìm thấy kết quả
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              Không có đơn đặt lịch nào phù hợp với bộ lọc của
                              bạn.
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSearchText("");
                                setSelectedVehicleId("all");
                                setSelectedStatus("all");
                                setCurrentPage(1);
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Xóa bộ lọc
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="space-y-4">
                            {currentBookings.map((booking) => (
                              <Link
                                to={`/booking/${booking.id}/history`}
                                key={booking.id}
                                className="block group"
                              >
                                <Card className="transition-all group-hover:border-primary group-hover:shadow-lg">
                                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <div>
                                      <CardTitle className="text-lg">
                                        Mã đơn: {booking.id?.slice(-8) || "N/A"}
                                      </CardTitle>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Biển số:{" "}
                                        {booking.vehicle?.licensePlate || "N/A"}
                                      </p>
                                    </div>
                                    <Badge variant="outline">
                                      {translateBookingStatus(booking.status)}
                                    </Badge>
                                  </CardHeader>
                                  <CardContent className="grid gap-4 md:grid-cols-3 pt-0">
                                    <div className="flex items-start gap-3">
                                      <Car className="size-5 text-primary flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          Phương tiện
                                        </p>
                                        <p className="font-semibold">
                                          {booking.vehicle?.brand || "N/A"}{" "}
                                          {booking.vehicle?.model || ""}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Năm {booking.vehicle?.year || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <Calendar className="size-5 text-primary flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          Ngày hẹn
                                        </p>
                                        <p className="font-semibold">
                                          {booking.slotStartTime
                                            ? new Date(
                                                booking.slotStartTime
                                              ).toLocaleDateString("vi-VN", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                              })
                                            : "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <Clock className="size-5 text-primary flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          Khung giờ
                                        </p>
                                        <p className="font-semibold">
                                          {booking.slotStartTime &&
                                          booking.slotEndTime
                                            ? (() => {
                                                const s = new Date(
                                                  booking.slotStartTime
                                                );
                                                const e = new Date(
                                                  booking.slotEndTime
                                                );
                                                return `${s
                                                  .getHours()
                                                  .toString()
                                                  .padStart(2, "0")}:${s
                                                  .getMinutes()
                                                  .toString()
                                                  .padStart(2, "0")} - ${e
                                                  .getHours()
                                                  .toString()
                                                  .padStart(2, "0")}:${e
                                                  .getMinutes()
                                                  .toString()
                                                  .padStart(2, "0")}`;
                                              })()
                                            : "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>

                          {/* Phân trang */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="text-sm text-muted-foreground">
                                Hiển thị {(currentPage - 1) * itemsPerPage + 1}{" "}
                                -{" "}
                                {Math.min(
                                  currentPage * itemsPerPage,
                                  filteredBookings.length
                                )}{" "}
                                trong tổng số {filteredBookings.length} đơn
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.max(1, prev - 1)
                                    )
                                  }
                                  disabled={currentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Trước
                                </Button>
                                <div className="flex items-center gap-1">
                                  {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                  ).map((page) => (
                                    <Button
                                      key={page}
                                      variant={
                                        currentPage === page
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() => setCurrentPage(page)}
                                      className="min-w-[2.5rem]"
                                    >
                                      {page}
                                    </Button>
                                  ))}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.min(totalPages, prev + 1)
                                    )
                                  }
                                  disabled={currentPage === totalPages}
                                >
                                  Sau
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LayoutProfile;
