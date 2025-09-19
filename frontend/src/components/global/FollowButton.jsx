import React, { useEffect, useState } from "react";
import { Button, message } from "antd";
import { useAuth } from "@clerk/clerk-react";

const API_URL = import.meta.env.VITE_API_URL;

const FollowButton = ({ targetUserId }) => {
  const { userId, getToken } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const token = await getToken(); // ❌ BỎ template để tránh lỗi

        if (!token) return;

        const res = await fetch(`${API_URL}/follows/status/${targetUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) {
          setIsFollowing(data.isFollowing);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra trạng thái follow:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId && targetUserId && userId !== targetUserId) {
      fetchFollowStatus();
    }
  }, [userId, targetUserId, getToken]);

  const handleFollow = async () => {
    try {
      const token = await getToken(); // ❌ BỎ template

      if (!token) return;

      const res = await fetch(`${API_URL}/follows/${targetUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        message.success("✅ Đã theo dõi người dùng.");
        setIsFollowing(true);
      } else {
        message.warning(data.message);
      }
    } catch (err) {
      console.error("Lỗi khi theo dõi:", err.message);
      message.error("❌ Không thể theo dõi người dùng.");
    }
  };

  const handleUnfollow = async () => {
    try {
      const token = await getToken(); // ❌ BỎ template

      if (!token) return;

      const res = await fetch(`${API_URL}/follows/${targetUserId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        message.success("✅ Đã bỏ theo dõi.");
        setIsFollowing(false);
      } else {
        message.warning(data.message);
      }
    } catch (err) {
      console.error("Lỗi khi bỏ theo dõi:", err.message);
      message.error("❌ Không thể bỏ theo dõi.");
    }
  };

  if (loading || !userId || userId === targetUserId) return null;

  return (
    <Button
      type={isFollowing ? "default" : "primary"}
      onClick={isFollowing ? handleUnfollow : handleFollow}
      size="small"
    >
      {isFollowing ? "Đã theo dõi" : "Theo dõi người đăng"}
    </Button>
  );
};

export default FollowButton;
