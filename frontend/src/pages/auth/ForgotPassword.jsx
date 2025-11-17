import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);

  if (!isLoaded) {
    return null;
  }

  const sendResetCode = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email.");
      return;
    }

    try {
      setIsLoading(true);
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      toast.message("Đã gửi mã đặt lại mật khẩu. Vui lòng kiểm tra email.");
      setPendingReset(true);
    } catch (error) {
      toast.error(error.errors?.[0]?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const finishReset = async (e) => {
    e.preventDefault();
    if (!code) {
      toast.error("Vui lòng nhập mã xác nhận.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Đặt lại mật khẩu thành công.");
        navigate("/");
      } else {
        toast.error("Không thể hoàn tất. Vui lòng thử lại.");
      }
    } catch (error) {
      toast.error(error.errors?.[0]?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-semibold text-center text-[#D31705] uppercase mb-6">
          Quên mật khẩu
        </h1>

        {!pendingReset ? (
          <form onSubmit={sendResetCode} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#DF1D01] hover:bg-red-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
            >
              Gửi mã đặt lại
            </button>
          </form>
        ) : (
          <form onSubmit={finishReset} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Mã xác nhận</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Nhập mã trong email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mật khẩu mới"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#DF1D01] hover:bg-red-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
            >
              Đặt lại mật khẩu
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
