import React from "react";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { customFetch } from "@/utils/customAxios"; // hoặc nơi bạn định nghĩa axios

const SignOutLink = () => {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await customFetch.post("/activity-logs/logout");
    } catch (error) {
      console.error("❌ Ghi log logout thất bại:", error);
    }

    localStorage.removeItem("loginLogged"); // 🧹 Xóa dấu đã ghi log login

    toast.success("Đăng xuất thành công");

    await signOut(() => navigate("/"));
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left text-red-600 hover:text-red-800 transition"
    >
      Logout
    </button>
  );
};

export default SignOutLink;
