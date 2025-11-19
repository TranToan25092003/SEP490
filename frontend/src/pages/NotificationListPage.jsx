import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { customFetch } from "@/utils/customAxios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { io } from "socket.io-client";
import {
  Loader2,
  CalendarCheck,
  CalendarX,
  Flag,
  Wrench,
  MessageSquareWarning,
  MessageCircle,
  Megaphone,
  PackageMinus,
  Info,
  DollarSign,
  FileText,
  ShieldCheck,
  Lock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCheck } from "lucide-react";

// --- Helper Functions ---
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vài giây trước";
}

const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
});

const NotificationIcon = ({ type }) => {
  let IconComponent;
  let iconColor;

  switch (type) {
    case "BOOKING_CONFIRMED":
    case "BOOKING_COMPLETED":
    case "BOOKING_REMINDER":
    case "NEW_BOOKING_CREATED":
    case "SERVICE_ORDER_ASSIGNED":
      IconComponent = CalendarCheck;
      iconColor = "bg-blue-500";
      break;

    case "BOOKING_CANCELLED":
      IconComponent = CalendarX;
      iconColor = "bg-gray-500";
      break;

    case "PASSWORD_CHANGED":
      IconComponent = Lock;
      iconColor = "bg-slate-600";
      break;

    case "COMPLAINT_REPLIED":
    case "COMPLAINT_SUBMITTED":
    case "NEW_COMPLAINT_RECEIVED":
      IconComponent = MessageSquareWarning;
      iconColor = "bg-red-500";
      break;

    case "MAINTENANCE_REMINDER":
      IconComponent = Wrench;
      iconColor = "bg-yellow-500";
      break;

    case "PAYMENT_SUCCESSFUL":
    case "PAYMENT_CONFIRMED":
      IconComponent = DollarSign;
      iconColor = "bg-red-600";
      break;

    case "QUOTE_READY":
    case "QUOTE_REVISED":
      IconComponent = FileText;
      iconColor = "bg-rose-500";
      break;

    case "QUOTE_APPROVED":
      IconComponent = FileText;
      iconColor = "bg-emerald-600";
      break;

    case "QUOTE_REVISION_REQUESTED":
      IconComponent = FileText;
      iconColor = "bg-amber-500";
      break;

    case "QUOTE_DECLINED":
      IconComponent = FileText;
      iconColor = "bg-gray-500";
      break;

    case "QUOTE_ADDITIONAL_REQUESTED":
      IconComponent = FileText;
      iconColor = "bg-indigo-500";
      break;

    case "QUOTE_ADDITIONAL_APPROVED":
      IconComponent = FileText;
      iconColor = "bg-teal-500";
      break;

    case "QUOTE_ADDITIONAL_DECLINED":
      IconComponent = FileText;
      iconColor = "bg-orange-500";
      break;

    case "SERVICE_ORDER_STATUS_UPDATED":
      IconComponent = Flag;
      iconColor = "bg-amber-500";
      break;

    case "CHAT_MESSAGE":
      IconComponent = MessageCircle;
      iconColor = "bg-pink-500";
      break;

    case "WARRANTY_BOOKING_CONFIRMED":
    case "WARRANTY_REQUEST_ACCEPTED":
      IconComponent = ShieldCheck;
      iconColor = "bg-emerald-600";
      break;

    case "WARRANTY_REQUEST_REJECTED":
      IconComponent = ShieldCheck;
      iconColor = "bg-red-600";
      break;

    case "STOCK_LEVEL_LOW":
      IconComponent = PackageMinus;
      iconColor = "bg-orange-500";
      break;

    case "GENERAL_ANNOUNCEMENT":
    case "CAMPAIGN_ANNOUNCEMENT":
      IconComponent = Megaphone;
      iconColor = "bg-indigo-500";
      break;

    default:
      IconComponent = Info;
      iconColor = "bg-gray-500";
  }

  return (
    <div
      className={`h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center ${iconColor}`}
    >
      <IconComponent className="h-6 w-6 text-white" />
    </div>
  );
};

