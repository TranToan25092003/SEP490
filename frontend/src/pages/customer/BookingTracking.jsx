import { Suspense, useState, useMemo } from "react";
import { Await, Link, useLoaderData } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import {
  Calendar,
  Motorbike,
  Clock,
  LogIn,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { H3 } from "@/components/ui/headings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translateBookingStatus } from "@/utils/enumsTranslator";
import { StatusBadge } from "@/components/global/StatusBadge";
import { getUserBookings } from "@/api/bookings";
import { getUserVehiclesWithAvailability } from "@/api/vehicles";
import clerk from "@/utils/clerk";
import background from "@/assets/cool-motorcycle-indoors.png";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (start, end) => {
  if (!start || !end) return "N/A";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getHours().toString().padStart(2, "0")}:${s
    .getMinutes()
    .toString()
    .padStart(2, "0")} - ${e.getHours().toString().padStart(2, "0")}:${e
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

export function loader() {
  if (!clerk.isSignedIn) {
    return {
      bookingsPromise: Promise.resolve([]),
      vehiclesPromise: Promise.resolve([]),
    };
  }

  return {
    bookingsPromise: getUserBookings(),
    vehiclesPromise: getUserVehiclesWithAvailability(),
  };
}

const BookingList = ({ bookings, vehicles }) => {
  // State cho filter và phân trang
  const [searchText, setSearchText] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Áp dụng filter và phân trang
  const { filteredBookings, totalPages, startIndex, endIndex, currentBookings } =
    useMemo(() => {
      if (!bookings || bookings.length === 0) {
        return {
          filteredBookings: [],
          totalPages: 0,
          startIndex: 0,
          endIndex: 0,
          currentBookings: [],
        };
      }

      // Áp dụng filter
      let filtered = bookings.filter((booking) => {
        // Filter theo tìm kiếm
        if (searchText) {
          const searchLower = searchText.toLowerCase();
          const matchesSearch =
            booking.id?.toLowerCase().includes(searchLower) ||
            booking.vehicle?.licensePlate?.toLowerCase().includes(searchLower) ||
            booking.vehicle?.brand?.toLowerCase().includes(searchLower) ||
            booking.vehicle?.model?.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Filter theo xe
        if (selectedVehicleId !== "all") {
          const vehicleId = booking.vehicle?.id || booking.vehicle?._id;
          if (vehicleId !== selectedVehicleId) return false;
        }

        // Filter theo trạng thái
        if (selectedStatus !== "all") {
          if (booking.status !== selectedStatus) return false;
        }

        return true;
      });

      // Tính toán phân trang
      const total = Math.ceil(filtered.length / itemsPerPage);
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const current = filtered.slice(start, end);

      return {
        filteredBookings: filtered,
        totalPages: total,
        startIndex: start,
        endIndex: end,
        currentBookings: current,
      };
    }, [bookings, searchText, selectedVehicleId, selectedStatus, currentPage, itemsPerPage]);

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Bạn chưa có lịch hẹn nào. Hãy tạo đặt lịch mới!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thanh filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Bộ Lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tìm kiếm */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã đơn, biển số..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Lọc theo xe */}
            <Select
              value={selectedVehicleId}
              onValueChange={(value) => {
                setSelectedVehicleId(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả xe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả xe</SelectItem>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Lọc theo trạng thái */}
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="booked">Đã đặt</SelectItem>
                <SelectItem value="checked_in">Đã tiếp nhận</SelectItem>
                <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nút xóa filter */}
          {(searchText ||
            selectedVehicleId !== "all" ||
            selectedStatus !== "all") && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchText("");
                  setSelectedVehicleId("all");
                  setSelectedStatus("all");
                  setCurrentPage(1);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danh sách booking */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Không tìm thấy kết quả
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Không có đơn đặt lịch nào phù hợp với bộ lọc của bạn.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchText("");
                setSelectedVehicleId("all");
                setSelectedStatus("all");
                setCurrentPage(1);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Xóa bộ lọc
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {currentBookings.map((booking) => (
              <Link
                to={`/booking/${booking.id}`}
                key={booking.id}
                className="block group"
              >
                <Card className="transition-all group-hover:border-primary group-hover:shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Mã đơn: {booking.id?.slice(-8) || "N/A"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {booking.vehicle?.licensePlate || "Biển số: N/A"}
                      </p>
                    </div>
                    <StatusBadge 
                      status={translateBookingStatus(booking.status)} 
                      colorKey={booking.status}
                    />
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <Motorbike className="size-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phương tiện</p>
                        <p className="font-semibold">
                          {booking.vehicle?.brand || "N/A"}{" "}
                          {booking.vehicle?.model || ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Năm {booking.vehicle?.year || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="size-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ngày hẹn</p>
                        <p className="font-semibold">
                          {formatDate(booking.slotStartTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="size-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Khung giờ</p>
                        <p className="font-semibold">
                          {formatTime(booking.slotStartTime, booking.slotEndTime)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Hiển thị {startIndex + 1} -{" "}
                {Math.min(endIndex, filteredBookings.length)} trong tổng số{" "}
                {filteredBookings.length} đơn
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={
                          currentPage === page ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[2.5rem]"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const BookingTracking = () => {
  const { bookingsPromise, vehiclesPromise } = useLoaderData();

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "65% 35%",
      }}
    >
      <div className="w-full max-w-6xl">
        <Card className="w-full shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <H3>Theo Dõi Đơn Dịch Vụ</H3>
              <Button asChild>
                <Link to="/booking">Đặt lịch mới</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <SignedIn>
              <Suspense
                fallback={
                  <div className="flex justify-center py-10">
                    <Spinner className="size-8" />
                  </div>
                }
              >
                <Await
                  resolve={Promise.all([bookingsPromise, vehiclesPromise])}
                  errorElement={
                    <Card>
                      <CardContent className="py-10 text-center text-destructive">
                        Không thể tải danh sách đặt lịch. Vui lòng thử lại sau.
                      </CardContent>
                    </Card>
                  }
                >
                  {([bookings, vehicles]) => (
                    <BookingList bookings={bookings} vehicles={vehicles} />
                  )}
                </Await>
              </Suspense>
            </SignedIn>

            <SignedOut>
              <Card className="py-12 text-center space-y-4">
                <LogIn className="mx-auto size-10 text-primary" />
                <p className="text-lg font-semibold">
                  Hãy đăng nhập để xem tiến độ các đơn đặt lịch của bạn
                </p>
                <Button asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
              </Card>
            </SignedOut>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

BookingTracking.loader = loader;

export default BookingTracking;
