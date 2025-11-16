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

function UserProfile({
  form,
  isEditing,
  handleChange,
  handleSelectChange,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label htmlFor="fullName">Họ Và Tên</Label>
        <Input
          id="fullName"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          disabled={!isEditing}
          className="mt-2 bg-gray-100/70"
        />
      </div>
      <div>
        <Label htmlFor="phone">Số Điện Thoại</Label>
        <Input
          id="phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          disabled={!isEditing}
          className="mt-2 bg-gray-100/70"
        />
      </div>
      <div>
        <Label htmlFor="address">Địa Chỉ</Label>
        <Input
          id="address"
          name="address"
          value={form.address}
          onChange={handleChange}
          disabled={!isEditing}
          className="mt-2 bg-gray-100/70"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          value={form.email}
          disabled 
          className="mt-2 bg-gray-200/70"
        />
      </div>
      <div>
        <Label htmlFor="gender">Giới Tính</Label>
        <Select
          name="gender"
          value={form.gender}
          onValueChange={(value) => handleSelectChange("gender", value)}
          disabled={!isEditing}
        >
          <SelectTrigger className="mt-2 bg-gray-100/70 w-full">
            <SelectValue placeholder="Chọn giới tính" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Nam</SelectItem>
            <SelectItem value="female">Nữ</SelectItem>
            <SelectItem value="other">Khác</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default UserProfile;