const NotificationItem = ({ notification, onNotificationClick }) => {
  const isUnread = !notification.isRead;

  return (
    <div
      className={`flex items-center gap-4 p-4 cursor-pointer rounded-xl border transition-colors ${
        isUnread
          ? "bg-rose-50 border-rose-100 hover:bg-rose-100/70"
          : "bg-white border-gray-100 hover:bg-gray-50"
      }`}
      onClick={() => onNotificationClick(notification)}
    >
      {/* Thêm Icon vào đây */}
      <NotificationIcon type={notification.type} />

      <div className="flex-1">
        <p
          className={`text-sm leading-snug ${
            isUnread ? "text-rose-900" : "text-gray-500"
          }`}
          style={{ whiteSpace: "normal" }}
        >
          <span className={isUnread ? "font-bold" : "font-medium"}>
            {notification.title}
          </span>
          <span> - {notification.message}</span>
        </p>
        <span
          className={`text-xs ${
            isUnread ? "text-rose-600 font-semibold" : "text-gray-500"
          }`}
        >
          {timeAgo(notification.createdAt)}
        </span>
      </div>
      {isUnread && (
        <div className="h-3 w-3 rounded-full bg-rose-500 self-center flex-shrink-0 ml-2"></div>
      )}
    </div>
  );
};

