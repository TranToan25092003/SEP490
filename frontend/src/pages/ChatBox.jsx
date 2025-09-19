import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useUser, useAuth, SignInButton } from "@clerk/clerk-react";
import { getUserInformation } from "@/API/duc.api/user.api";
import {
  Input,
  Button,
  Avatar,
  Spin,
  message,
  Upload,
  Tooltip,
  Result,
} from "antd";
import {
  SendOutlined,
  PictureOutlined,
  CheckCircleFilled,
  ArrowLeftOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { initializeSocket } from "@/utils/socket";
import { uploadImage } from "@/utils/uploadCloudinary";

const ChatBox = () => {
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get("seller");
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sellerInfo, setSellerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const messagesRef = useRef(new Set()); // Track message IDs to prevent duplicates

  // Fetch seller information
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchSellerInfo = async () => {
      try {
        console.log("Fetching seller info for:", sellerId);
        const info = await getUserInformation(sellerId);
        console.log("Seller info:", info);
        setSellerInfo(info);
      } catch (error) {
        console.error("Error fetching seller info:", error);
        message.error("Could not load seller information");
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchSellerInfo();
    } else {
      console.error("No seller ID provided");
      message.error("No seller ID provided");
      setLoading(false);
    }
  }, [sellerId, isSignedIn]);

  // Initialize socket connection
  useEffect(() => {
    if (!isSignedIn || !user || !sellerId) {
      return;
    }

    console.log("Initializing socket connection...");
    const socketInstance = initializeSocket();
    socketRef.current = socketInstance;

    // Join chat room
    const roomId = [user.id, sellerId].sort().join("-");
    console.log("Joining chat room:", roomId);
    socketInstance.emit("joinChat", roomId);

    // Listen for new messages
    socketInstance.on("newMessage", (message) => {
      console.log("Received new message:", message);
      // Check if we've already added this message to avoid duplicates
      const messageId = `${message.senderId}-${message.timestamp}`;
      if (!messagesRef.current.has(messageId)) {
        messagesRef.current.add(messageId);
        setMessages((prev) => [...prev, message]);
      }
    });

    // Listen for message read status updates
    socketInstance.on("messagesRead", ({ userId }) => {
      if (userId === user.id) {
        // The other person has read our messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === user.id ? { ...msg, seen: true } : msg
          )
        );
      }
    });

    // Load previous messages
    console.log("Loading previous messages for room:", roomId);
    socketInstance.emit("loadMessages", roomId, (loadedMessages) => {
      console.log("Loaded messages:", loadedMessages);
      if (loadedMessages && !loadedMessages.error) {
        // Add all loaded messages to our tracking set
        loadedMessages.forEach((msg) => {
          const messageId = `${msg.senderId}-${msg.timestamp}`;
          messagesRef.current.add(messageId);
        });
        setMessages(loadedMessages);

        // Mark messages as read when loading them
        socketInstance.emit("markAsRead", { roomId, userId: user.id });
      } else {
        setMessages([]);
      }
    });

    // Socket connection events
    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      message.success("Connected to chat server");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      message.error("Failed to connect to chat server");
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
      message.error("Chat error occurred");
    });

    return () => {
      console.log("Cleaning up socket connection...");
      if (socketRef.current) {
        socketRef.current.off("newMessage");
        socketRef.current.off("messagesRead");
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.off("error");
        const roomId = [user.id, sellerId].sort().join("-");
        socketRef.current.emit("leaveChat", roomId);
      }
    };
  }, [user, sellerId, isSignedIn, sellerInfo]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when user is active in chat
  useEffect(() => {
    if (!isSignedIn || !socketRef.current || !user || !sellerId) return;

    const roomId = [user.id, sellerId].sort().join("-");
    socketRef.current.emit("markAsRead", { roomId, userId: user.id });

    // Set up a timer to periodically mark messages as read while the user is active
    const interval = setInterval(() => {
      socketRef.current.emit("markAsRead", { roomId, userId: user.id });
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [user, sellerId, isSignedIn]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) {
      console.log("Cannot send message:", {
        messageEmpty: !newMessage.trim(),
        socketMissing: !socketRef.current,
      });
      return;
    }

    const roomId = [user.id, sellerId].sort().join("-");
    const messageData = {
      roomId,
      senderId: user.id,
      receiverId: sellerId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      messageType: "text",
    };

    console.log("Sending message:", messageData);
    socketRef.current.emit("sendMessage", messageData, (error) => {
      if (error) {
        console.error("Error sending message:", error);
        message.error("Failed to send message");
      } else {
        console.log("Message sent successfully");
        // Add to tracking set to prevent duplicates
        const messageId = `${messageData.senderId}-${messageData.timestamp}`;
        messagesRef.current.add(messageId);
        setNewMessage("");
      }
    });
  };

  const handleImageUpload = async (file) => {
    try {
      setUploading(true);
      const imageUrl = await uploadImage(file);

      if (imageUrl) {
        const roomId = [user.id, sellerId].sort().join("-");
        const messageData = {
          roomId,
          senderId: user.id,
          receiverId: sellerId,
          content: imageUrl,
          timestamp: new Date().toISOString(),
          messageType: "image",
        };

        socketRef.current.emit("sendMessage", messageData, (error) => {
          if (error) {
            console.error("Error sending image:", error);
            message.error("Failed to send image");
          } else {
            console.log("Image sent successfully");
            // Add to tracking set to prevent duplicates
            const messageId = `${messageData.senderId}-${messageData.timestamp}`;
            messagesRef.current.add(messageId);
          }
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload behavior
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  };

  // Check if user is authenticated - display login UI instead of redirecting
  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-120px)] flex flex-col bg-gray-50 rounded-lg shadow-lg">
        <div className="flex items-center gap-4 p-4 border-b bg-white rounded-t-lg shadow">
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => window.history.back()}
          />
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>

        <div className="flex-1 flex justify-center items-center">
          <Result
            status="info"
            title="Yêu cầu đăng nhập"
            subTitle="Vui lòng đăng nhập để sử dụng tính năng chat"
            extra={[
              <SignInButton key="signin" redirectUrl={window.location.href}>
                <Button type="primary" icon={<LoginOutlined />} size="large">
                  Đăng nhập
                </Button>
              </SignInButton>,
              <Button
                key="back"
                onClick={() => window.history.back()}
                size="large"
              >
                Quay lại
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-120px)] flex flex-col bg-gray-50 rounded-lg shadow-lg">
      {/* Chat header */}
      <div className="flex items-center gap-4 p-4 border-b bg-white rounded-t-lg shadow">
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => window.history.back()}
          className="lg:hidden"
        />
        <Avatar
          src={sellerInfo?.imageUrl}
          size={48}
          className="border-2 border-blue-100"
        >
          {!sellerInfo?.imageUrl && sellerInfo?.name?.[0]}
        </Avatar>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">
            {sellerInfo?.name || "Unknown Seller"}
          </h2>
          <p className="text-sm text-gray-500">
            {sellerInfo?.emailAddresses?.[0] || "No email"}
          </p>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 bg-opacity-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 p-8 bg-white rounded-lg shadow">
            <p className="text-lg font-medium">No messages yet</p>
            <p>
              Start the conversation with {sellerInfo?.name || "this user"}!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={`${message.senderId}-${message.timestamp}`}
                className={`flex ${
                  message.senderId === user.id ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                    message.senderId === user.id
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-white rounded-bl-none"
                  }`}
                >
                  {message.messageType === "image" ? (
                    <div className="mb-1">
                      <img
                        src={message.content}
                        alt="Image message"
                        className="rounded max-w-full h-auto max-h-60 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.content, "_blank")}
                      />
                    </div>
                  ) : (
                    <p className="break-words">{message.content}</p>
                  )}
                  <div className="text-xs opacity-70 flex justify-between mt-1">
                    <span>{formatMessageDate(message.timestamp)}</span>
                    {message.senderId === user.id && (
                      <Tooltip title={message.seen ? "Read" : "Delivered"}>
                        <CheckCircleFilled
                          style={{
                            color:
                              message.senderId === user.id ? "#fff" : "#1890ff",
                            opacity: message.seen ? 1 : 0.6,
                          }}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <div className="border-t p-4 bg-white rounded-b-lg shadow">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onPressEnter={sendMessage}
            placeholder="Type a message..."
            size="large"
            className="flex-1"
            autoFocus
          />
          <Upload
            beforeUpload={handleImageUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button
              icon={<PictureOutlined />}
              size="large"
              loading={uploading}
              type="default"
              className="hover:bg-blue-50 transition-colors"
            />
          </Upload>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            size="large"
            disabled={!newMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            Send
          </Button>
        </div>
      </div>

      <style jsx="true">{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .overflow-y-auto::-webkit-scrollbar {
          width: 5px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 5px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ChatBox;
