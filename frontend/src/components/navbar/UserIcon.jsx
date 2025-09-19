import { useAuth, useUser } from "@clerk/clerk-react";
import React, { use } from "react";
import { LuUser } from "react-icons/lu";

const UserIcon = () => {
  // const { userId } = await auth(); get userId

  const { user } = useUser();

  const profileImage = user?.imageUrl;

  if (profileImage) {
    return <img src={profileImage} className="w-6 h-6 rounded object-cover" />;
  }

  return (
    <LuUser className="w-6 h-6 bg-primary rounded-full text-white"></LuUser>
  );
};

export default UserIcon;
