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

      const baseDestination = getRoleRedirectPath(user);

      // Nếu là lần đầu, vẫn redirect theo role nhưng thêm query firstLogin
      if (isFirstLogin) {
        const destinationWithFlag = baseDestination.includes("?")
          ? `${baseDestination}&firstLogin=true`
          : `${baseDestination}?firstLogin=true`;

        console.log(
          "RoleRedirect: Redirecting to (first login):",
          destinationWithFlag
        );
        navigate(destinationWithFlag, { replace: true });
        return;
      }

      // Nếu không phải lần đầu, redirect theo role bình thường
      console.log("RoleRedirect: Redirecting to:", baseDestination);
      navigate(baseDestination, { replace: true });
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


