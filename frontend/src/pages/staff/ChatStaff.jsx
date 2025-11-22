import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { initializeSocket } from "@/utils/socket";
import MentionInput from "@/components/chat/MentionInput";
import { renderMessageWithMentions } from "@/utils/mentionParser";
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Filter,
  Image,
  Package,
  X,
} from "lucide-react";

// Mock data removed - using real-time socket data

export default function ChatStaff() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState({}); // { customerId: [messages] }
  const [newMessage, setNewMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const seenMessageIdsRef = useRef(new Map());
  const localStoreKey = (cid) => `staff_chat_${cid}`;

  // Handle product click from mention
  const handleProductClick = (productId) => {
    navigate(`/items/${productId}`);
  };

  // Initialize socket connection - only run once on mount
  useEffect(() => {
    // Initialize socket connection
    const socketInstance = initializeSocket();
    setSocket(socketInstance);

    // Function to check and update connection status
    const checkConnection = () => {
      const connected = socketInstance.connected;
      setIsConnected(connected);
      if (connected) {
        // Join staff room if connected
        socketInstance.emit("joinRoom", {
          room: "staff_room",
          userId: "staff_user",
          userType: "staff",
        });
      } else {
        // If not connected, try to connect
        socketInstance.connect();
      }
    };

    // Check connection status immediately
    checkConnection();

    // Check connection when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab is now visible, check connection
        setTimeout(() => {
          checkConnection();
        }, 100);
      }
    };

    // Check connection when window gets focus
    const handleFocus = () => {
      setTimeout(() => {
        checkConnection();
      }, 100);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Socket event listeners
    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to chat server");
      // Join staff room after connection is established
      socketInstance.emit("joinRoom", {
        room: "staff_room",
        userId: "staff_user",
        userType: "staff",
      });
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from chat server");
    });

    socketInstance.on("reconnect", () => {
      setIsConnected(true);
      console.log("Reconnected to chat server");
      // Rejoin staff room after reconnection
      socketInstance.emit("joinRoom", {
        room: "staff_room",
        userId: "staff_user",
        userType: "staff",
      });
    });

    // Receive active customers list when staff connects
    socketInstance.on("activeCustomers", (customersList) => {
      const formattedCustomers = customersList.map((c) => ({
        id: c.customerId,
        name: c.name,
        avatar: "/api/placeholder/40/40",
        lastMessage: "",
        lastMessageTime: new Date(c.lastSeen).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        unreadCount: 0,
        status: "online",
        vehicleInfo: c.userType === "guest" ? "Khách vãng lai" : "",
      }));
      setCustomers(formattedCustomers);
    });

    // Receive new customer notification
    socketInstance.on("newCustomer", (customer) => {
      setCustomers((prev) => {
        const exists = prev.find((c) => c.id === customer.customerId);
        if (exists) return prev;
        return [
          {
            id: customer.customerId,
            name: customer.name,
            avatar: "/api/placeholder/40/40",
            lastMessage: "",
            lastMessageTime: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unreadCount: 0,
            status: "online",
            vehicleInfo: customer.userType === "guest" ? "Khách vãng lai" : "",
          },
          ...prev,
        ];
      });
    });

    // Receive new message from any customer (de-duplicate by id)
    socketInstance.on("newMessage", (data) => {
      const { customerId, ...message } = data;

      const seenSet = seenMessageIdsRef.current.get(customerId) || new Set();
      if (message.id && seenSet.has(message.id)) {
        return;
      }
      if (message.id) {
        seenSet.add(message.id);
        seenMessageIdsRef.current.set(customerId, seenSet);
      }

      // Update messages for this customer
      setMessages((prev) => {
        const customerMessages = prev[customerId] || [];
        const next = {
          ...prev,
          [customerId]: [...customerMessages, message],
        };
        // persist to localStorage
        try {
          localStorage.setItem(
            localStoreKey(customerId),
            JSON.stringify(next[customerId])
          );
        } catch (error) {
          // Ignore localStorage errors
          console.warn("Failed to save message to localStorage:", error);
        }
        return next;
      });

      // Update customer's last message and time
      setCustomers((prev) =>
        prev.map((customer) => {
          if (customer.id === customerId) {
            return {
              ...customer,
              lastMessage:
                message.content ||
                (message.type === "image" ? "Đã gửi ảnh" : ""),
              lastMessageTime: message.timestamp,
              unreadCount:
                customer.id === selectedCustomer?.id
                  ? customer.unreadCount
                  : customer.unreadCount + 1,
            };
          }
          return customer;
        })
      );

      // Scroll if this is the selected customer
      if (selectedCustomer?.id === customerId) {
        setTimeout(() => scrollToBottom(), 100);
      }
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

    // Receive chat history when joining a chat room
    socketInstance.on("chatHistory", ({ customerId: cid, messages: list }) => {
      if (!cid || !Array.isArray(list)) return;
      setMessages((prev) => {
        const next = { ...prev, [cid]: list };
        try {
          localStorage.setItem(localStoreKey(cid), JSON.stringify(list));
        } catch (error) {
          // Ignore localStorage errors
          console.warn("Failed to save chat history to localStorage:", error);
        }
        return next;
      });
      if (selectedCustomer?.id === cid) {
        setTimeout(() => scrollToBottom(), 100);
      }
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("reconnect");
      socketInstance.off("newMessage");
      socketInstance.off("activeCustomers");
      socketInstance.off("newCustomer");
      socketInstance.off("customerOffline");
      socketInstance.off("chatHistory");
    };
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer && socket) {
      // Reset unread count when viewing
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === selectedCustomer.id
            ? { ...customer, unreadCount: 0 }
            : customer
        )
      );

      // Join customer chat room
      socket.emit("joinRoom", {
        room: `chat_${selectedCustomer.id}`,
        userId: "staff_user",
        userType: "staff",
      });

      // Bootstrap messages from localStorage for immediate UX
      try {
        const cached = JSON.parse(
          localStorage.getItem(localStoreKey(selectedCustomer.id)) || "[]"
        );
        if (Array.isArray(cached) && cached.length > 0) {
          setMessages((prev) => ({ ...prev, [selectedCustomer.id]: cached }));
        }
      } catch (error) {
        // Ignore localStorage errors
        console.warn("Failed to load messages from localStorage:", error);
      }

      setTimeout(() => scrollToBottom(), 100);
    }
  }, [selectedCustomer, socket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedCustomer || !socket)
      return;

    const message = {
      id: Date.now().toString(),
      senderId: "staff",
      senderName: "Kỹ thuật viên",
      content: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: selectedImage ? "image" : "text",
      image: selectedImage,
    };

    // Send message via socket
    socket.emit("sendMessage", {
      customerId: selectedCustomer.id,
      message: message,
    });

    // Clear input; rely on server echo to append to list (avoids duplicates)
    setNewMessage("");
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    scrollToBottom();
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage({
          file: file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleSendProduct = (product) => {
    if (!selectedCustomer || !socket) return;

    const message = {
      id: Date.now().toString(),
      senderId: "staff",
      senderName: "Kỹ thuật viên",
      content: `Gợi ý sản phẩm: ${product.name}`,
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "product",
      product: {
        name: product.name,
        price: product.price,
        link: product.link || `/items/${product.id}`,
        id: product.id,
      },
    };

    // Send message via socket
    socket.emit("sendMessage", {
      customerId: selectedCustomer.id,
      message: message,
    });

    // Add to local state
    setMessages((prev) => {
      const customerMessages = prev[selectedCustomer.id] || [];
      return {
        ...prev,
        [selectedCustomer.id]: [...customerMessages, message],
      };
    });

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
            (messages[selectedCustomer.id] || []).map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === "staff" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === "staff"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {message.type === "image" && message.image && (
                    <div className="mb-2">
                      <img
                        src={message.image.preview || message.image}
                        alt={message.image.name || "Image"}
                        className="max-w-full h-auto rounded-lg"
                        style={{ maxHeight: "200px" }}
                      />
                    </div>
                  )}
                  {message.type === "product" && message.product && (
                    <div className="mb-2 p-2 bg-white/10 rounded border border-white/20">
                      <p className="font-semibold text-sm mb-1">
                        {message.product.name}
                      </p>
                      {message.product.price && (
                        <p className="text-xs opacity-90">
                          {message.product.price}
                        </p>
                      )}
                      {message.product.link && (
                        <a
                          href={message.product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline opacity-90"
                        >
                          Xem chi tiết
                        </a>
                      )}
                    </div>
                  )}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {renderMessageWithMentions(
                        message.content,
                        handleProductClick
                      )}
                    </p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === "staff"
                        ? "text-red-100"
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
          {/* Selected Image Preview */}
          {selectedImage && (
            <div className="mb-3 p-3 bg-gray-100 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedImage.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {selectedImage.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedImage.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeSelectedImage}
                  className="h-6 w-6 text-gray-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Image upload button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 text-gray-500 hover:text-blue-500"
              disabled={!isConnected || !selectedCustomer}
            >
              <Image className="h-4 w-4" />
            </Button>

            <MentionInput
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                selectedCustomer
                  ? "Nhập tin nhắn... (gõ @ để tìm sản phẩm)"
                  : "Chưa chọn khách hàng"
              }
              className="flex-1"
              disabled={!isConnected || !selectedCustomer}
            />
            <Button
              onClick={handleSendMessage}
              disabled={
                (!newMessage.trim() && !selectedImage) ||
                !isConnected ||
                !selectedCustomer
              }
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
