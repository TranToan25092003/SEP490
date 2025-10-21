import React from "react";
import background from "../../assets/cool-motorcycle-indoors.png";
import { useAuth, useUser } from "@clerk/clerk-react";
import avatarImg from "../../assets/avatar.png";
import home from "../../assets/home.svg";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useState } from "react";
import VehicleProfile from "./VehicleProfile";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { PopoverContent } from "@radix-ui/react-popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { vehicleSchema } from "@/utils/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Image } from "lucide-react";
import UserProfile from "./UserProfile";

export const layoutProfileLoader = () => {
  try {
    console.log("hello");
    return null;
  } catch (error) {
    console.log(error);
  }
};

const getFileKind = (resourceType, mimeType) => {
  if (resourceType === "image") return "image";
  if (resourceType === "video") return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
};

const uploadFile = async (file, options = {}) => {
  const {
    uploadPreset = "huynt7104",
    cloudName = "djo2yviru",
    folder = "motormate",
    resourceType = "auto",
  } = options;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary upload error:", errorText);
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    return {
      publicId: data.public_id,
      url: data.secure_url,
      kind: getFileKind(data.resource_type, file.type),
      originalName: file.name,
      size: file.size,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

const uploadImage = async (file) => {
  const result = await uploadFile(file, { resourceType: "image" });
  return result.url;
};

const LayoutProfile = () => {
  const { user, isLoaded: authLoaded } = useUser();

  const { isSignedIn, isLoaded: userLoaded } = useAuth();
  const [select, setSelect] = useState(1);
  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      brand: "",
      year: "",
      engine_type: "",
      description: "",
      license_plate: "",
    },
  });

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = form;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Local preview

      // UPLOAD THỰC TẾ ĐẾN CLOUDINARY
      setIsUploading(true);
      try {
        const uploadedUrl = await uploadImage(file);
        setImagePreview(uploadedUrl); // Thay bằng URL thật
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
  const onSubmit = (data) => {
    console.log(data);
    console.log(imagePreview);
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
      className="w-full flex items-center justify-center h-full bg-cover bg-center bg-no-repeat scale-100 "
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "65% 35%",
      }}
    >
      <div className="w-3/4 h-3/4  bg-white rounded-2xl my-3">
        {/* profile */}
        <div className="h-1/5 w-full  flex items-center justify-between">
          <div className="flex ml-10 mt-10 gap-3">
            <img src={profileImage} alt="" className="h-15 w-15 rounded-4xl" />
            <div className="flex flex-col w-fit">
              <p className=" text-xl font-medium">{fullName}</p>

              <p className="text-sm opacity-50">{email}</p>
            </div>
          </div>

          {select === 2 ? (
            <Popover open={open} onOpenChange={setOpen} align="center">
              <PopoverTrigger asChild>
                <button className="bg-[#DF1D01] text-white px-10 py-2 rounded-xl cursor-pointer hover:bg-red-800 mr-10 mt-10">
                  Thêm xe
                </button>
              </PopoverTrigger>

              <PopoverContent align="center" className="">
                <Card className={"w-screen h-screen"}>
                  <CardHeader>
                    <CardTitle className={"text-center text-2xl"}>
                      Thêm xe mới
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <form
                      className="rounded-2xl grid grid-cols-2 gap-x-6 gap-y-4 z-30"
                      onSubmit={handleSubmit(onSubmit)}
                    >
                      {/* name */}
                      <div className="flex items-center">
                        <Label htmlFor="name" className="w-1/3">
                          Tên xe *
                        </Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="Ví dụ: Camry"
                          className="flex-1"
                        />

                        {errors.name && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      {/* brand */}
                      <div className="flex items-center">
                        <Label htmlFor="brand" className="w-1/3">
                          Hãng xe *
                        </Label>
                        <Input
                          id="brand"
                          {...register("brand")}
                          placeholder="Ví dụ: Toyota"
                          className="flex-1"
                        />
                        {errors.brand && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.brand.message}
                          </p>
                        )}
                      </div>

                      {/* license plate */}
                      <div className="flex items-center">
                        <Label htmlFor="license_plate" className="w-1/3">
                          Biển số xe *
                        </Label>
                        <Input
                          id="license_plate"
                          {...register("license_plate")}
                          placeholder="59A-12345"
                          className="flex-1"
                        />
                        {errors.license_plate && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.license_plate.message}
                          </p>
                        )}
                      </div>

                      {/* year */}
                      <div className="flex items-center">
                        <Label htmlFor="year" className="w-1/3">
                          Năm sản xuất
                        </Label>
                        <Input
                          id="year"
                          type="number"
                          {...register("year")}
                          placeholder="2024"
                          className="flex-1"
                        />
                        {errors.year && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.year.message}
                          </p>
                        )}
                      </div>

                      {/* Engine Type */}
                      <div className="flex items-center">
                        <Label htmlFor="engine_type " className={"w-1/3"}>
                          Loại động cơ
                        </Label>
                        <Input
                          id="engine_type"
                          {...register("engine_type")}
                          placeholder="Gasoline, Hybrid, Diesel..."
                          className={"w-2/3"}
                        />
                        {errors.engine_type && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.engine_type.message}
                          </p>
                        )}
                      </div>

                      {/* IMAGE UPLOAD  */}
                      <div className="flex items-center justify-between w-full gap-4">
                        {/* Label */}
                        <Label className="flex items-center gap-2 w-1/3">
                          <img
                            src="/icons/image.svg"
                            alt=""
                            className="h-4 w-4"
                          />{" "}
                          {/* hoặc icon */}
                          Ảnh xe
                        </Label>

                        {/* Input + Button */}
                        <div className="flex items-center w-2/3 gap-3">
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() =>
                              document.getElementById("image").click()
                            }
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Chọn ảnh xe
                          </Button>
                        </div>
                        {imagePreview && (
                          <div className="mt-2">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-24 object-cover rounded-md border"
                              onLoad={() =>
                                console.log("✅ Image loaded from Cloudinary")
                              }
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              ✓ Đã upload thành công!
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="flex items-center">
                        <Label htmlFor="description" className={"w-1/3"}>
                          Mô tả
                        </Label>
                        <Textarea
                          className={"w-2/3"}
                          id="description"
                          {...register("description")}
                          placeholder="Thông tin bổ sung về xe..."
                          rows={3}
                        />
                        {errors.description && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />{" "}
                            {errors.description.message}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-start items-center gap-2 pt-2 [&>*]:cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOpen(false);
                            reset();
                            setImagePreview(null);
                            setImageFile(null);
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="bg-[#DF1D01] hover:bg-red-800"
                          disabled={form.formState.isSubmitting}
                        >
                          Thêm xe
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>
          ) : (
            ""
          )}
        </div>

        {/* bar */}
        <div className="w-fit ml-10 bg-[#DBDBDB] mt-10 p-1 flex items-center justify-center gap-3 [&>*]:cursor-pointer [&>*]:hover:bg-white">
          <div
            className={`flex items-center justify-center gap-1 ${
              select === 1 ? "text-[#DF1D01] bg-[#FFFFFF] font-bold" : ""
            }`}
            onClick={() => {
              setSelect(1);
            }}
          >
            <img src={home} alt="" />
            <p>Thông tin cá nhân</p>
          </div>

          <p
            className={`${
              select === 2 ? "text-[#DF1D01] bg-[#FFFFFF] font-bold" : ""
            }  `}
            onClick={() => {
              setSelect(2);
            }}
          >
            Thông Tin Xe
          </p>
          <p
            className={`${
              select === 3 ? "text-[#DF1D01] bg-[#FFFFFF] font-bold " : ""
            }`}
            onClick={() => {
              setSelect(3);
            }}
          >
            Lịch sử sửa xe
          </p>
        </div>
        <div className="h-3/5 border-2 mt-2 border-red-800 overflow-hidden">
          {select === 2 && <VehicleProfile></VehicleProfile>}
          {select === 1 && <UserProfile></UserProfile>}
        </div>
      </div>
    </div>
  );
};

export default LayoutProfile;
