import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { getRoleRedirectPath } from "@/utils/roleRedirect";

const RoleRedirect = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      navigate("/login", { replace: true });
      return;
    }

    const destination = getRoleRedirectPath(user);
    navigate(destination, { replace: true });
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