// --- Main Page Component ---
function NotificationListPage() {
  const {
    initialNotifications,
    pagination,
    unreadCount: initialUnreadCount,
  } = useLoaderData();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [allNotifications, setAllNotifications] = useState({
    list: initialNotifications,
    page: pagination.currentPage,
    totalPages: pagination.totalPages,
  });
  const [unreadNotifications, setUnreadNotifications] = useState({
    list: [],
    page: 1,
    totalPages: 1,
  });

  const [activeTab, setActiveTab] = useState("all");
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const fetchNotifications = useCallback(
    async (tab, pageNum) => {
      if (isLoading) return;
      setIsLoading(true);

      let query = `/notifications?page=${pageNum}&limit=10`;
      if (tab === "unread") {
        query += "&isRead=false";
      }

      try {
        const res = await customFetch.get(query);
        if (res.data.success) {
          const { data, pagination } = res.data;
          const newState = {
            list:
              pageNum === 1
                ? data
                : [
                    ...(tab === "all"
                      ? allNotifications.list
                      : unreadNotifications.list),
                    ...data,
                  ],
            page: pagination.currentPage,
            totalPages: pagination.totalPages,
          };

          if (tab === "all") setAllNotifications(newState);
          else setUnreadNotifications(newState);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
        toast.error("Lỗi", { description: "Không thể tải thêm thông báo." });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, allNotifications, unreadNotifications]
  );

  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          const currentData =
            activeTab === "all" ? allNotifications : unreadNotifications;
          if (currentData.page < currentData.totalPages) {
            fetchNotifications(activeTab, currentData.page + 1);
          }
        }
      });

      if (node) observer.current.observe(node);
    },
    [
      isLoading,
      activeTab,
      allNotifications,
      unreadNotifications,
      fetchNotifications,
    ]
  );

  useEffect(() => {
    if (userId) {
      if (!socket.connected) socket.connect();

      const onConnect = () => socket.emit("joinRoomNotification", userId);
      socket.on("connect", onConnect);

      const handleNewNotification = (newNotification) => {
        setAllNotifications((prev) => ({
          ...prev,
          list: [newNotification, ...prev.list],
        }));
        setUnreadNotifications((prev) => ({
          ...prev,
          list: [newNotification, ...prev.list],
        }));
        setUnreadCount((prev) => prev + 1);
        toast.info("Bạn có thông báo mới!", {
          description: newNotification.title,
        });
      };

      socket.on("new_notification", handleNewNotification);

      return () => {
        socket.off("connect", onConnect);
        socket.off("new_notification", handleNewNotification);
        socket.disconnect();
      };
    }
  }, [userId]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === "unread" && unreadNotifications.list.length === 0) {
      fetchNotifications("unread", 1);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.type === "COMPLAINT_REPLIED") {
      let replyId =
        notification.metadata?.complaintId ||
        (notification.linkTo
          ? new URL(
              notification.linkTo,
              window.location.origin
            ).searchParams.get("replyComplaintId")
          : null);

      if (!replyId && notification.linkTo) {
        const parts = notification.linkTo.split("/");
        replyId = parts[parts.length - 1] || null;
      }

      navigate(
        replyId ? `/complaint?replyComplaintId=${replyId}` : "/complaint"
      );
    } else {
      navigate(notification.linkTo || "/");
    }

    if (!notification.isRead) {
      try {
        await customFetch.patch("/notifications/mark-as-read", {
          notificationIds: [notification._id],
        });
        setAllNotifications((prev) => ({
          ...prev,
          list: prev.list.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          ),
        }));
        setUnreadNotifications((prev) => ({
          ...prev,
          list: prev.list.filter((n) => n._id !== notification._id),
        }));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setIsMarkingRead(true);
    try {
      const res = await customFetch.patch("/notifications/mark-all-as-read");

      if (res.data.success) {
        toast.success("Đã đánh dấu tất cả là đã đọc");
        setUnreadCount(0);
        setAllNotifications((prev) => ({
          ...prev,
          list: prev.list.map((n) => ({ ...n, isRead: true })),
        }));
        setUnreadNotifications({ list: [], page: 1, totalPages: 1 });
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      toast.error("Lỗi", {
        description: error.message || "Không thể đánh dấu đã đọc tất cả.",
      });
    } finally {
      setIsMarkingRead(false);
    }
  };

  const currentList =
    activeTab === "all" ? allNotifications.list : unreadNotifications.list;
  const currentPage =
    activeTab === "all" ? allNotifications.page : unreadNotifications.page;

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <Tabs
            defaultValue="all"
            onValueChange={handleTabChange}
            className="p-4"
          >
            {/* Header với nút "Đã đọc tất cả" */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleMarkAllAsRead}
                      disabled={isMarkingRead || unreadCount === 0}
                      className="text-gray-500 hover:text-gray-900 data-[disabled=true]:opacity-50"
                    >
                      {isMarkingRead ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCheck className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Đánh dấu tất cả là đã đọc</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="px-1 mb-4">
              <TabsList className="grid w-full grid-cols-2 bg-rose-50/80 p-1 rounded-full border border-rose-100">
                <TabsTrigger
                  value="all"
                  className="rounded-full py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-inner"
                >
                  Tất cả
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="rounded-full py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-inner"
                >
                  Chưa đọc
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="m-0 space-y-2">
              {isLoading && allNotifications.list.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  Đang tải...
                </p>
              ) : allNotifications.list.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  Không có thông báo nào.
                </p>
              ) : (
                allNotifications.list.map((noti, index) => (
                  <div
                    ref={
                      allNotifications.list.length === index + 1
                        ? lastElementRef
                        : null
                    }
                    key={noti._id}
                  >
                    <NotificationItem
                      notification={noti}
                      onNotificationClick={handleNotificationClick}
                    />
                  </div>
                ))
              )}
            </TabsContent>
            <TabsContent value="unread" className="m-0 space-y-2">
              {isLoading && unreadNotifications.list.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  Đang tải...
                </p>
              ) : unreadNotifications.list.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  Không có thông báo chưa đọc.
                </p>
              ) : (
                unreadNotifications.list.map((noti, index) => (
                  <div
                    ref={
                      unreadNotifications.list.length === index + 1
                        ? lastElementRef
                        : null
                    }
                    key={noti._id}
                  >
                    <NotificationItem
                      notification={noti}
                      onNotificationClick={handleNotificationClick}
                    />
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          {isLoading && currentPage > 0 && currentList.length > 0 && (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          )}

          {/* Thay thế nút "Xem thêm" bằng logic infinite scroll */}
          {/* Nút "Xem thêm" đã được loại bỏ để thay bằng infinite scroll (lastElementRef) */}
        </div>
      </div>
    </main>
  );
}

export default NotificationListPage;
