import React, { useState, useEffect } from "react"; // Thêm useEffect
import background from "../../assets/cool-motorcycle-indoors.png";
import { useAuth, useUser } from "@clerk/clerk-react";
import avatarImg from "../../assets/avatar.png";
import { useNavigate, useLoaderData } from "react-router-dom";
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
import { AlertCircle, Upload, Image, User, Car, History, Loader2 } from "lucide-react"; // Thêm Loader2
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
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const [activeTab, setActiveTab] = useState("personal");
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

  // Tải dữ liệu người dùng vào state của form
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.publicMetadata?.fullName || user.fullName || "",
        phone: user.publicMetadata?.phone || user.primaryPhoneNumber?.phoneNumber || "",
        email: user.emailAddresses?.[0]?.emailAddress || "",
        address: user.publicMetadata?.address || "",
        gender: user.publicMetadata?.gender || "",
      });
    }
  }, [user]);

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
  }

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
              {activeTab === 'personal' && isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Hủy</Button>
              )}

              {activeTab === 'personal' && (
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
                </Button>
              )}

              {activeTab === 'vehicle' && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#DF1D01] hover:bg-red-800">Thêm xe</Button>
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
                        <Input id="name" {...register("name")} placeholder="Ví dụ: Camry" className="mt-1" />
                        {errors.name && <p className="text-sm text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name.message}</p>}
                      </div>
                      {/* brand */}
                      <div>
                        <Label htmlFor="brand">Hãng xe *</Label>
                        <select id="brand" {...register("brand")} defaultValue="" className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <option value="" disabled>-- Chọn brand --</option>
                          {brand.map((brandName) => (
                            <option key={brandName} value={brandName}>{brandName}</option>
                          ))}
                        </select>
                        {errors.brand && <p className="text-sm text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.brand.message}</p>}
                      </div>
                      {/* license plate */}
                      <div>
                        <Label htmlFor="license_plate">Biển số xe *</Label>
                        <Input id="license_plate" {...register("license_plate")} placeholder="29-G1-12345" className="mt-1" />
                        {errors.license_plate && <p className="text-sm text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.license_plate.message}</p>}
                      </div>
                      {/* odo reading */}
                      <div>
                        <Label htmlFor="odo_reading">Số km</Label>
                        <Input id="odo_reading" {...register("odo_reading", { valueAsNumber: true })} type={"number"} placeholder="2000" className="mt-1" />
                        {errors.odo_reading && <p className="text-sm text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.odo_reading.message}</p>}
                      </div>
                      {/* year */}
                      <div>
                        <Label htmlFor="year">Năm sản xuất</Label>
                        <Input id="year" type="number" {...register("year", { valueAsNumber: true })} placeholder="2024" className="mt-1" />
                        {errors.year && <p className="text-sm text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.year.message}</p>}
                      </div>
                      {/* Engine Type */}
                      <div>
                        <Label htmlFor="engine_type">Loại động cơ</Label>
                        <Controller
                          name="engine_type"
                          control={control}
                          defaultValue="gasoline"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn loại động cơ" /></SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {engineTypes.map(({ label, value }) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.engine_type && <p className="text-sm text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.engine_type.message}</p>}
                      </div>
                      {/* Description */}
                      <div className="md:col-span-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea id="description" {...register("description")} placeholder="Thông tin bổ sung về xe..." rows={3} className="mt-1" />
                        {errors.description && <p className="text-sm text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.description.message}</p>}
                      </div>
                      {/* IMAGE UPLOAD */}
                      <div className="md:col-span-2">
                        <Label>Ảnh xe</Label>
                        <Input id="image-upload-input" type="file" accept="image/*" onChange={handleImageChange} className="mt-1" />
                        {isUploading && <p className="text-sm text-blue-600 mt-2">Đang tải ảnh lên...</p>}
                        {imagePreview && (
                          <div className="mt-2">
                            <img src={imagePreview} alt="Preview" className="w-full h-24 object-cover rounded-md border" />
                          </div>
                        )}
                      </div>
                      {/* Buttons */}
                      <DialogFooter className="md:col-span-2 flex justify-start items-center gap-2 pt-2">
                        <DialogClose asChild>
                          <Button type="button" variant="outline" size="sm">Hủy</Button>
                        </DialogClose>
                        <Button type="submit" size="sm" className="bg-[#DF1D01] hover:bg-red-800" disabled={vehicleForm.formState.isSubmitting || isUploading}>
                          {vehicleForm.formState.isSubmitting ? "Đang thêm..." : "Thêm xe"}
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-lg bg-gray-100 rounded-lg">
              <TabsTrigger value="personal" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md">
                <User className="h-4 w-4" /> Thông tin cá nhân
              </TabsTrigger>
              <TabsTrigger value="vehicle" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md">
                <Car className="h-4 w-4" /> Thông Tin Xe
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm rounded-md">
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
                <p>Nội dung tab Lịch sử sửa xe sẽ ở đây.</p>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LayoutProfile;