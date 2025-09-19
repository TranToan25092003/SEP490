import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { customFetch } from "@/utils/customAxios";
import { useAuth, useUser } from '@clerk/clerk-react'; // Import useUser
import { AlertCircle, FileText, User, Star, Mail, Search, Send } from 'lucide-react';

const CreateReportPage = () => {
  const { userId } = useAuth();
  const { user } = useUser(); // Lấy thông tin người dùng từ useUser
  const currentUserId = userId;
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress; // Lấy email chính của người dùng hiện tại

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reportType, setReportType] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [itemId, setItemId] = useState('');
  const [rating, setRating] = useState('');
  const [items, setItems] = useState([]);
  const [reportedUserEmail, setReportedUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReportTypeChange = (value) => {
    setReportType(value);
    setSellerEmail('');
    setItemId('');
    setRating('');
    setItems([]);
    setReportedUserEmail('');
  };

  const fetchSellerAndItems = async () => {
    if (!sellerEmail) {
      toast.error("Vui lòng nhập Gmail người bán.");
      return;
    }

     try {
      const resUser = await customFetch.get(`/users/by-email/${sellerEmail}`);
      const sellerClerkId = resUser.data?.id; // Đổi tên biến để rõ ràng hơn

      if (!sellerClerkId) {
        toast.error("Không tìm thấy người dùng với email này.");
        return;
      }

      const resItems = await customFetch.get(`/items/by-owner/${sellerClerkId}`);
      let itemList = resItems.data?.data || [];

      // 1. Logic ngăn chặn tự đánh giá sản phẩm của chính mình
      // 2. Logic chỉ hiển thị sản phẩm có ảnh
      const filteredItems = itemList.filter(item =>
        item.owner !== currentUserId && // Lọc bỏ sản phẩm của chính người dùng
        item.images && item.images.length > 0 // Lọc bỏ sản phẩm không có ảnh
      );

      if (filteredItems.length === 0) {
          if (itemList.length > 0) {
              toast.warning("Người bán này chỉ có sản phẩm của bạn, hoặc các sản phẩm không có ảnh. Bạn không thể tự đánh giá sản phẩm của mình hoặc chọn sản phẩm không có ảnh.");
          } else {
              toast.warning("Người bán này chưa có sản phẩm nào.");
          }
      }

      setItems(filteredItems);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tìm người dùng hoặc sản phẩm.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để gửi báo cáo.");
      setIsLoading(false);
      return;
    }

    const reportData = {
      title,
      description,
      userId: currentUserId,
      reportType,
    };

    if (reportType === 'item_feedback') {
      if (!itemId || !rating) {
        toast.error("Vui lòng chọn sản phẩm và nhập đánh giá.");
        setIsLoading(false);
        return;
      }

      const parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        toast.error("Đánh giá phải từ 1 đến 5.");
        setIsLoading(false);
        return;
      }

      reportData.itemId = itemId;
      reportData.rating = parsedRating;
    } else if (reportType === 'user_behavior' || reportType === 'spam') {
      if (!reportedUserEmail) {
        toast.error("Vui lòng nhập email người bị báo cáo.");
        setIsLoading(false);
        return;
      }

      // THÊM LOGIC KIỂM TRA NGƯỜI DÙNG TỰ BÁO CÁO MÌNH
      if (currentUserEmail && reportedUserEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
        toast.error("Bạn không thể báo cáo chính mình.");
        setIsLoading(false);
        return;
      }

      reportData.reportedUserEmail = reportedUserEmail;
    }

    try {
      const res = await customFetch.post('/reports', reportData);
      toast.success(res.data?.message || "Báo cáo đã được gửi!");

      setTitle('');
      setDescription('');
      setReportType('');
      setSellerEmail('');
      setItems([]);
      setItemId('');
      setRating('');
      setReportedUserEmail('');
    } catch (err) {
      console.error("Lỗi khi gửi báo cáo:", err);
      let msg = "Đã xảy ra lỗi.";
      if (err.response?.data?.message) msg = err.response.data.message;
      if (err.response?.data?.violationDetected) {
        msg = "Nội dung vi phạm chính sách!";
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const reportTypeOptions = [
    { value: 'item_feedback', label: 'Phản hồi sản phẩm', icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'user_behavior', label: 'Hành vi người dùng', icon: User, color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'spam', label: 'Báo cáo spam', icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-50' }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Gửi Báo Cáo Mới
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Hãy chia sẻ phản hồi của bạn để giúp chúng tôi cải thiện trải nghiệm cho tất cả người dùng
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <h2 className="text-white text-xl font-semibold">Thông tin báo cáo</h2>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Title Input */}
            <div className="space-y-3">
              <Label htmlFor="title" className="text-gray-700 font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tiêu đề báo cáo
              </Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                placeholder="Nhập tiêu đề báo cáo của bạn..."
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-gray-700 font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Mô tả chi tiết
              </Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                className="min-h-[120px] border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl resize-none"
                placeholder="Hãy mô tả chi tiết về vấn đề bạn muốn báo cáo..."
              />
            </div>

            {/* Report Type */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">Loại báo cáo</Label>
              <Select value={reportType} onValueChange={handleReportTypeChange}>
                <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                  <SelectValue placeholder="Chọn loại báo cáo phù hợp" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${option.bgColor}`}>
                            <Icon className={`w-4 h-4 ${option.color}`} />
                          </div>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Item Feedback Section */}
            {reportType === 'item_feedback' && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-yellow-700 font-medium">
                  <Star className="w-5 h-5" />
                  Thông tin phản hồi sản phẩm
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="sellerEmail" className="text-gray-700 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Gmail người bán
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="sellerEmail"
                      value={sellerEmail}
                      onChange={(e) => {
                        setSellerEmail(e.target.value);
                        setItems([]);
                      }}
                      placeholder="seller@gmail.com"
                      className="h-12 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500 rounded-xl"
                    />
                    <Button 
                      type="button" 
                      onClick={fetchSellerAndItems}
                      className="h-12 px-6 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Tìm kiếm
                    </Button>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">Sản phẩm</Label>
                    <Select value={itemId} onValueChange={setItemId}>
                      <SelectTrigger className="h-12 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500 rounded-xl">
                        <SelectValue placeholder="Chọn sản phẩm bạn muốn đánh giá" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                           <SelectItem key={item._id} value={item._id}>
                            <div className="flex items-center gap-3">
                              {/* THAY THẾ BIỂU TƯỢNG BẰNG ẢNH SẢN PHẨM NẾU CÓ */}
                              {item.images && item.images.length > 0 ? (
                                <img
                                  src={item.images[0]} // Hiển thị ảnh đầu tiên
                                  alt={item.name}
                                  className="w-8 h-8 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Đánh giá (1–5 sao)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      min="1"
                      max="5"
                      className="w-20 h-12 text-center border-gray-200 focus:border-yellow-500 focus:ring-yellow-500 rounded-xl"
                    />
                    <div className="flex items-center gap-1">
                      {renderStars(parseInt(rating) || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Behavior / Spam Section */}
            {(reportType === 'user_behavior' || reportType === 'spam') && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-700 font-medium">
                  <AlertCircle className="w-5 h-5" />
                  Thông tin người bị báo cáo
                </div>
                
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email người bị báo cáo
                  </Label>
                  <Input
                    type="email"
                    value={reportedUserEmail}
                    onChange={(e) => setReportedUserEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={isLoading}
                onClick={handleSubmit}
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi báo cáo...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Gửi Báo Cáo
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>Cảm ơn bạn đã góp phần xây dựng cộng đồng tốt đẹp hơn! 🌟</p>
        </div>
      </div>
    </div>
  );
};

export default CreateReportPage;