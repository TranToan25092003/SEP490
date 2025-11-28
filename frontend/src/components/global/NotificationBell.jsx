import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { customFetch } from "@/utils/customAxios";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell,
  BellRing,
  CalendarCheck,
  CalendarX,
  MessageSquareWarning,
  MessageCircle,
  Wrench,
  DollarSign,
  Flag,
  Megaphone,
  Info,
  FileText,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { io } from "socket.io-client";

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

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
  autoConnect: false,
  path: import.meta.env.VITE_SOCKET_PATH || "/socket.io",
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
      IconComponent = Flag;
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

// Component con cho danh sách thông báo
const NotificationList = ({
  notifications = [],
  isLoading,
  onNotificationClick,
}) => {
  if (isLoading) {
    return <p className="p-4 text-center text-sm text-gray-500">Đang tải...</p>;
  }
  if (notifications.length === 0) {
    return (
      <p className="p-4 text-center text-sm text-gray-500">
        Không có thông báo nào.
      </p>
    );
  }
  return notifications.map((noti) => (
    <DropdownMenuItem
      key={noti._id}
      className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors ${
        !noti.isRead ? "bg-rose-50 text-rose-900" : "bg-white"
      }`}
      onClick={() => onNotificationClick(noti)}
    >
      <NotificationIcon type={noti.type} />

      <div className="flex-1">
        <p className="text-sm leading-snug" style={{ whiteSpace: "normal" }}>
          <span className="font-bold">{noti.title}</span> - {noti.message}
        </p>
        <span
          className={`text-xs ${
            !noti.isRead ? "text-rose-600" : "text-gray-500"
          }`}
        >
          {timeAgo(noti.createdAt)}
        </span>
      </div>
      {!noti.isRead && (
        <div className="h-3 w-3 rounded-full bg-rose-500 self-center flex-shrink-0"></div>
      )}
    </DropdownMenuItem>
  ));
};

function NotificationBell() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [allNotifications, setAllNotifications] = useState({
    list: [],
    page: 1,
    totalPages: 1,
  });
  const [unreadNotifications, setUnreadNotifications] = useState({
    list: [],
    page: 1,
    totalPages: 1,
  });

  const [activeTab, setActiveTab] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const initialFetchDone = useRef(false);
  const markAllPendingRef = useRef(false);

  useEffect(() => {
    if (userId) {
      if (!socket.connected) socket.connect();

      const onConnect = () => {
        console.log(
          "[NotificationBell] Socket connected, joining room:",
          userId
        );
        socket.emit("joinRoomNotification", userId);
      };
      socket.on("connect", onConnect);

      const handleNewNotification = (newNotification) => {
        setAllNotifications((prev = { list: [], page: 1, totalPages: 1 }) => ({
          ...prev,
          list: [newNotification, ...(prev.list || [])],
        }));
        setUnreadNotifications(
          (prev = { list: [], page: 1, totalPages: 1 }) => ({
            ...prev,
            list: [newNotification, ...(prev.list || [])],
          })
        );
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

  useEffect(() => {
    if (!userId || initialFetchDone.current) return;
    console.log("[NotificationBell] Initializing for user:", userId);
    const fetchInitialData = async () => {
      try {
        const res = await customFetch.get("/notifications/unread-count");
        if (res.data.success) {
          console.log(
            "[NotificationBell] Initial unread count:",
            res.data.data.unreadCount
          );
          setUnreadCount(res.data.data.unreadCount);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchInitialData();
    initialFetchDone.current = true;
  }, [userId]);

  const fetchNotifications = async (tab, pageNum = 1) => {
    if (isLoading) return;
    setIsLoading(true);
    console.log("[NotificationBell] Fetching notifications", {
      userId,
      tab,
      pageNum,
    });

    let query = `/notifications?page=${pageNum}&limit=5`;
    if (tab === "unread") {
      query += "&isRead=false";
    }

    try {
      const res = await customFetch.get(query);
      if (res.data.success) {
        const { data, pagination } = res.data;
        const resolvedData = Array.isArray(data) ? data : [];
        console.log(
          "[NotificationBell] Fetch success",
          tab,
          "page",
          pageNum,
          "items",
          resolvedData.length
        );
        const newState = {
          list:
            pageNum === 1
              ? resolvedData
              : [
                  ...(tab === "all"
                    ? allNotifications.list
                    : unreadNotifications.list),
                  ...resolvedData,
                ],
          page: pagination.currentPage,
          totalPages: pagination.totalPages,
        };

        if (tab === "all") {
          setAllNotifications(newState);
        } else {
          setUnreadNotifications(newState);
        }
      }
    } catch {
      console.error("[NotificationBell] Fetch notifications failed");
      toast.error("Lỗi", { description: "Không thể tải thông báo." });
    } finally {
      setIsLoading(false);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (markAllPendingRef.current) return;
    markAllPendingRef.current = true;
    try {
      await customFetch.patch("/notifications/mark-all-as-read");
      setAllNotifications((prev = { list: [], page: 1, totalPages: 1 }) => ({
        ...prev,
        list: (prev.list || []).map((n) => ({ ...n, isRead: true })),
      }));
      setUnreadNotifications({ list: [], page: 1, totalPages: 1 });
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      markAllPendingRef.current = false;
    }
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) {
      if (allNotifications.list.length === 0) {
        console.log("[NotificationBell] Dropdown opened, trigger fetch");
        fetchNotifications("all", 1);
      }
      if (unreadCount > 0) {
        markAllNotificationsAsRead();
      }
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === "all" && allNotifications.list.length === 0) {
      fetchNotifications("all", 1);
    } else if (newTab === "unread" && unreadNotifications.list.length === 0) {
      fetchNotifications("unread", 1);
    }
  };

  const handleLoadMore = (e) => {
    e.preventDefault();
    if (
      activeTab === "all" &&
      allNotifications.page < allNotifications.totalPages
    ) {
      fetchNotifications("all", allNotifications.page + 1);
    } else if (
      activeTab === "unread" &&
      unreadNotifications.page < unreadNotifications.totalPages
    ) {
      fetchNotifications("unread", unreadNotifications.page + 1);
    }
  };

  const handleNotificationClick = async (notification) => {
    navigate(notification.linkTo || "/");
    setIsOpen(false);

    if (!notification.isRead) {
      try {
        await customFetch.patch("/notifications/mark-as-read", {
          notificationIds: [notification._id],
        });
        setAllNotifications((prev = { list: [] }) => ({
          ...prev,
          list: (prev.list || []).map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          ),
        }));
        setUnreadNotifications((prev = { list: [] }) => ({
          ...prev,
          list: (prev.list || []).filter((n) => n._id !== notification._id),
        }));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  const currentPage =
    activeTab === "all" ? allNotifications.page : unreadNotifications.page;
  const currentTotalPages =
    activeTab === "all"
      ? allNotifications.totalPages
      : unreadNotifications.totalPages;

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 text-gray-900 hover:text-gray-900"
        >
          {unreadCount > 0 ? (
            <>
              <BellRing
                strokeWidth={1.4}
                className="text-rose-700 size-[24px] md:size-[28px] lg:size-[32px]"
              />
              <Badge
                className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 justify-center rounded-full p-1 text-[10px] md:text-xs shadow shadow-rose-400"
                variant="destructive"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell
              strokeWidth={1.4}
              className="text-gray-900 size-[24px] md:size-[28px] lg:size-[32px]"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 md:w-96 border border-rose-100 shadow-2xl"
        align="end"
        sideOffset={10}
      >
        <DropdownMenuLabel className="flex justify-between items-center px-3 py-2 text-rose-600">
          <span className="text-xl font-semibold tracking-tight">
            Thông báo
          </span>
          <Link
            to="/notifications"
            className="text-sm font-medium text-rose-600 hover:text-rose-700 underline-offset-2"
            onClick={() => setIsOpen(false)}
          >
            Xem tất cả
          </Link>
        </DropdownMenuLabel>

        <Tabs
          defaultValue="all"
          onValueChange={handleTabChange}
          className="p-2"
        >
          <div className="px-1">
            <TabsList className="grid w-full grid-cols-2 p-1 rounded-full">
              <TabsTrigger
                value="all"
                className="rounded-full text-sm data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-inner transition-colors"
              >
                Tất cả
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="rounded-full text-sm data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-inner transition-colors"
              >
                Chưa đọc
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-96 overflow-y-auto mt-2 space-y-2">
            <TabsContent value="all" className="m-0">
              <NotificationList
                notifications={allNotifications.list}
                isLoading={isLoading && allNotifications.list.length === 0}
                onNotificationClick={handleNotificationClick}
              />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <NotificationList
                notifications={unreadNotifications.list}
                isLoading={isLoading && unreadNotifications.list.length === 0}
                onNotificationClick={handleNotificationClick}
              />
            </TabsContent>
          </div>
        </Tabs>

        {currentPage < currentTotalPages && (
          <div className="p-2 border-t mt-2 border-rose-100">
            <Button
              variant="link"
              className="w-full text-rose-600"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? "Đang tải..." : "Xem thêm"}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
