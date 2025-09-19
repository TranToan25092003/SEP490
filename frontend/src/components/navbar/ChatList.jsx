import React, { useState, useEffect } from "react";
import { Popover, List, Avatar, Badge, Spin, Empty } from "antd";
import { MessageCircle } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { getUserInformation } from "@/API/duc.api/user.api";
import { initializeSocket } from "@/utils/socket";
import AuthRequiredModal from "../global/AuthRequiredModal";

const ChatList = () => {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;

    const socket = initializeSocket();

    // Load user's chat list
    const loadChatList = () => {
      socket.emit("loadChatList", user.id, async (chatList) => {
        if (chatList && !chatList.error) {
          // Fetch user info for each chat
          const chatsWithInfo = await Promise.all(
            chatList.map(async (chat) => {
              const otherUserId = chat.participants.find(
                (id) => id !== user.id
              );
              try {
                const userInfo = await getUserInformation(otherUserId);
                return {
                  ...chat,
                  userInfo,
                };
              } catch (error) {
                console.error("Error fetching user info:", error);
                return {
                  ...chat,
                  userInfo: { name: "Unknown User" },
                };
              }
            })
          );

          setChats(chatsWithInfo);
          setLoading(false);

          // Calculate unread messages
          const unread = chatsWithInfo.reduce(
            (acc, chat) => acc + (chat.unreadCount || 0),
            0
          );
          setUnreadCount(unread);
        }
      });
    };

    // Initial load
    loadChatList();

    // Listen for new messages
    socket.on("newMessage", async () => {
      // Reload chat list to update unread counts and last messages
      loadChatList();
    });

    // Listen for new chat notifications
    socket.on("newChatNotification", async (data) => {
      console.log("New chat notification:", data);
      // Reload chat list to update unread counts and last messages
      loadChatList();
    });

    return () => {
      socket.off("newMessage");
      socket.off("newChatNotification");
    };
  }, [user, isSignedIn]);

  // Mark messages as read when opening chat
  const handleChatClick = (userId) => {
    navigate(`/chat?seller=${userId}`);
    setOpen(false);
  };

  const handleOpenChange = (newOpen) => {
    if (!isSignedIn && newOpen) {
      // If not signed in and trying to open the chat list
      setShowAuthModal(true);
      return;
    }
    setOpen(newOpen);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  const content = (
    <div className="w-80 max-h-96 overflow-auto">
      {loading ? (
        <div className="flex justify-center p-4">
          <Spin />
        </div>
      ) : chats.length === 0 ? (
        <Empty description="No conversations yet" className="my-4" />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={chats}
          className="chat-list"
          renderItem={(chat) => {
            const otherUserId = chat.participants.find((id) => id !== user.id);
            return (
              <List.Item
                className="cursor-pointer hover:bg-gray-50 transition-colors p-2"
                onClick={() => handleChatClick(otherUserId)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={chat.unreadCount || 0} overflowCount={99}>
                      <Avatar src={chat.userInfo?.imageUrl} size={40}>
                        {!chat.userInfo?.imageUrl && chat.userInfo?.name?.[0]}
                      </Avatar>
                    </Badge>
                  }
                  title={
                    <span className="font-medium">
                      {chat.userInfo?.name || "Unknown User"}
                    </span>
                  }
                  description={
                    <div>
                      <div className="text-sm truncate max-w-52">
                        {chat.lastMessage}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(chat.timestamp).toLocaleString()}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );

  return (
    <>
      <Popover
        content={content}
        trigger="click"
        placement="bottomRight"
        open={open}
        onOpenChange={handleOpenChange}
      >
        <div className="flex items-center justify-center relative cursor-pointer">
          <MessageCircle className="w-6 h-6" />
          {isSignedIn && unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </Popover>

      <AuthRequiredModal
        open={showAuthModal}
        onClose={handleAuthModalClose}
        featureName="chat"
      />
    </>
  );
};

export default ChatList;
