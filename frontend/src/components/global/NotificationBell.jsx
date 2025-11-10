import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { customFetch } from '@/utils/customAxios';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Check,
  CalendarCheck,
  MessageSquareWarning,
  Wrench,
  DollarSign,
  Flag,
  Megaphone,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
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

const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false
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

    case "COMPLAINT_REPLIED":
    case "NEW_COMPLAINT_RECEIVED":
      IconComponent = MessageSquareWarning;
      iconColor = "bg-red-500";
      break;

    case "MAINTENANCE_REMINDER":
      IconComponent = Wrench;
      iconColor = "bg-yellow-500";
      break;

    case "PAYMENT_SUCCESSFUL":
      IconComponent = DollarSign;
      iconColor = "bg-green-500";
      break;

    case "STOCK_LEVEL_LOW":
      IconComponent = Flag;
      iconColor = "bg-orange-500";
      break;

    case "GENERAL_ANNOUNCEMENT":
      IconComponent = Megaphone;
      iconColor = "bg-indigo-500";
      break;

    default:
      IconComponent = Info;
      iconColor = "bg-gray-500";
  }

  return (
    <div className={`h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center ${iconColor}`}>
      <IconComponent className="h-6 w-6 text-white" />
    </div>
  );
};


// Component con cho danh sách thông báo
const NotificationList = ({ notifications, isLoading, onNotificationClick }) => {
  if (isLoading) {
    return <p className="p-4 text-center text-sm text-gray-500">Đang tải...</p>;
  }
  if (notifications.length === 0) {
    return <p className="p-4 text-center text-sm text-gray-500">Không có thông báo nào.</p>;
  }
  return notifications.map((noti) => (
    <DropdownMenuItem
      key={noti._id}
      className={`flex items-center gap-3 p-3 cursor-pointer ${!noti.isRead ? 'bg-blue-50' : 'bg-white'}`}
      onClick={() => onNotificationClick(noti)}
    >
      <NotificationIcon type={noti.type} />

      <div className="flex-1">
        <p className="text-sm leading-snug" style={{ whiteSpace: 'normal' }}>
          <span className="font-bold">{noti.title}</span> - {noti.message}
        </p>
        <span className={`text-xs ${!noti.isRead ? 'text-blue-600' : 'text-gray-500'}`}>
          {timeAgo(noti.createdAt)}
        </span>
      </div>
      {!noti.isRead && (
        <div className="h-3 w-3 rounded-full bg-blue-500 self-center flex-shrink-0"></div>
      )}
    </DropdownMenuItem>
  ));
};


function NotificationBell() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [allNotifications, setAllNotifications] = useState({ list: [], page: 1, totalPages: 1 });
  const [unreadNotifications, setUnreadNotifications] = useState({ list: [], page: 1, totalPages: 1 });

  const [activeTab, setActiveTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);


  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (userId) {
      if (!socket.connected) socket.connect();

      const onConnect = () => {
        console.log("Socket connected, joining room:", userId);
        socket.emit("joinRoomNotification", userId);
      };
      socket.on("connect", onConnect);

      const handleNewNotification = (newNotification) => {
        setAllNotifications(prev => ({ ...prev, list: [newNotification, ...prev.list] }));
        setUnreadNotifications(prev => ({ ...prev, list: [newNotification, ...prev.list] }));
        setUnreadCount(prev => prev + 1);
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

    const fetchInitialData = async () => {
      try {
        const res = await customFetch.get('/notifications/unread-count');
        if (res.data.success) {
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

    let query = `/notifications?page=${pageNum}&limit=5`;
    if (tab === 'unread') {
      query += "&isRead=false";
    }

    try {
      const res = await customFetch.get(query);
      if (res.data.success) {
        const { data, pagination } = res.data;
        const newState = {
          list: pageNum === 1 ? data : [...(tab === 'all' ? allNotifications.list : unreadNotifications.list), ...data],
          page: pagination.currentPage,
          totalPages: pagination.totalPages,
        };

        if (tab === 'all') {
          setAllNotifications(newState);
        } else {
          setUnreadNotifications(newState);
        }
      }
    } catch (error) {
      toast.error("Lỗi", { description: "Không thể tải thông báo." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open && allNotifications.list.length === 0) {
      fetchNotifications('all', 1);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'all' && allNotifications.list.length === 0) {
      fetchNotifications('all', 1);
    } else if (newTab === 'unread' && unreadNotifications.list.length === 0) {
      fetchNotifications('unread', 1);
    }
  };

  const handleLoadMore = (e) => {
    e.preventDefault();
    if (activeTab === 'all' && allNotifications.page < allNotifications.totalPages) {
      fetchNotifications('all', allNotifications.page + 1);
    } else if (activeTab === 'unread' && unreadNotifications.page < unreadNotifications.totalPages) {
      fetchNotifications('unread', unreadNotifications.page + 1);
    }
  };

  const handleNotificationClick = async (notification) => {
    navigate(notification.linkTo || '/');
    setIsOpen(false);

    if (!notification.isRead) {
      try {
        await customFetch.patch('/notifications/mark-as-read', {
          notificationIds: [notification._id]
        });
        setAllNotifications(prev =>
          prev.list.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
        setUnreadNotifications(prev =>
          prev.list.filter(n => n._id !== notification._id)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  const currentList = activeTab === 'all' ? allNotifications.list : unreadNotifications.list;
  const currentPage = activeTab === 'all' ? allNotifications.page : unreadNotifications.page;
  const currentTotalPages = activeTab === 'all' ? allNotifications.totalPages : unreadNotifications.totalPages;

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-7 w-7 md:h-8 md:w-8" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-1 text-xs" variant="destructive">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-7 w-7 md:h-8 md:w-8" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end" sideOffset={10}>
        <DropdownMenuLabel className="flex justify-between items-center">
          <span className="text-xl font-bold">Thông báo</span>
          <Link
            to="/notifications"
            className="text-sm font-medium text-blue-600 hover:underline"
            onClick={() => setIsOpen(false)}
          >
            Xem tất cả
          </Link>
        </DropdownMenuLabel>

        <Tabs defaultValue="all" onValueChange={handleTabChange} className="p-2">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="rounded-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
            >
              Tất cả
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="rounded-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
            >
              Chưa đọc
            </TabsTrigger>
          </TabsList>

          <div className="max-h-96 overflow-y-auto mt-2">
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
          <div className="p-2 border-t mt-2">
            <Button variant="link" className="w-full" onClick={handleLoadMore} disabled={isLoading}>
              {isLoading ? "Đang tải..." : "Xem thêm"}
            </Button>
          </div>
        )}

      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;