import React, { useEffect, useState } from "react";
import { Badge, Dropdown, Spin, Tabs, message } from "antd";
import { Bell, X, User, MessageCircle, Heart, UserPlus } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AuthRequiredModal from "./AuthRequiredModal";

dayjs.extend(relativeTime);

const API_URL = import.meta.env.VITE_API_URL;

const NotificationBell = () => {
  const { userId, getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [allNotifications, setAllNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = await getToken();

      const [resAll, resUnread] = await Promise.all([
        fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/notifications?status=unread`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const dataAll = await resAll.json();
      const dataUnread = await resUnread.json();

      if (dataAll.success) setAllNotifications(dataAll.data);
      if (dataUnread.success) {
        setUnreadNotifications(dataUnread.data);
        setUnreadCount(dataUnread.unreadCount || 0);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông báo:", error);
      message.error("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchNotifications();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const socket = io(API_URL, { transports: ["websocket"] });
    socket.emit("join", userId);

    socket.on("new_notification", (newNotification) => {
      console.log("New notification received:", newNotification);
      fetchNotifications();
    });

    return () => {
      socket.off("new_notification");
      socket.disconnect();
    };
  }, [userId]);

 const handleNotificationClick = async (notification) => {
 
  if (!notification.isRead) {
    try {
      const token = await getToken();
     
      await fetch(`${API_URL}/notifications/mark-read/${notification._id}`, {
        method: "PATCH", 
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

    
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  if (notification.type !== "follow" && notification.link && notification.link !== "#") {
    navigate(notification.link);
    setDropdownOpen(false);
  }
  
  
  if (notification.type === "follow") {
    setDropdownOpen(false);
  }
};
  const handleDeleteNotification = async (id) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      message.error("Không thể xóa thông báo.");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case "new_post":
        return <Heart className="w-5 h-5 text-pink-500" />;
      default:
        return <Bell className="w-5 h-5 text-orange-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "message":
        return "border-blue-500";
      case "follow":
        return "border-green-500";
      case "new_post":
        return "border-pink-500";
      default:
        return "border-orange-400";
    }
  };

  const handleDropdownOpenChange = (flag) => {
    if (!isSignedIn && flag) {
      setShowAuthModal(true);
      return;
    }
    setDropdownOpen(flag);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  const renderList = (data) =>
    data.length ? (
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {data.map((n) => (
          <div
            key={n._id}
            className={`group relative flex items-start gap-3 p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 border-l-4 ${getNotificationColor(
              n.type
            )} ${!n.isRead ? "bg-blue-50/30" : ""}`}
          >
            {/* Icon thông báo */}
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(n.type)}
            </div>

            {/* Nội dung thông báo */}
            <div
              onClick={() => handleNotificationClick(n)}
              className="flex-1 cursor-pointer min-w-0"
            >
              <div
                className={`text-sm leading-relaxed break-words ${
                  !n.isRead ? "font-semibold text-gray-900" : "text-gray-700"
                }`}
              >
                {n.message}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs text-gray-500">
                  {dayjs(n.createdAt).fromNow()}
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Nút xóa */}
            <button
              onClick={() => handleDeleteNotification(n._id)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100"
              title="Xóa thông báo"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-gray-500 text-center">
          <div className="font-medium">Không có thông báo</div>
          <div className="text-sm text-gray-400 mt-1">
            Bạn sẽ nhận được thông báo mới tại đây
          </div>
        </div>
      </div>
    );

  return (
    <>
      {isSignedIn ? (
        loading ? (
          <div className="flex items-center justify-center p-2">
            <Spin size="small" />
          </div>
        ) : (
          <Dropdown
            open={dropdownOpen}
            onOpenChange={handleDropdownOpenChange}
            dropdownRender={() => (
              <div className="w-96 max-h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Thông báo</h3>
                    {unreadCount > 0 && (
                      <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                        {unreadCount} mới
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white">
                  <Tabs
                    defaultActiveKey="all"
                    centered
                    className="notification-tabs"
                    items={[
                      {
                        key: "all",
                        label: (
                          <div className="flex items-center gap-2 px-2">
                            <Bell className="w-4 h-4" />
                            <span>Tất cả</span>
                          </div>
                        ),
                        children: renderList(allNotifications),
                      },
                      {
                        key: "unread",
                        label: (
                          <div className="flex items-center gap-2 px-2">
                            <Badge count={unreadCount} size="small">
                              <Bell className="w-4 h-4" />
                            </Badge>
                            <span>Chưa đọc</span>
                          </div>
                        ),
                        children: renderList(unreadNotifications),
                      },
                    ]}
                  />
                </div>
              </div>
            )}
            trigger="click"
            placement="bottomRight"
          >
            <div className="flex items-center justify-center relative cursor-pointer">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </Dropdown>
        )
      ) : (
        <div
          className="flex items-center justify-center relative cursor-pointer"
          onClick={() => setShowAuthModal(true)}
        >
          <Bell className="w-6 h-6" />
        </div>
      )}

      <AuthRequiredModal
        open={showAuthModal}
        onClose={handleAuthModalClose}
        featureName="thông báo"
      />
    </>
  );
};

export default NotificationBell;
