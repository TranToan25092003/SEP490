// src/pages/SellerList.jsx
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import FollowButton from "@/components/global/FollowButton";
import { Skeleton } from "antd";
import { Users, TrendingUp, Star, MapPin, Calendar, Search } from "lucide-react";

// Styles tích hợp với layout cải tiến
const sellerListStyles = `
  .seller-card {
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 16px;
    overflow: hidden;
  }

  .seller-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.06);
    border-color: #3b82f6;
  }

  .seller-avatar {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .seller-avatar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 50%;
  }

  .seller-card:hover .seller-avatar::before {
    opacity: 1;
  }

  .seller-card:hover .seller-avatar img {
    transform: scale(1.08);
  }

  .seller-stats {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .seller-badge {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .search-container {
    position: relative;
    max-width: 500px;
    margin: 0 auto;
  }

  .search-input {
    width: 100%;
    padding: 16px 20px 16px 52px;
    border: 2px solid #e5e7eb;
    border-radius: 50px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .search-icon {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
  }

  /* Responsive Grid System */
  .sellers-grid {
    display: grid;
    gap: 28px;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Grid breakpoints */
  @media (min-width: 1200px) {
    .sellers-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: 768px) and (max-width: 1199px) {
    .sellers-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 767px) {
    .sellers-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    gap: 20px;
    margin-bottom: 40px;
  }

  @media (min-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 767px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
  }

  .stat-card {
    background: white;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #f1f5f9;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  }

  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-value {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #1e40af, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 600;
  }

  .animate-fade-in {
    animation: fadeIn 0.6s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Card content layout */
  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 20px;
  }

  .card-info {
    flex: 1;
    min-width: 0;
  }

  .card-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 12px;
    line-height: 1.3;
  }

  .card-stats-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .card-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
  }

  .card-detail-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 14px;
  }

  .activity-section {
    background: #f8fafc;
    padding: 16px;
    border-radius: 12px;
    margin-top: 16px;
  }

  .activity-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: 8px;
  }

  .activity-label {
    font-size: 13px;
    color: #64748b;
    font-weight: 600;
  }

  .activity-percentage {
    font-size: 13px;
    font-weight: 700;
    color: #3b82f6;
  }

  .progress-bar {
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 4px;
    transition: width 0.8s ease;
    position: relative;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shine 2s infinite;
  }

  @keyframes shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 64px 24px;
    max-width: 480px;
    margin: 0 auto;
  }

  .empty-icon {
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, #dbeafe, #e0e7ff);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 32px;
  }

  .empty-title {
    font-size: 28px;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 16px;
  }

  .empty-description {
    font-size: 18px;
    color: #64748b;
    line-height: 1.6;
  }

  /* Results info */
  .results-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 32px;
    padding: 16px 24px;
    background: white;
    border-radius: 50px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #f1f5f9;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 32px;
  }

  .results-text {
    font-size: 16px;
    font-weight: 600;
    color: #475569;
  }

  /* Mobile optimizations */
  @media (max-width: 767px) {
    .card-header {
      gap: 16px;
    }

    .card-title {
      font-size: 18px;
    }

    .card-stats-row {
      gap: 8px;
    }

    .seller-stats {
      font-size: 11px;
      padding: 3px 8px;
    }

    .seller-badge {
      font-size: 9px;
      padding: 2px 6px;
    }

    .activity-section {
      padding: 12px;
    }

    .stat-card {
      padding: 20px 16px;
    }

    .stat-value {
      font-size: 28px;
    }

    .empty-state {
      padding: 48px 20px;
    }

    .empty-icon {
      width: 100px;
      height: 100px;
    }

    .empty-title {
      font-size: 24px;
    }

    .empty-description {
      font-size: 16px;
    }
  }
`;

