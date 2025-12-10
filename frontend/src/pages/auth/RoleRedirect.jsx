import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { getRoleRedirectPath, checkIsFirstLogin } from "@/utils/roleRedirect";

const RoleRedirect = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      navigate("/login", { replace: true });
      return;
    }

    console.log("RoleRedirect: User signed in, checking first login...");
    // Kiểm tra xem đây có phải là lần đăng nhập đầu tiên không
    checkIsFirstLogin(user).then((isFirstLogin) => {
      console.log("RoleRedirect: First login check result:", isFirstLogin);
      if (isFirstLogin) {
        // Nếu là lần đầu, redirect đến profile với query param firstLogin
        console.log("RoleRedirect: Redirecting to /profile?firstLogin=true");
        navigate("/profile?firstLogin=true", { replace: true });
      } else {
        // Nếu không phải lần đầu, redirect theo role
        const destination = getRoleRedirectPath(user);
        console.log("RoleRedirect: Redirecting to:", destination);
        navigate(destination, { replace: true });
      }
    });
  }, [isLoaded, isSignedIn, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-gray-500">
        Đang kiểm tra vai trò và chuyển hướng...
      </p>
    </div>
  );
};

export default RoleRedirect;


