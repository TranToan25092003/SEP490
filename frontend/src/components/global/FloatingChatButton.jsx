import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, X, Minimize2, MessageCircle, Image } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { initializeSocket } from "@/utils/socket";

// Chat icon SVG component
const ChatIcon = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 13C19 13.5304 18.7893 14.0391 18.4142 14.4142C18.0391 14.7893 17.5304 15 17 15H5L1 19V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H17C17.5304 1 18.0391 1.21071 18.4142 1.58579C18.7893 1.96086 19 2.46957 19 3V13Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Mock staff data
const mockStaff = {
  id: "staff_001",
  name: "Nhân viên hỗ trợ",
  avatar: "/api/placeholder/40/40",
  status: "online",
  department: "Hỗ trợ khách hàng",
};

// Mock messages
const mockMessages = [
  {
    id: "1",
    senderId: "staff",
    senderName: "Nhân viên hỗ trợ",
    content: "Xin chào! Tôi có thể giúp gì cho bạn?",
    timestamp: "10:00",
    type: "text",
  },
  {
    id: "2",
    senderId: "customer",
    senderName: "Khách hàng",
    content: "Tôi muốn hỏi về dịch vụ sửa chữa xe",
    timestamp: "10:05",
    type: "text",
  },
];

const FloatingChatButton = () => {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    // Determine identity (clerk or guest)
    let id = null;
    let name = "";
    if (isSignedIn && user?.id) {
      id = user.id;
      name = user.firstName || user.username || "Khách hàng";
    } else {
      try {
        id = localStorage.getItem("guest_id");
        let guestNumber = parseInt(localStorage.getItem("guest_number") || "0");
        if (!id) {
          guestNumber = guestNumber + 1;
          id = `guest_${guestNumber}_${Date.now()}`;
          localStorage.setItem("guest_id", id);
          localStorage.setItem("guest_number", guestNumber.toString());
        }
        name = `Guest ${guestNumber || 1}`;
      } catch {}
    }
    setCustomerId(id);
    setCustomerName(name);

    // Initialize socket connection
    const socketInstance = initializeSocket();
    setSocket(socketInstance);

    // Join per-customer room
    socketInstance.emit("joinRoom", {
      room: `chat_${id}`,
      userId: id,
      userType: "customer",
      customerName: name,
    });

    // Socket event listeners
    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("newMessage", (message) => {
      setMessages((prev) => {
        const next = [...prev, message];
        try {
          localStorage.setItem(`chat_${id}`, JSON.stringify(next));
        } catch {}
        return next;
      });
      scrollToBottom();
    });

    socketInstance.on("chatHistory", ({ customerId: cid, messages: list }) => {
      if (!cid || !Array.isArray(list)) return;
      setMessages(list);
      try { localStorage.setItem(`chat_${cid}`, JSON.stringify(list)); } catch {}
      scrollToBottom();
    });

    return () => {
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("newMessage");
      socketInstance.off("chatHistory");
    };
  }, [isSignedIn, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if ((!newMessage.trim() && !selectedImage) || !socket || !customerId) return;

    const message = {
      id: Date.now().toString(),
      senderId: "customer",
      senderName: customerName || (user?.firstName || "Khách hàng"),
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
      customerId: customerId,
      message: message,
    });

    // Clear inputs; rely on server echo (avoids duplicates)
    setNewMessage("");
    setSelectedImage(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
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

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Bootstrap cached history for immediate UX
  useEffect(() => {
    try {
      if (!customerId) return;
      const cached = JSON.parse(localStorage.getItem(`chat_${customerId}`) || "[]");
      if (Array.isArray(cached) && cached.length > 0) setMessages(cached);
    } catch {}
  }, [customerId]);

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-30 right-6 z-50">
        {/* Shake animation wrapper */}
        {!isOpen && !isMinimized && (
          <>
            <div className="animate-bounce">
              <Button
                onClick={toggleChat}
                className="relative h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
                size="icon"
              >
                <ChatIcon className="w-7 h-7 text-primary-foreground" />
              </Button>
            </div>
          </>
        )}
        {/* Normal button when chat is open or minimized */}
        {isOpen && !isMinimized && (
          <Button
            onClick={toggleChat}
            className="relative h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
            size="icon"
          >
            <ChatIcon className="w-7 h-7 text-primary-foreground" />
          </Button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-48 right-6 z-50 w-80 h-[500px] animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="h-full flex flex-col bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-primary-foreground/20">
                      <AvatarImage
                        src={mockStaff.avatar}
                        alt={mockStaff.name}
                      />
                      <AvatarFallback className="bg-primary-foreground text-primary font-semibold">
                        {mockStaff.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-primary-foreground"></div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-primary-foreground">
                      {mockStaff.name}
                    </h3>
                    <p className="text-xs text-primary-foreground/90">
                      {mockStaff.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={minimizeChat}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeChat}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === "customer"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                        message.senderId === "customer"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-background text-foreground border border-border rounded-bl-md shadow-sm"
                      }`}
                    >
                      {message.type === "image" && message.image && (
                        <div className="mb-2">
                          <img
                            src={message.image.preview}
                            alt={message.image.name}
                            className="max-w-full h-auto rounded-lg"
                            style={{ maxHeight: "200px" }}
                          />
                        </div>
                      )}
                      {message.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                      <p
                        className={`text-xs mt-2 ${
                          message.senderId === "customer"
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 p-4 bg-background border-t border-border">
                {/* Selected Image Preview */}
                {selectedImage && (
                  <div className="mb-3 p-3 bg-muted rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedImage.preview}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground truncate max-w-32">
                            {selectedImage.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedImage.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removeSelectedImage}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn..."
                      className="w-full pr-12 py-3 rounded-full border-border focus:border-primary focus:ring-primary/20 focus:outline-none"
                      disabled={false}
                      autoComplete="off"
                    />
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Image selection button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200"
                    disabled={!isConnected}
                  >
                    <Image className="h-4 w-4" />
                  </Button>

                  {/* Send button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      (!newMessage.trim() && !selectedImage) || !isConnected
                    }
                    size="icon"
                    className="h-10 w-10 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {!isConnected && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
                    <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                    <span>Đang kết nối...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimized Chat */}
      {isMinimized && (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div
            className="w-72 bg-background rounded-2xl shadow-xl border border-border cursor-pointer hover:shadow-2xl transition-all duration-200"
            onClick={() => setIsMinimized(false)}
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarImage src={mockStaff.avatar} alt={mockStaff.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {mockStaff.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {mockStaff.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nhấn để mở chat
                  </p>
                </div>
                <div className="text-primary">
                  <MessageCircle className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatButton;