export default function SellerList() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSellers, setFilteredSellers] = useState([]);

  // Inject styles
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = sellerListStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/with-posts");
        const data = await res.json();
        if (data.success) {
          setSellers(data.users);
          setFilteredSellers(data.users);
        }
      } catch (err) {
        console.error("Lỗi khi lấy danh sách người đăng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  // Filter sellers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSellers(sellers);
    } else {
      const filtered = sellers.filter(seller =>
        seller.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSellers(filtered);
    }
  }, [searchTerm, sellers]);

  // Calculate stats
  const totalSellers = sellers.length;
  const totalPosts = sellers.reduce((sum, seller) => sum + (seller.totalPosts || 0), 0);
  const avgPosts = totalSellers > 0 ? Math.round(totalPosts / totalSellers) : 0;
  const topSeller = sellers.reduce((max, seller) => 
    (seller.totalPosts || 0) > (max.totalPosts || 0) ? seller : max, sellers[0] || {}
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <Skeleton.Avatar size={64} />
              <Skeleton active paragraph={{ rows: 2 }} className="mt-4" />
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="stats-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stat-card">
                <Skeleton active paragraph={{ rows: 1 }} />
              </div>
            ))}
          </div>
          <div className="sellers-grid">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="seller-card p-6">
                <Skeleton active avatar paragraph={{ rows: 2 }} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Cộng đồng người bán
              </h1>
            </div>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
              Khám phá những người bán tích cực nhất trong cộng đồng của chúng tôi
            </p>
          </div>

          {/* Search Bar */}
          <div className="search-container mt-12">
            <div className="relative">
              <Search className="search-icon w-6 h-6" />
              <input
                type="text"
                placeholder="Tìm kiếm người bán..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon bg-gradient-to-r from-blue-500 to-blue-600">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="stat-value">{totalSellers}</div>
            <div className="stat-label">Người bán</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-gradient-to-r from-green-500 to-green-600">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div className="stat-value">{totalPosts}</div>
            <div className="stat-label">Bài đăng</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-gradient-to-r from-purple-500 to-purple-600">
              <Star className="w-7 h-7 text-white" />
            </div>
            <div className="stat-value">{avgPosts}</div>
            <div className="stat-label">Trung bình/người</div>
          </div>

          {topSeller.name && (
            <div className="stat-card">
              <div className="stat-icon bg-gradient-to-r from-yellow-500 to-yellow-600">
                <Star className="w-7 h-7 text-white" />
              </div>
              <div className="stat-value">{topSeller.totalPosts}</div>
              <div className="stat-label">Top: {topSeller.name}</div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="results-info">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="results-text">
            {searchTerm ? `Tìm thấy ${filteredSellers.length} kết quả` : `${totalSellers} người bán đang hoạt động`}
          </span>
        </div>

        {/* Sellers Grid */}
        {filteredSellers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Users className="w-16 h-16 text-blue-400" />
            </div>
            <h3 className="empty-title">
              {searchTerm ? "Không tìm thấy kết quả" : "Chưa có người bán nào"}
            </h3>
            <p className="empty-description">
              {searchTerm ? "Thử tìm kiếm với từ khóa khác nhé" : "Chờ các thành viên đăng bài đầu tiên"}
            </p>
          </div>
        ) : (
          <div className="sellers-grid">
            {filteredSellers.map((user, index) => (
              <Card
                key={user.userId}
                className={`seller-card p-6 animate-fade-in`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="card-header">
                  {/* Avatar */}
                  <div className="seller-avatar flex-shrink-0">
                    <img
                      src={user.imageUrl || "/fallback.jpg"}
                      alt={user.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  </div>

                  {/* Info */}
                  <div className="card-info">
                    <h3 className="card-title">
                      {user.name || "Người dùng ẩn danh"}
                    </h3>
                    <div className="card-stats-row">
                      <span className="seller-stats">
                        <TrendingUp className="w-3 h-3" />
                        {user.totalPosts} bài đăng
                      </span>
                      {user.totalPosts > 10 && (
                        <span className="seller-badge">Hot</span>
                      )}
                    </div>
                    <div className="flex justify-end mt-2">
                      <FollowButton targetUserId={user.userId} />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="card-details">
                  <div className="card-detail-item">
                    <Calendar className="w-4 h-4" />
                    <span>Tham gia từ {new Date().getFullYear()}</span>
                  </div>
                  <div className="card-detail-item">
                    <MapPin className="w-4 h-4" />
                    <span>Việt Nam</span>
                  </div>
                </div>

                {/* Activity Level */}
                <div className="activity-section">
                  <div className="activity-header">
                    <span className="activity-label">Mức độ hoạt động</span>
                    <span className="activity-percentage">
                      {Math.round((user.totalPosts / Math.max(topSeller.totalPosts || 1, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${Math.min((user.totalPosts / Math.max(topSeller.totalPosts || 1, 1)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}