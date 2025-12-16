import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import placeholderVehicle from '@/assets/part-lopsau.png';
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { customFetch } from "@/utils/customAxios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";



// Component VehicleProfile mới
const VehicleProfile = ({ vehicles = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [localVehicles, setLocalVehicles] = useState(vehicles);
  const itemsPerPage = 2;

  useEffect(() => {
    setLocalVehicles(vehicles);
    setCurrentPage(1);
  }, [vehicles]);

  const handleHideVehicle = async (vehicleId) => {
    try {
      await customFetch.patch("/profile/vehicles/hide", { vehicleId });
      setLocalVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
      toast.success("Đã xóa xe khỏi hồ sơ của bạn");
    } catch (error) {
      console.error("Failed to hide vehicle:", error);
      const message =
        error?.response?.data?.message ||
        "Không thể xóa xe khỏi hồ sơ, vui lòng thử lại";
      toast.error(message);
    }
  };

  if (localVehicles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        <p>Bạn chưa có xe nào.</p>
        <p className="text-sm mt-4">Xe bạn thêm sẽ được hiển thị ở đây.</p>
      </div>
    );
  }

  // Tính toán phân trang
  const totalPages = Math.ceil(localVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = localVehicles.slice(startIndex, endIndex);

  return (
    <div className="space-y-8">
      {currentVehicles.map((vehicle) => (
        <div key={vehicle._id} className="border-b pb-8 mb-8 last:border-b-0 last:pb-0 last:mb-0">
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm font-medium text-gray-700">
              Xe {vehicle.license_plate}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Xóa khỏi hồ sơ
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa xe khỏi hồ sơ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Xe này sẽ không còn hiển thị trong hồ sơ và bộ lọc lịch sử sửa xe của bạn,
                    nhưng các lệnh sửa chữa và dữ liệu liên quan vẫn được giữ nguyên trong hệ thống.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleHideVehicle(vehicle._id)}
                  >
                    Xác nhận xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor={`licensePlate-${vehicle._id}`}>Biển Số Xe</Label>
              <Input id={`licensePlate-${vehicle._id}`} value={vehicle.license_plate} disabled className="mt-2 bg-gray-100/70" />
            </div>
            <div>
              <Label htmlFor={`nickname-${vehicle._id}`}>Tên gọi</Label>
              <Input id={`nickname-${vehicle._id}`} value={vehicle.name || 'Unknown'} disabled className="mt-2 bg-gray-100/70" />
            </div>
            <div>
              <Label htmlFor={`type-${vehicle._id}`}>Loại Xe</Label>
              <Select disabled value={vehicle.engine_type || 'gasoline'}>
                <SelectTrigger className="mt-2 bg-gray-100/70 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Động cơ xăng</SelectItem>
                  <SelectItem value="electric">Động cơ điện</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`brand-${vehicle._id}`}>Hãng Xe</Label>
              <Select disabled value={vehicle.brand || 'YAMAHA'}>
                <SelectTrigger className="mt-2 bg-gray-100/70 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={vehicle.brand || 'YAMAHA'}>{vehicle.brand || 'Unknown'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`year-${vehicle._id}`}>Sản Xuất</Label>
              <Input id={`year-${vehicle._id}`} value={vehicle.year} disabled className="mt-2 bg-gray-100/70" />
            </div>
          </div>

          {/* Hiển thị danh sách hình ảnh của xe */}

          {vehicle.images && vehicle.images.length > 0 && (
            <div className="mt-6">
              <Label>Hình ảnh xe</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {vehicle.images.map((imgSrc, index) => (
                  <div key={index} className="w-24 h-24 rounded-lg bg-gray-100 p-1 border">
                    <img
                      src={imgSrc || placeholderVehicle}
                      alt={`Vehicle image ${index + 1}`}
                      className="h-full w-full object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Hiển thị {startIndex + 1} -{" "}
            {Math.min(endIndex, localVehicles.length)} trong tổng số{" "}
            {localVehicles.length} xe
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.max(1, prev - 1))
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
                    currentPage === page ? "default" : "outline"
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

      {localVehicles.length > 0 && totalPages <= 1 && (
        <p className="mt-6 text-center text-sm text-gray-500">Xe được thêm hiển thị giống như trên.</p>
      )}
    </div>
  );
};

export default VehicleProfile;
