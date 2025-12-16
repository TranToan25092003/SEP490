import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAvailableTimeSlots } from "@/api/bookings";
import { createWarrantyBooking } from "@/api/warranty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import BackButton from "@/components/global/BackButton";
import { Spinner } from "@/components/ui/spinner";
import { Motorbike, Calendar, Clock, Shield, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TimeSlotSelectionStep from "@/components/customer/booking/TimeSlotSelectionStep";
import { useForm, FormProvider } from "react-hook-form";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const WarrantyBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vehicleId, serviceOrderId, selectedParts, vehicle } = location.state || {};

  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    defaultValues: {
      timeslot: null,
    },
  });

  const selectedTimeslot = methods.watch("timeslot", null);

  useEffect(() => {
    if (!vehicleId || !serviceOrderId || !selectedParts || selectedParts.length === 0) {
      toast.error("Thông tin không hợp lệ. Vui lòng quay lại trang trước.");
      navigate("/profile?tab=history");
    }
  }, [vehicleId, serviceOrderId, selectedParts, navigate]);

  const fetchAvailableTimeSlots = async (day, month, year) => {
    try {
      const data = await getAvailableTimeSlots(day, month, year);
      return data;
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Không thể tải khung giờ. Vui lòng thử lại.");
      return { timeSlots: [], comment: "" };
    }
  };

  const handleSubmit = async (data) => {
    if (!selectedTimeslot) {
      toast.error("Vui lòng chọn thời gian hẹn");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createWarrantyBooking({
        vehicleId,
        serviceOrderId,
        selectedParts,
        timeSlot: {
          day: selectedTimeslot.day,
          month: selectedTimeslot.month,
          year: selectedTimeslot.year,
          hours: selectedTimeslot.hours,
          minutes: selectedTimeslot.minutes,
        },
      });

      toast.success("Đặt lịch bảo hành thành công!");
      navigate("/profile?tab=history");
    } catch (error) {
      console.error("Error creating warranty booking:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!vehicleId || !serviceOrderId || !selectedParts || selectedParts.length === 0) {
    return null;
  }

  return (
    <Container className="space-y-6 my-8">
      <BackButton to="/profile?tab=history" label="Quay lại lịch sử sửa xe" />
      <H3 className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        Đặt Lịch Bảo Hành
      </H3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin bên trái */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Thông Tin Bảo Hành</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Thông tin xe */}
            <div className="flex items-start gap-3">
              <Motorbike className="size-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Phương tiện</p>
                <p className="font-semibold">
                  {vehicle?.brand || "N/A"} {vehicle?.model || ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  Biển số: {vehicle?.licensePlate || "N/A"}
                </p>
              </div>
            </div>

            {/* Danh sách phụ tùng */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="size-5 text-primary" />
                <p className="text-sm font-semibold">Phụ tùng bảo hành:</p>
              </div>
              <div className="space-y-1 pl-7">
                {selectedParts.map((part, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{part.quantity}x</Badge>
                    <span className="text-sm">{part.partName}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form đặt lịch bên phải */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chọn Thời Gian</CardTitle>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(handleSubmit)}>
                <TimeSlotSelectionStep
                  fetchAvailableTimeSlots={fetchAvailableTimeSlots}
                />

                <div className="mt-6 flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/profile?tab=history")}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedTimeslot || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Đặt Lịch Bảo Hành"
                    )}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default WarrantyBooking;

