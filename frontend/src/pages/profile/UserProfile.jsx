import { useAuth, useUser } from "@clerk/clerk-react";
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const UserProfile = () => {
  const { user, isLoaded: authLoaded } = useUser();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    gender: "",
  });

  React.useEffect(() => {
    if (user) {
      setForm({
        fullName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Chưa cập nhật",
        phone: user.unsafeMetadata?.phone || "",
        email: user.emailAddresses?.[0]?.emailAddress || "",
        address: user.unsafeMetadata?.address || "",
        gender: user.unsafeMetadata?.gender || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      if (!user) return;

      // Tách fullName thành firstName và lastName
      const nameParts = form.fullName.trim().split(" ");
      const lastName = nameParts.pop() || "";
      const firstName = nameParts.join(" ") || "";

      // Update basic info trước
      if (firstName || lastName) {
        await user.update({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        });
      }

      // Update metadata sau
      if (form.address || form.gender) {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata, // Giữ lại metadata cũ
            address: form.address || undefined,
            gender: form.gender || undefined,
            phone: form.phone || undefined,
          },
        });
      }

      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      toast.error("❌ Cập nhật thất bại, vui lòng thử lại!");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (!authLoaded) {
    return <div className="text-center p-8">⏳ Đang tải...</div>;
  }

  if (!isSignedIn) {
    navigate("/");
    return null;
  }

  return (
    <div className="container grid grid-cols-2 gap-4 m-4 mb-50">
      {/* Họ và Tên */}
      <div className="w-full">
        <p>Họ Và Tên</p>
        <input
          name="fullName"
          type="text"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2"
          onChange={handleChange}
          value={form.fullName}
        />
      </div>

      {/* Số Điện Thoại */}
      <div className="w-full">
        <p>Số Điện Thoại</p>
        <input
          name="phone"
          type="tel"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2"
          onChange={handleChange}
          value={form.phone}
        />
      </div>

      {/* Địa Chỉ */}
      <div className="w-full">
        <p>Địa Chỉ</p>
        <input
          name="address"
          type="text"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2"
          onChange={handleChange}
          value={form.address}
        />
      </div>

      {/* Email */}
      <div className="w-full">
        <p>Email</p>
        <input
          name="email"
          type="email"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2"
          onChange={handleChange}
          value={form.email}
          disabled // Email thường không cho chỉnh sửa trực tiếp
        />
      </div>

      {/* Giới Tính */}
      <div className="w-full">
        <p>Giới Tính</p>
        <select
          name="gender"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2"
          onChange={handleChange}
          value={form.gender}
        >
          <option value="">Chọn giới tính</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
      </div>

      {/* Nút Lưu */}
      <div className="col-span-2">
        <button
          onClick={handleSave}
          className="bg-green-500 p-2 rounded-xl text-white hover:bg-green-900 cursor-pointer capitalize"
        >
          Lưu thông tin
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
