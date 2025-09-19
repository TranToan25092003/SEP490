import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Divider,
  Button,
  Spin,
  Carousel,
  Row,
  Col,
  Card,
  Tag,
  notification,
} from "antd";
import {
  ShoppingOutlined,
  SmileOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  SafetyOutlined,
  StarOutlined,
} from "@ant-design/icons";
const { Paragraph, Title, Text } = Typography;
const { Content } = Layout;

import Banner from "../components/item/banner";
import { CategorySection } from "@/components/item/category-card";
import ProductList from "@/components/item/item-list";
import Footer from "@/components/global/Footer";

import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import { getAllItems, getRecentItems } from "@/API/duc.api/item.api";
import { getAllCategoriesWithStats } from "@/API/duc.api/category.api";

export const homepageLoader = async () => {
  try {
    const dataItems = await getAllItems();
    const recentItems = await getRecentItems(1); // page 1
    const dataCategories = await getAllCategoriesWithStats();
    return { dataItems, dataCategories, recentItems };
  } catch (error) {
    console.log(error);
  }
};

const carouselData = [
  {
    img: "/assets/samsung-galaxy-s24-1.jpg",
    title: "Chào mừng đến với WDP301",
    desc: "Nền tảng mua bán, đấu giá, cho mượn đồ dùng tiện lợi, an toàn và tiết kiệm.",
    cta: "Khám phá ngay",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    img: "/assets/sample.jpg",
    title: "Sản phẩm mới, giá tốt",
    desc: "Khám phá hàng trăm sản phẩm mới được đăng mỗi ngày với giá cực kỳ hấp dẫn.",
    cta: "Xem sản phẩm",
    gradient: "linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)",
  },
  {
    img: "/assets/category-electronics.jpeg",
    title: "Đấu giá sôi động",
    desc: "Tham gia đấu giá để sở hữu món đồ bạn yêu thích với giá tốt nhất!",
    cta: "Tham gia đấu giá",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
];

const IntroSection = () => (
  <div
    style={{
      background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      padding: "60px 0",
      margin: "60px 0",
      borderRadius: 24,
      color: "white",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.08"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.08"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.08"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.08"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.08"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\')',
        opacity: 0.3,
      }}
    />
    <Row
      gutter={[48, 32]}
      align="middle"
      justify="center"
      style={{ position: "relative", zIndex: 1 }}
    >
      <Col xs={24} md={8} className="text-center">
        <div
          style={{
            background: "linear-gradient(135deg, #bbf7d0 0%, #99f6e4 100%)",
            borderRadius: 20,
            padding: 24,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <SmileOutlined
            style={{ fontSize: 56, color: "#fff", marginBottom: 16 }}
          />
          <Title
            level={4}
            style={{ marginTop: 16, color: "white", marginBottom: 12 }}
          >
            Dễ sử dụng
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
            Đăng tin, mua bán, đấu giá, cho mượn chỉ với vài thao tác đơn giản.
          </Text>
        </div>
      </Col>
      <Col xs={24} md={8} className="text-center">
        <div
          style={{
            background: "linear-gradient(135deg, #bbf7d0 0%, #99f6e4 100%)",
            borderRadius: 20,
            padding: 24,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <ThunderboltOutlined
            style={{ fontSize: 56, color: "#fff", marginBottom: 16 }}
          />
          <Title
            level={4}
            style={{ marginTop: 16, color: "white", marginBottom: 12 }}
          >
            Nhanh chóng & An toàn
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
            Giao dịch minh bạch, bảo vệ người dùng tối đa với hệ thống bảo mật
            tiên tiến.
          </Text>
        </div>
      </Col>
      <Col xs={24} md={8} className="text-center">
        <div
          style={{
            background: "linear-gradient(135deg, #bbf7d0 0%, #99f6e4 100%)",
            borderRadius: 20,
            padding: 24,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <ShoppingOutlined
            style={{ fontSize: 56, color: "#fff", marginBottom: 16 }}
          />
          <Title
            level={4}
            style={{ marginTop: 16, color: "white", marginBottom: 12 }}
          >
            Tiết kiệm & Thông minh
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
            Mua sắm thông minh, tiết kiệm chi phí, bảo vệ môi trường xanh sạch.
          </Text>
        </div>
      </Col>
    </Row>
  </div>
);

const HomePage = () => {
  // const { dataItems, dataCategories, recentItems } = useLoaderData();
  const { dataCategories, recentItems } = useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();
  const [recent, setRecent] = useState(recentItems.data);
  const [page, setPage] = useState(2); // Page 1 loaded
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(recentItems.data.length > 0);
  const [categories] = useState(dataCategories.data);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    if (location.state?.created) {
      api.success({
        message: "Tạo sản phẩm thành công!",
        description: "Sản phẩm của bạn đã được đăng lên hệ thống.",
        placement: "bottomRight",
        duration: 4,
      });
      // Xóa state để reload không hiện lại
      window.history.replaceState({}, document.title);
    }
  }, [location.state, api]);

  const handleViewMore = async () => {
    setLoading(true);
    try {
      const res = await getRecentItems(page);
      if (res.data.length > 0) {
        setRecent((prev) => [...prev, ...res.data]);
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false); // No more data
      }
    } catch (err) {
      console.error("Error loading more recent items:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      style={{
        background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
        minHeight: "100vh",
      }}
    >
      {contextHolder}

      {/* Carousel Banner */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <Carousel
          autoplay
          dots={{ position: "bottom", style: { marginBottom: 20 } }}
          draggable
          style={{
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          }}
        >
          {carouselData.map((slide, idx) => (
            <div key={idx}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: slide.gradient,
                  borderRadius: 24,
                  minHeight: 400,
                  overflow: "hidden",
                  padding: 48,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\')',
                    opacity: 0.3,
                  }}
                />
                <img
                  src={slide.img}
                  alt={slide.title}
                  style={{
                    width: 380,
                    height: 240,
                    objectFit: "cover",
                    borderRadius: 20,
                    marginRight: 48,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    position: "relative",
                    zIndex: 1,
                  }}
                />
                <div
                  style={{ position: "relative", zIndex: 1, color: "white" }}
                >
                  <Title
                    level={1}
                    style={{
                      marginBottom: 16,
                      color: "white",
                      fontSize: 42,
                      fontWeight: 700,
                    }}
                  >
                    {slide.title}
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: 20,
                      color: "rgba(255,255,255,0.9)",
                      marginBottom: 32,
                      lineHeight: 1.6,
                    }}
                  >
                    {slide.desc}
                  </Paragraph>
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      height: 56,
                      fontSize: 18,
                      fontWeight: 600,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.2)",
                      border: "2px solid rgba(255,255,255,0.3)",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    }}
                    onClick={() => navigate("/filter")}
                  >
                    {slide.cta}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      {/* Danh mục sản phẩm */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Title
            level={2}
            style={{ marginBottom: 16, color: "#1e293b", fontWeight: 700 }}
          >
            Khám phá danh mục
          </Title>
          <Text style={{ fontSize: 18, color: "#64748b" }}>
            Chọn danh mục phù hợp với nhu cầu của bạn
          </Text>
        </div>
        <Row
          gutter={[24, 24]}
          justify="center"
          align="middle"
          style={{ minHeight: 200 }}
        >
          {categories.map((cat) => (
            <Col
              xs={12}
              sm={8}
              md={6}
              lg={4}
              xl={3}
              key={cat._id}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <Card
                hoverable
                style={{
                  width: 170,
                  height: 220,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "center",
                  borderRadius: 18,
                  boxShadow: "0 4px 16px rgba(34,197,94,0.08)",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  padding: 0,
                  margin: 0,
                  transition: "all 0.2s",
                  overflow: "hidden",
                }}
                bodyStyle={{
                  padding: 26,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  width: "100%",
                }}
                onClick={() => navigate(`/category/${cat._id}`)}
                className="category-card"
              >
                <div
                  style={{
                    width: 70,
                    height: 70,
                    marginTop: 8,
                    marginBottom: 8,
                    borderRadius: "50%",
                    backgroundImage: `url(${
                      cat.image || "/assets/fallback.png"
                    })`,
                    backgroundPosition: "center center",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    border: "3px solid #43e97b",
                    boxShadow: "0 3px 10px rgba(34,197,94,0.2)",
                  }}
                  aria-label={cat.title}
                ></div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#16a34a",
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    overflow: "hidden",
                    textAlign: "center",
                    lineHeight: "1.2",
                  }}
                >
                  <div
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      width: "100%",
                    }}
                  >
                    {cat.title}
                  </div>
                </div>
                <Text style={{ color: "#22c55e", fontSize: 13, marginTop: 4 }}>
                  {cat.products || 0} sản phẩm
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Sản phẩm mới nhất */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <Content
          style={{
            background: "white",
            borderRadius: 24,
            padding: 48,
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Title
              level={2}
              style={{ marginBottom: 16, color: "#1e293b", fontWeight: 700 }}
            >
              Sản phẩm mới đăng
            </Title>
            <Text style={{ fontSize: 18, color: "#64748b" }}>
              Khám phá những sản phẩm mới nhất được đăng trên nền tảng
            </Text>
          </div>
          <ProductList
            title=""
            products={recent}
            onViewAll={() => navigate("/filter")}
          />
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Button
                onClick={handleViewMore}
                loading={loading}
                size="large"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: 16,
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                }}
              >
                Xem thêm sản phẩm
              </Button>
            </div>
          )}
          {!hasMore && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                  borderRadius: 16,
                  padding: 32,
                  border: "2px dashed #cbd5e1",
                }}
              >
                <HeartOutlined
                  style={{ fontSize: 48, color: "#94a3b8", marginBottom: 16 }}
                />
                <Paragraph
                  style={{ color: "#64748b", fontSize: 16, margin: 0 }}
                >
                  Không còn sản phẩm nào để hiển thị.
                </Paragraph>
              </div>
            </div>
          )}
        </Content>
      </div>

      {/* Section giới thiệu */}
      <IntroSection />

      {/* Footer section */}
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          color: "white",
          marginTop: 60,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[32, 32]} align="middle" justify="center">
            <Col xs={24} md={8}>
              <StarOutlined
                style={{ fontSize: 32, color: "#fbbf24", marginBottom: 16 }}
              />
              <Title level={4} style={{ color: "white", marginBottom: 8 }}>
                Chất lượng đảm bảo
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                Tất cả sản phẩm đều được kiểm duyệt chất lượng
              </Text>
            </Col>
            <Col xs={24} md={8}>
              <SafetyOutlined
                style={{ fontSize: 32, color: "#34d399", marginBottom: 16 }}
              />
              <Title level={4} style={{ color: "white", marginBottom: 8 }}>
                Giao dịch an toàn
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                Bảo vệ thông tin và tài khoản của bạn
              </Text>
            </Col>
            <Col xs={24} md={8}>
              <ShoppingOutlined
                style={{ fontSize: 32, color: "#60a5fa", marginBottom: 16 }}
              />
              <Title level={4} style={{ color: "white", marginBottom: 8 }}>
                Tiết kiệm thông minh
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                Mua sắm thông minh, bảo vệ môi trường
              </Text>
            </Col>
          </Row>
        </div>
      </div>

      <style jsx>{`
        .category-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </Layout>
  );
};

export default HomePage;
