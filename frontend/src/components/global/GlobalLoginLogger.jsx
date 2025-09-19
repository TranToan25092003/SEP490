import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import { customFetch } from "@/utils/customAxios";

const GlobalLoginLogger = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const hasLogged = useRef(false);

  useEffect(() => {
    // Nếu chưa load xong hoặc chưa đăng nhập thì không làm gì
    if (!isLoaded || !isSignedIn || !user) return;

    // Nếu đã log rồi thì bỏ qua
    if (hasLogged.current) return;

    // Nếu user đăng nhập nhưng đã từng log (trong localStorage) thì không log lại
    const loginMarker = localStorage.getItem("loginLogged");
    if (loginMarker === user.id) {
      hasLogged.current = true;
      return;
    }

    // Đánh dấu đã log và lưu vào localStorage
    hasLogged.current = true;
    localStorage.setItem("loginLogged", user.id);

    customFetch
      .post("/activity-logs/login")
      .catch((err) =>
        console.error("❌ Ghi log login thất bại:", err?.response?.data || err)
      );
  }, [isLoaded, isSignedIn, user]);

  return null;
};

export default GlobalLoginLogger;
