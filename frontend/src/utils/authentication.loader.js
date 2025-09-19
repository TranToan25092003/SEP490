import { toast } from "sonner";
import { redirect } from "react-router-dom";
import clerk from "./clerk";
import { customFetch } from "./customAxios";

export const authenTicationLoader = async () => {
  try {
    if (!clerk.isSignedIn) {
      toast.error("Bạn cần đăng nhập để truy cập trang này", {
        description: "Vui lòng đăng nhập để tiếp tục",
      });
      return redirect("/");
    }

    const memberships = await clerk.user.getOrganizationMemberships();

    if (!memberships.data || memberships.data.length === 0) {
      toast.error("Bạn không thuộc tổ chức nào", {
        description: "Vui lòng liên hệ admin để được thêm vào tổ chức",
      });
      return redirect("/");
    }

    const role = memberships.data[0].role;

    if (!role.includes("admin")) {
      toast.error("Bạn không có quyền truy cập trang này", {
        description: "Chỉ admin mới có thể truy cập",
      });
      return redirect("/");
    }
  } catch (error) {
    console.error("Authentication error:", error);
    toast.error("Lỗi xác thực", {
      description: error.message || "Vui lòng thử lại sau",
    });
    return redirect("/");
  }
};
