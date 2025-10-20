import { useAuth, useUser } from "@clerk/clerk-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const { user, isLoaded: authLoaded } = useUser();
  const navigate = useNavigate();

  const { isSignedIn } = useAuth();

  if (!authLoaded) {
    return <div className="text-center p-8">⏳ Đang tải...</div>;
  }

  if (!isSignedIn) {
    navigate("/");
    return null;
  }
  const getUserInfo = () => {
    return {
      phone: user.phoneNumbers?.[0]?.phoneNumber || "Chưa cập nhật",
      email: user.emailAddresses?.[0]?.emailAddress || "Chưa cập nhật",
      fullName:
        `${user.lastName || ""} ${user.firstName || ""}`.trim() ||
        "Chưa cập nhật",
      address:
        user.publicMetadata?.address ||
        user.privateMetadata?.address ||
        "Chưa cập nhật",
      gender: user.publicMetadata?.gender || "Chưa cập nhật",
    };
  };

  const userInfo = getUserInfo();

  return (
    <div className="container grid grid-cols-2 gap-2 m-4 [&>*]:m-2  mb-50 [&>*]:w-full">
      <div className="w-1/2">
        <p>Họ Và Tên</p>
        <input
          type="text"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2 "
          value={userInfo.fullName}
        />
      </div>

      <div className="w-1/2">
        <p>Số Điện Thoại</p>
        <input
          type="tel"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2 "
          value={userInfo.phone}
        />
      </div>

      <div>
        <p>Địa Chỉ</p>
        <input
          type="text"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2 "
          value={userInfo.address}
        />
      </div>

      <div>
        <p>Email</p>
        <input
          type="email"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2 "
          value={userInfo.email}
        />
      </div>

      <div>
        <p>Giới TÍnh</p>
        <input
          type="text"
          className="bg-[#f1eded] rounded-xl opacity-70 w-2/3 py-2 px-2 "
          value={userInfo.gender}
        />
      </div>

      <div>
        <button className="bg-green-500 p-2 rounded-xl text-white hover:bg-green-900 cursor-pointer">
          Save
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
