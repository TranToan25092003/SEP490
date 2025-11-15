import React, { useState } from 'react';
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



// Component VehicleProfile mới
const VehicleProfile = ({ vehicles = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  if (vehicles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        <p>Bạn chưa có xe nào.</p>
        <p className="text-sm mt-4">Xe bạn thêm sẽ được hiển thị ở đây.</p>
      </div>
    );
  }

  // Tính toán phân trang
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = vehicles.slice(startIndex, endIndex);

  return (
    <div className="space-y-8">
      {currentVehicles.map((vehicle) => (
        <div key={vehicle._id} className="border-b pb-8 mb-8 last:border-b-0 last:pb-0 last:mb-0">
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
            {Math.min(endIndex, vehicles.length)} trong tổng số{" "}
            {vehicles.length} xe
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

      {vehicles.length > 0 && totalPages <= 1 && (
        <p className="mt-6 text-center text-sm text-gray-500">Xe được thêm hiển thị giống như trên.</p>
      )}
    </div>
  );
};

export default VehicleProfile;