import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Typography,
  Divider,
  Form,
  InputNumber,
  Button,
  List,
  Card,
  Spin,
  Alert,
  Row,
  Col,
  Image,
  Modal,
} from "antd";
import { useLoaderData, useParams, useNavigate } from "react-router-dom";
import { getAuctionDetailById } from "@/API/huynt.api/auction.api";
import { placeBid } from "@/API/huynt.api/bid.api";
import { initializeSocket } from "@/utils/socket";
import CountdownTimer from "../components/auction/CountdownTimer";
import { useAuth } from "@clerk/clerk-react";
import { getUserInformation } from "@/API/duc.api/user.api";
import AuthRequiredModal from "../components/global/AuthRequiredModal";

const { Content } = Layout;
const { Title, Text } = Typography;

export const auctionDetailLoader = async ({ params }) => {
  try {
    const dataAuction = await getAuctionDetailById(params.auctionId);
    return { dataAuction };
  } catch (error) {
    console.error("Error fetching auction details:", error);
    return { dataAuction: null };
  }
};

const AuctionDetailPage = () => {
  const { dataAuction } = useLoaderData();
  console.log(dataAuction);
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(dataAuction?.auction || null);
  const [bids, setBids] = useState(() => {
    const initialBids = dataAuction?.bids || [];
    return [...initialBids].sort((a, b) => b.amount - a.amount);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bidIncrement, setBidIncrement] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [form] = Form.useForm();
  const socketRef = useRef(null);
  const { userId, isSignedIn } = useAuth();
  const [userNames, setUserNames] = useState({});
  const [winnerModal, setWinnerModal] = useState({
    visible: false,
    isWinner: false,
    isSeller: false,
    winnerName: "",
    sellerName: "",
    amount: 0,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Add a new state to check if auction has started
  const [auctionStatus, setAuctionStatus] = useState({
    hasStarted: false,
    hasEnded: false,
    isConfigured: false,
    isApproved: false,
    isOwner: false,
  });

  // Function to handle configuring the auction
  const handleConfigureAuction = () => {
    navigate(`/auction-config/${auctionId}`);
  };

  // Function to render a notification when the auction is approved but not configured
  const renderConfigurationAlert = () => {
    if (
      auctionStatus.isOwner &&
      auction &&
      auction.startTime &&
      auction.endTime
    ) {
      // Do nothing - auction is already configured
      return null;
    }

    // Only show configuration alert for auction owners
    if (auctionStatus.isOwner) {
      return (
        <Alert
          message="Configure Your Auction"
          description="You can update your auction settings at any time before it starts."
          type="info"
          showIcon
          action={
            <Button
              type="primary"
              size="small"
              onClick={handleConfigureAuction}
            >
              Configure Now
            </Button>
          }
          className="mb-4"
        />
      );
    }
    return null;
  };

  // Check auction status when auction data changes or at regular intervals
  useEffect(() => {
    if (!auction) return;

    const checkAuctionStatus = () => {
      const now = new Date();
      const start = auction.startTime ? new Date(auction.startTime) : null;
      const end = auction.endTime ? new Date(auction.endTime) : null;
      const isConfigured =
        auction.startTime && auction.endTime && auction.currentPrice > 0;
      const isOwner = auction.itemId?.owner === userId;

      setAuctionStatus({
        hasStarted: start ? now >= start : false,
        hasEnded: end ? now >= end : false,
        isConfigured,
        isOwner,
      });
    };

    // Check immediately
    checkAuctionStatus();

    // Set up interval to check status periodically (every 5 seconds)
    const interval = setInterval(checkAuctionStatus, 5000);

    // Set bid increment based on auction settings
    if (auction.minBidIncrement > 0) {
      setBidIncrement(auction.minBidIncrement);
    } else {
      // Default increment if not specified by seller
      setBidIncrement(Math.max(10, Math.round(auction.currentPrice * 0.01))); // 1% of current price or minimum 10
    }

    return () => clearInterval(interval);
  }, [auction, userId]);

  // Kiểm tra auction đã kết thúc khi load trang
  useEffect(() => {
    if (!auction) return;

    const now = new Date();
    const end = new Date(auction.endTime);

    // Nếu auction đã kết thúc và có highest bid
    if (now > end && bids.length > 0) {
      const highestBid = bids[0];
      console.log("Auction ended on load, highest bid:", highestBid);

      // Get seller info if available
      const sellerId = auction.itemId?.owner;
      const sellerName = sellerId ? userNames[sellerId] || "Seller" : "Seller";

      setWinnerModal({
        visible: true,
        isWinner: highestBid.userId === userId,
        isSeller: sellerId === userId,
        winnerName: userNames[highestBid.userId] || "Another bidder",
        sellerName: sellerName,
        amount: highestBid.amount,
      });
    }
  }, [auction, bids, userId, userNames]);

  // Initialize socket connection with better real-time handling
  useEffect(() => {
    // Initialize socket connection
    const socketInstance = initializeSocket();
    socketRef.current = socketInstance;

    // Join auction room
    socketInstance.emit("joinAuction", auctionId);
    console.log("Joined auction room:", auctionId);

    // Handle connection events
    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setSocketConnected(true);
      // Re-join auction room on reconnection
      socketInstance.emit("joinAuction", auctionId);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    });

    // Handle bid updates from other users - this is the main bidUpdate event
    socketInstance.on("bidUpdate", (data) => {
      console.log("Received bidUpdate:", data);

      // Update auction data when receiving comprehensive update
      if (data.auction) {
        console.log("Updating auction:", data.auction);
        setAuction((prev) => ({
          ...prev,
          ...data.auction,
          currentPrice: data.auction.currentPrice,
        }));
      }

      // Update bids list with full data refresh
      if (data.bids && Array.isArray(data.bids)) {
        console.log("Updating bids with full data:", data.bids);
        const sortedBids = [...data.bids].sort((a, b) => b.amount - a.amount);
        setBids(sortedBids);
      }
    });

    // Handle new individual bid event (real-time immediate update)
    socketInstance.on("newBid", (bidData) => {
      console.log("Received newBid (immediate update):", bidData);

      if (bidData.auctionId === auctionId) {
        // Optimistically update auction current price
        setAuction((prev) => ({
          ...prev,
          currentPrice: bidData.amount,
        }));

        // Optimistically add new bid to the leaderboard immediately
        setBids((prev) => {
          // Don't add duplicate bids
          const existingBidIndex = prev.findIndex(
            (bid) =>
              bid.id === bidData.id ||
              (bid.userId === bidData.userId &&
                bid.amount === bidData.amount &&
                Math.abs(
                  new Date(bid.createdAt) - new Date(bidData.createdAt)
                ) < 1000)
          );

          if (existingBidIndex !== -1) {
            return prev;
          }

          // Add bid with animation highlight
          const newBid = {
            ...bidData,
            isNew: true, // Flag for highlighting
          };

          // Add to list and re-sort
          const updatedBids = [newBid, ...prev];
          const sortedBids = updatedBids.sort((a, b) => b.amount - a.amount);

          // Remove highlight after 3 seconds
          setTimeout(() => {
            setBids((current) =>
              current.map((bid) =>
                bid.id === newBid.id ? { ...bid, isNew: false } : bid
              )
            );
          }, 3000);

          return sortedBids;
        });

        // Play a sound effect for new bids (optional)
        // Only if this is not the current user's bid
        if (bidData.userId !== userId) {
          try {
            const audio = new Audio("/notification-sound.mp3");
            audio.volume = 0.5;
            audio
              .play()
              .catch(() => console.log("Could not play notification sound"));
          } catch (error) {
            console.log("Sound notification not supported", error);
          }
        }
      }
    });

    // Handle auction end event
    socketInstance.on("auctionEnded", (data) => {
      console.log("Received auctionEnded:", data);
      if (data.auctionId === auctionId) {
        console.log("Setting winner modal for auction:", auctionId);
        console.log("Current user:", userId);
        console.log("Winner:", data.winnerId);

        setWinnerModal({
          visible: true,
          isWinner: data.winnerId === userId,
          isSeller: data.sellerId === userId,
          winnerName: data.winnerName || "Another bidder",
          sellerName: data.sellerName || "Seller",
          amount: data.amount,
        });
      }
    });

    // Listen for coin balance updates related to this auction
    socketInstance.on("coinUpdate", (data) => {
      if (
        data.userId === userId &&
        data.transaction?.description?.includes(auction?.itemId?.name)
      ) {
        console.log("Received coin update for this auction:", data);
      }
    });

    // Error handling
    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
      setError("Real-time connection error. Please refresh the page.");
    });

    socketInstance.on("bidError", (error) => {
      console.error("Bid error:", error);
      setError(error.message || "Error occurred while processing bid");
      setLoading(false);
    });

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket listeners");
      if (socketRef.current) {
        socketRef.current.off("bidUpdate");
        socketRef.current.off("newBid");
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("error");
        socketRef.current.off("bidError");
        socketRef.current.off("auctionEnded");
        socketRef.current.off("coinUpdate");
        socketRef.current.emit("leaveAuction", auctionId);
      }
      // Reset modal state
      setWinnerModal({
        visible: false,
        isWinner: false,
        isSeller: false,
        winnerName: "",
        sellerName: "",
        amount: 0,
      });
    };
  }, [auctionId, userId]);

  // Refresh auction data periodically as fallback
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!socketConnected) {
        try {
          const response = await getAuctionDetailById(auctionId);
          if (response?.auction) {
            setAuction(response.auction);
          }
          if (response?.bids) {
            const sortedBids = [...response.bids].sort(
              (a, b) => b.amount - a.amount
            );
            setBids(sortedBids);
          }
        } catch (error) {
          console.error("Error refreshing auction data:", error);
        }
      }
    }, 10000); // Refresh every 10 seconds when socket is disconnected

    return () => clearInterval(interval);
  }, [auctionId, socketConnected]);

  // Tự động trigger settle khi hết giờ
  useEffect(() => {
    if (!auction) return;
    const now = new Date();
    const end = new Date(auction.endTime);
    const msLeft = end - now;
    if (msLeft > 0) {
      const timeout = setTimeout(async () => {
        try {
          await getAuctionDetailById(auction._id);
        } catch {
          /* ignore error */
        }
      }, msLeft + 1000); // +1s để chắc chắn đã hết giờ
      return () => clearTimeout(timeout);
    }
  }, [auction]);

  // Fetch user names cho các userId trong top 10 bids
  useEffect(() => {
    const fetchUserNames = async () => {
      const topBids = bids.slice(0, 10);
      const missingIds = topBids
        .map((bid) => bid.userId)
        .filter((id) => id && !userNames[id]);
      if (missingIds.length === 0) return;
      const updates = {};
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const info = await getUserInformation(id);
            updates[id] = info.name || id;
          } catch {
            updates[id] = id;
          }
        })
      );
      setUserNames((prev) => ({ ...prev, ...updates }));
    };
    fetchUserNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bids]);

  // Modified onFinish function to check authentication
  const onFinish = async (values) => {
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate the total bid amount (current price + increment amount)
      const incrementAmount = values.bidAmount;
      const totalBidAmount = auction.currentPrice + incrementAmount;

      // Validate bid amount
      if (incrementAmount <= 0) {
        setError("Increment amount must be greater than 0");
        setLoading(false);
        return;
      }

      // Validate min bid increment if set
      if (bidIncrement && bidIncrement > 0 && incrementAmount < bidIncrement) {
        setError(`Increment must be at least ${bidIncrement}`);
        setLoading(false);
        return;
      }

      // Make the bid with all required fields
      const response = await placeBid({
        auctionId: auctionId,
        amount: totalBidAmount,
      });

      console.log("Bid placed successfully:", response);

      // Optimistically update the form with the same increment
      form.setFieldsValue({
        bidAmount: incrementAmount,
      });
    } catch (error) {
      console.error("Error placing bid:", error);
      setError(error.response?.data?.message || "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  // Render the bid form with authentication check
  const renderBidForm = () => {
    // Set default increment amount to either the minimum bid increment or 1
    const defaultIncrementAmount = bidIncrement || 1;

    // Calculate total bid amount based on current form value or default
    const calculateTotalBid = () => {
      const incrementValue =
        form.getFieldValue("bidAmount") || defaultIncrementAmount;
      return auction?.currentPrice + Number(incrementValue);
    };

    return (
      <Card
        title="Place a Bid"
        className="mb-4 shadow-sm"
        extra={
          <div className="text-right">
            <Text type="secondary">
              Current price: {auction?.currency || "$"}
              {auction?.currentPrice?.toLocaleString()}
            </Text>
            {auction?.minBidIncrement > 0 && (
              <Text
                type="secondary"
                style={{ display: "block", fontSize: "12px" }}
              >
                (Min increment: {auction?.currency || "$"}
                {auction.minBidIncrement})
              </Text>
            )}
          </div>
        }
      >
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Form
          form={form}
          name="bid_form"
          initialValues={{
            bidAmount: defaultIncrementAmount,
          }}
          onFinish={onFinish}
          onValuesChange={() => {
            // Force re-render to update the total bid display
            setLoading(loading); // This is a trick to force re-render without changing state
          }}
        >
          <div
            style={{
              marginBottom: 16,
              padding: "10px",
              background: "#f9f9f9",
              borderRadius: "4px",
              border: "1px solid #eee",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text>Current price:</Text>
              <Text strong>
                {auction?.currency || "$"}
                {auction?.currentPrice?.toLocaleString()}
              </Text>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <Text>Your increment:</Text>
              <Text strong>
                + {auction?.currency || "$"}
                {(
                  form.getFieldValue("bidAmount") || defaultIncrementAmount
                )?.toLocaleString()}
              </Text>
            </div>
            <Divider style={{ margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text strong>Your total bid:</Text>
              <Text strong style={{ fontSize: "16px", color: "#1890ff" }}>
                {auction?.currency || "$"}
                {calculateTotalBid()?.toLocaleString()}
              </Text>
            </div>
          </div>

          <Form.Item
            name="bidAmount"
            label="Amount to add"
            rules={[
              { required: true, message: "Please enter increment amount" },
              {
                type: "number",
                min: bidIncrement || 1,
                message: `Increment must be at least ${bidIncrement || 1}`,
              },
            ]}
          >
            <InputNumber
              min={bidIncrement || 1}
              step={bidIncrement || 1}
              style={{ width: "100%" }}
              size="large"
              disabled={!auctionStatus.hasStarted || auctionStatus.hasEnded}
              formatter={(value) =>
                `${auction?.currency || "$"}${value}`.replace(
                  /\B(?=(\d{3})+(?!\d))/g,
                  ","
                )
              }
              parser={(value) => value.replace(/[^\d.]/g, "")}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              disabled={!auctionStatus.hasStarted || auctionStatus.hasEnded}
            >
              {auctionStatus.hasEnded
                ? "Auction Ended"
                : !auctionStatus.hasStarted
                ? "Auction Not Started"
                : `Place Bid (${
                    auction?.currency || "$"
                  }${calculateTotalBid()?.toLocaleString()})`}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  // Return the component
  return (
    <>
      <Modal
        open={winnerModal.visible}
        onCancel={() => setWinnerModal((prev) => ({ ...prev, visible: false }))}
        footer={null}
        centered
        closable={true}
        maskClosable={true}
        width={450}
        style={{ zIndex: 1001 }} // Đảm bảo modal hiển thị trên cùng
        maskStyle={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }} // Làm tối background
      >
        {winnerModal.isWinner ? (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#16a34a", marginBottom: 16 }}>
              🎉 Chúc mừng bạn đã thắng phiên đấu giá!
            </h2>
            <p style={{ fontSize: 18, marginBottom: 8 }}>
              Bạn đã thắng với giá{" "}
              <b>${winnerModal.amount?.toLocaleString()}</b>.
            </p>
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: "4px",
                padding: "12px",
                margin: "16px 0",
              }}
            >
              <p style={{ color: "#52c41a", fontWeight: 500, marginBottom: 8 }}>
                Giao dịch hoàn tất
              </p>
              <div style={{ textAlign: "left" }}>
                <p>
                  • Số coin của bạn đã bị trừ{" "}
                  <b>{winnerModal.amount?.toLocaleString()}</b>
                </p>
                <p>• Sản phẩm đã được chuyển cho bạn</p>
                <p>
                  • Người bán <b>{winnerModal.sellerName}</b> đã nhận được tiền
                </p>
              </div>
            </div>
            <Button
              type="primary"
              block
              style={{ marginTop: 24 }}
              onClick={() =>
                setWinnerModal((prev) => ({ ...prev, visible: false }))
              }
            >
              Đóng
            </Button>
          </div>
        ) : winnerModal.isSeller ? (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#16a34a", marginBottom: 16 }}>
              💰 Phiên đấu giá của bạn đã kết thúc!
            </h2>
            <p style={{ fontSize: 18, marginBottom: 8 }}>
              Sản phẩm của bạn đã được bán với giá{" "}
              <b>${winnerModal.amount?.toLocaleString()}</b>.
            </p>
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: "4px",
                padding: "12px",
                margin: "16px 0",
              }}
            >
              <p style={{ color: "#52c41a", fontWeight: 500, marginBottom: 8 }}>
                Giao dịch hoàn tất
              </p>
              <div style={{ textAlign: "left" }}>
                <p>
                  • Tài khoản của bạn đã được cộng{" "}
                  <b>{winnerModal.amount?.toLocaleString()}</b> coin
                </p>
                <p>• Sản phẩm đã được chuyển cho người mua</p>
                <p>
                  • Người thắng cuộc: <b>{winnerModal.winnerName}</b>
                </p>
              </div>
            </div>
            <Button
              type="primary"
              block
              style={{ marginTop: 24 }}
              onClick={() =>
                setWinnerModal((prev) => ({ ...prev, visible: false }))
              }
            >
              Đóng
            </Button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#faad14", marginBottom: 16 }}>
              Kết thúc phiên đấu giá
            </h2>
            <p style={{ fontSize: 18, marginBottom: 8 }}>
              Người thắng cuộc: <b>{winnerModal.winnerName || "(ẩn danh)"}</b>
            </p>
            <p style={{ color: "#1890ff", fontWeight: 500, marginBottom: 8 }}>
              Giá thắng: <b>${winnerModal.amount?.toLocaleString()}</b>
            </p>
            <p>
              Người bán: <b>{winnerModal.sellerName || "(ẩn danh)"}</b>
            </p>
            <div
              style={{
                background: "#f0f5ff",
                border: "1px solid #d6e4ff",
                borderRadius: "4px",
                padding: "12px",
                margin: "16px 0",
                textAlign: "left",
              }}
            >
              <p>• Giao dịch đã được hoàn tất</p>
              <p>• Sản phẩm đã được chuyển cho người thắng cuộc</p>
            </div>
            <Button
              type="primary"
              block
              style={{ marginTop: 24 }}
              onClick={() =>
                setWinnerModal((prev) => ({ ...prev, visible: false }))
              }
            >
              Đóng
            </Button>
          </div>
        )}
      </Modal>
      <Layout style={{ backgroundColor: "#fff", padding: "20px" }}>
        <Content>
          {renderConfigurationAlert()}

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: "16px" }}
            />
          )}

          {/* Connection Status Indicator */}
          {/* {!socketConnected && (
            <Alert
              message="Real-time updates unavailable"
              description="Connection lost. Data will be refreshed periodically."
              type="warning"
              style={{ marginBottom: "16px" }}
              closable
            />
          )} */}

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              {/* Leaderboard Section */}
              <Title
                level={3}
                style={{ textAlign: "center", marginBottom: "24px" }}
              >
                🏆 Leaderboard - Top 10 Highest Bids ({bids.length})
                {socketConnected && (
                  <Text
                    type="secondary"
                    style={{ fontSize: "12px", display: "block" }}
                  >
                    Real-time updates active
                  </Text>
                )}
              </Title>

              {bids.length > 0 ? (
                <List
                  dataSource={bids.slice(0, 10)}
                  renderItem={(bid, index) => (
                    <List.Item style={{ padding: "8px 0" }}>
                      <Card
                        size="small"
                        style={{
                          width: "100%",
                          backgroundColor: bid.isNew
                            ? "#e6f7ff"
                            : index === 0
                            ? "#f6ffed"
                            : index === 1
                            ? "#fff7e6"
                            : index === 2
                            ? "#fff1f0"
                            : "#fafafa",
                          border:
                            index === 0
                              ? "2px solid #52c41a"
                              : index === 1
                              ? "2px solid #faad14"
                              : index === 2
                              ? "2px solid #f5222d"
                              : "1px solid #d9d9d9",
                          transition: "all 0.3s ease",
                          boxShadow:
                            index < 3
                              ? "0 4px 12px rgba(0,0,0,0.1)"
                              : "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "20px",
                                fontWeight: "bold",
                                minWidth: "40px",
                                textAlign: "center",
                              }}
                            >
                              {index === 0 && "🥇"}
                              {index === 1 && "🥈"}
                              {index === 2 && "🥉"}
                              {index > 2 && `#${index + 1}`}
                            </div>
                            <div>
                              <Text
                                strong
                                style={{
                                  color:
                                    index === 0
                                      ? "#52c41a"
                                      : index === 1
                                      ? "#faad14"
                                      : index === 2
                                      ? "#f5222d"
                                      : "inherit",
                                  fontSize: index < 3 ? "16px" : "14px",
                                }}
                              >
                                {userNames[bid.userId] || "Loading..."}
                              </Text>
                              <br />
                              <Text
                                type="secondary"
                                style={{ fontSize: "12px" }}
                              >
                                {new Date(bid.createdAt).toLocaleString()}
                              </Text>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <Text
                              strong
                              style={{
                                fontSize:
                                  index === 0
                                    ? "22px"
                                    : index < 3
                                    ? "18px"
                                    : "16px",
                                color:
                                  index === 0
                                    ? "#52c41a"
                                    : index === 1
                                    ? "#faad14"
                                    : index === 2
                                    ? "#f5222d"
                                    : "#1890ff",
                                textShadow:
                                  index < 3
                                    ? "0 1px 2px rgba(0,0,0,0.1)"
                                    : "none",
                              }}
                            >
                              ${bid.amount?.toLocaleString()}
                            </Text>
                            {index === 0 && (
                              <div>
                                <Text
                                  type="success"
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  🏆 LEADING BID
                                </Text>
                              </div>
                            )}
                            {index === 1 && (
                              <div>
                                <Text
                                  style={{
                                    fontSize: "12px",
                                    color: "#faad14",
                                    fontWeight: "bold",
                                  }}
                                >
                                  🥈 2nd Place
                                </Text>
                              </div>
                            )}
                            {index === 2 && (
                              <div>
                                <Text
                                  style={{
                                    fontSize: "12px",
                                    color: "#f5222d",
                                    fontWeight: "bold",
                                  }}
                                >
                                  🥉 3rd Place
                                </Text>
                              </div>
                            )}
                          </div>
                        </div>
                        {index < 3 && bids.length > 1 && (
                          <div style={{ marginTop: "12px" }}>
                            <div
                              style={{
                                width: "100%",
                                height: "6px",
                                backgroundColor: "#f0f0f0",
                                borderRadius: "3px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${
                                    (bid.amount / bids[0].amount) * 100
                                  }%`,
                                  height: "100%",
                                  background:
                                    index === 0
                                      ? "linear-gradient(90deg, #52c41a 0%, #73d13d 100%)"
                                      : index === 1
                                      ? "linear-gradient(90deg, #faad14 0%, #ffc53d 100%)"
                                      : "linear-gradient(90deg, #f5222d 0%, #ff4d4f 100%)",
                                  transition: "width 0.5s ease",
                                  borderRadius: "3px",
                                }}
                              />
                            </div>
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "11px",
                                color: "#666",
                                textAlign: "right",
                              }}
                            >
                              {((bid.amount / bids[0].amount) * 100).toFixed(1)}
                              % of leading bid
                            </div>
                          </div>
                        )}
                      </Card>
                    </List.Item>
                  )}
                />
              ) : (
                <Card style={{ textAlign: "center", padding: "40px" }}>
                  <Alert
                    message="No bids yet"
                    description="Be the first to place a bid and claim the top spot!"
                    type="info"
                    showIcon
                    style={{
                      borderLeft: "4px solid #1890ff",
                      backgroundColor: "#e6f7ff",
                    }}
                  />
                </Card>
              )}
            </Col>

            <Col xs={24} md={12}>
              <Card>
                <Image
                  width="100%"
                  height={400}
                  src={auction.itemId?.images?.[0] || "/assets/sample.jpg"}
                  alt={auction.itemId?.name || "Auction item"}
                  style={{
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                  fallback="/assets/sample.jpg"
                  placeholder={
                    <div
                      style={{
                        height: 400,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      <Spin size="large" />
                    </div>
                  }
                />
              </Card>
              <Title level={2}>{auction.itemId?.name}</Title>
              <Text
                style={{
                  fontSize: "16px",
                  color: "#666",
                  lineHeight: "1.6",
                  whiteSpace: "pre-line",
                }}
              >
                {auction.itemId?.description}
              </Text>
              <Divider />

              <Card style={{ marginBottom: "20px" }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>Starting Price: </Text>
                    <br />
                    <Text style={{ fontSize: "16px", color: "#666" }}>
                      ${auction.startPrice?.toLocaleString()}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Current Price: </Text>
                    <br />
                    <Text
                      style={{
                        fontSize: "24px",
                        color: "#1890ff",
                        fontWeight: "bold",
                        textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      ${auction.currentPrice?.toLocaleString()}
                    </Text>
                  </Col>
                  <Col
                    span={12}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#64748b",
                        marginTop: 4,
                        textAlign: "left",
                      }}
                    >
                      Thời gian còn lại
                    </div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        color: "#16a34a",
                        fontWeight: 600,
                        margin: "8px 0",
                        textAlign: "left",
                      }}
                    >
                      <CountdownTimer
                        endTime={auction.endTime}
                        startTime={auction.startTime}
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Total Bids: </Text>
                    <br />
                    <Text
                      style={{
                        fontSize: "16px",
                        color: "#52c41a",
                        fontWeight: "bold",
                      }}
                    >
                      {bids.length}
                    </Text>
                  </Col>
                </Row>
              </Card>

              {renderBidForm()}
            </Col>
          </Row>

          <Divider />
        </Content>
      </Layout>

      {/* Add the AuthRequiredModal */}
      <AuthRequiredModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        featureName="đấu giá"
      />
    </>
  );
};

export default AuctionDetailPage;
