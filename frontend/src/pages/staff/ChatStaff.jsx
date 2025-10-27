import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { initializeSocket } from "@/utils/socket";
import { Send, Phone, Video, MoreVertical, Search, Filter } from "lucide-react";

// Mock data for customers
const mockCustomers = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Xe tôi có vấn đề gì không ạ?",
    lastMessageTime: "10:30",
    unreadCount: 2,
    status: "online",
    bookingId: "BK001",
    vehicleInfo: "Honda Wave RSX 2023",
  },
  {
    id: "2",
    name: "Trần Thị B",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Cảm ơn anh, xe chạy tốt rồi",
    lastMessageTime: "09:15",
    unreadCount: 0,
    status: "offline",
    bookingId: "BK002",
    vehicleInfo: "Yamaha Exciter 2022",
  },
  {
    id: "3",
    name: "Lê Văn C",
    avatar: "/api/placeholder/40/40",
    lastMessage: "Khi nào có thể lấy xe ạ?",
    lastMessageTime: "08:45",
    unreadCount: 1,
    status: "online",
    bookingId: "BK003",
    vehicleInfo: "Suzuki Raider 2023",
  },
];

// Mock messages for selected customer
const mockMessages = {
  1: [
    {
      id: "1",
      senderId: "customer",
      senderName: "Nguyễn Văn A",
      content: "Chào anh, xe tôi có vấn đề gì không ạ?",
      timestamp: "10:25",
      type: "text",
    },
    {
      id: "2",
      senderId: "staff",
      senderName: "Kỹ thuật viên",
      content:
        "Chào anh! Tôi đang kiểm tra xe của anh. Có vẻ như phanh trước cần thay mới.",
      timestamp: "10:28",
      type: "text",
    },
    {
      id: "3",
      senderId: "customer",
      senderName: "Nguyễn Văn A",
      content: "Vậy chi phí thay phanh là bao nhiêu ạ?",
      timestamp: "10:30",
      type: "text",
    },
  ],
};

export default function ChatStaff() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = initializeSocket();
    setSocket(socketInstance);
    setCustomers(mockCustomers);

    // Join staff room
    socketInstance.emit("joinRoom", {
      room: "staff_room",
      userId: "staff_user",
      userType: "staff",
    });

    // Socket event listeners
    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to chat server");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from chat server");
    });

    socketInstance.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socketInstance.on("customerOnline", (customerId) => {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === customerId
            ? { ...customer, status: "online" }
            : customer
        )
      );
    });

    socketInstance.on("customerOffline", (customerId) => {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === customerId
            ? { ...customer, status: "offline" }
            : customer
        )
      );
    });

    return () => {
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("newMessage");
      socketInstance.off("customerOnline");
      socketInstance.off("customerOffline");
    };
  }, []);

  useEffect(() => {
    if (selectedCustomer && socket) {
      setMessages(mockMessages[selectedCustomer.id] || []);

      // Join customer chat room
      socket.emit("joinRoom", {
        room: `chat_${selectedCustomer.id}`,
        userId: "staff_user",
        userType: "staff",
      });
    }
  }, [selectedCustomer, socket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedCustomer || !socket) return;

    const message = {
      id: Date.now().toString(),
      senderId: "staff",
      senderName: "Kỹ thuật viên",
      content: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "text",
    };

    // Send message via socket
    socket.emit("sendMessage", {
      customerId: selectedCustomer.id,
      message: message,
    });

    // Add to local state
    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    scrollToBottom();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-80px)] flex bg-gray-50 overflow-hidden">
      {/* Sidebar - Customer List */}
      <div className="w-80 min-w-80 max-w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tin nhắn</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <Input
            placeholder="Tìm kiếm khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedCustomer?.id === customer.id
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={customer.avatar} alt={customer.name} />
                    <AvatarFallback>
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {customer.status === "online" && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {customer.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {customer.lastMessageTime}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-1">
                    {customer.vehicleInfo}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate">
                      {customer.lastMessage}
                    </p>
                    {customer.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {customer.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        {selectedCustomer ? (
          <div className="shrink-0 bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.name}
                  />
                  <AvatarFallback>
                    {selectedCustomer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedCustomer.vehicleInfo} •{" "}
                    {selectedCustomer.bookingId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="shrink-0 bg-white border-b border-gray-200 p-4 text-gray-500">
            Chưa chọn khách hàng
          </div>
        )}

        {/* Vùng chat (cuộn được) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
          {selectedCustomer ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === "staff" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === "staff"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === "staff"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chọn khách hàng để bắt đầu trò chuyện
                </h3>
                <p>Chọn một khách hàng từ danh sách bên trái</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - luôn cố định */}
        <div className="shrink-0 bg-white border-t border-gray-200 p-4 sticky bottom-0">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedCustomer ? "Nhập tin nhắn..." : "Chưa chọn khách hàng"
              }
              className="flex-1"
              disabled={!isConnected || !selectedCustomer}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected || !selectedCustomer}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {!isConnected && (
            <p className="text-xs text-red-500 mt-2">Đang kết nối lại...</p>
          )}
        </div>
      </div>
    </div>
  );
}
