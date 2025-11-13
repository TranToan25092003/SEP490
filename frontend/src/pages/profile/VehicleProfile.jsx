import React from 'react';
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
import placeholderVehicle from '@/assets/part-lopsau.png'; 



// Component VehicleProfile mới
const VehicleProfile = ({ vehicles = [] }) => {
  if (vehicles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        <p>Bạn chưa có xe nào.</p>
        <p className="text-sm mt-4">Xe bạn thêm sẽ được hiển thị ở đây.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {vehicles.map((vehicle) => (
        <div key={vehicle._id} className="border-b pb-8 mb-8 last:border-b-0 last:pb-0 last:mb-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor={`licensePlate-${vehicle._id}`}>Biển Số Xe</Label>
              <Input id={`licensePlate-${vehicle._id}`} value={vehicle.license_plate} disabled className="mt-2 bg-gray-100/70" />
            </div>
            <div>
              <Label htmlFor={`nickname-${vehicle._id}`}>Tên gọi</Label>
              <Input id={`nickname-${vehicle._id}`} value={vehicle.model_id?.name || 'N/A'} disabled className="mt-2 bg-gray-100/70" />
            </div>
            <div>
              <Label htmlFor={`type-${vehicle._id}`}>Loại Xe</Label>
              <Select disabled value={vehicle.model_id?.engine_type || 'gasoline'}>
                <SelectTrigger className="mt-2 bg-gray-100/70 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Động cơ xăng</SelectItem>
                  <SelectItem value="electric">Động cơ điện</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`brand-${vehicle._id}`}>Hãng Xe</Label>
              <Select disabled value={vehicle.model_id?.brand || 'YAMAHA'}>
                <SelectTrigger className="mt-2 bg-gray-100/70 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="YAMAHA">YAMAHA</SelectItem>
                  <SelectItem value="HONDA">HONDA</SelectItem>
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

      {vehicles.length > 0 && (
        <p className="mt-6 text-center text-sm text-gray-500">Xe được thêm hiển thị giống như trên.</p>
      )}
    </div>
  );
};

export default VehicleProfile;