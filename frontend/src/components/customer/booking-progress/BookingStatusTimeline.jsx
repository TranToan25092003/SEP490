import { useState } from "react";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { cn, formatDateTime } from "@/lib/utils";
import { Clock } from "lucide-react";
import { Check } from "lucide-react";
import EmptyState from "@/components/global/EmptyState";
import { MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

/**
 * BookingStatusTimeline component to display progress timeline
 * with steps and detailed content for each step
 * @param {Object} props
 * @param {Object} props.booking - Booking data
 * @param {Array} props.tasks - Array of service tasks
 * @param {string} props.className - Additional CSS classes
 */
const BookingStatusTimeline = ({
  booking,
  tasks = [],
  className,
  ...props
}) => {
  const inspectionTask = tasks.find(t => t.type === "inspection");
  const servicingTask = tasks.find(t => t.type === "servicing");

  const steps = [
    {
      id: "reception",
      label: "Tiếp nhận",
    },
    {
      id: "inspection",
      label: "Kiểm tra",
      task: inspectionTask,
    },
    {
      id: "waiting_approval",
      label: "Chờ duyệt báo giá"
    },
    {
      id: "servicing",
      label: "Sửa chữa",
      task: servicingTask,
    },
    {
      id: "completed",
      label: "Hoàn thành"
    },
  ];

  const getCurrentStepIndex = () => {
    if (booking.status === "completed") return 5;
    else if (booking.serviceOrderStatus === "waiting_customer_approval" || booking.serviceOrderStatus === "approved") return 2;
    else if (servicingTask) return 3;
    else if (inspectionTask) return 1;

    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();
  const [selectedStepIndex, setSelectedStepIndex] = useState(() => {
    const idx = getCurrentStepIndex();
    if (idx === 4) return idx - 1;
    return idx;
  });

  const handleStepClick = (index) => {
    setSelectedStepIndex(index === selectedStepIndex ? null : index);
  };

  const selectedStep = selectedStepIndex !== null ? steps[selectedStepIndex] : null;

  const renderStepContent = () => {
    if (!selectedStep) {
      return (
        <EmptyState
          icon={MousePointer}
          title="Chưa chọn bước nào"
          subtitle="Nhấp vào một bước trong tiến độ để xem chi tiết."
        />
      );
    }

    if (selectedStep.id === "reception") {
      return (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground mb-4">
            Tiếp nhận
          </h4>
          {booking.status === "booked" && (
            <EmptyState
              icon={Clock}
              title="Chưa tiếp nhận"
              subtitle="Xe chưa được tiếp nhận, vui lòng đến gara đúng thời gian đã hẹn."
            />
          )}
          {booking.status === "checked_in" && (
            <EmptyState
              icon={Check}
              title="Đã tiếp nhận"
              subtitle="Xe đã được tiếp nhận"
            />
          )}
          {booking.status === "cancelled" && !inspectionTask && (
            <EmptyState
              icon={XCircle}
              title="Đã hủy"
              subtitle="Đơn đặt lịch đã bị hủy trước khi tiếp nhận"
            />
          )}
        </div>
      );
    }

    if (selectedStep.id === "inspection") {
      if (!inspectionTask) {
        return (
          <EmptyState
            icon={Clock}
            title="Chưa bắt đầu kiểm tra"
            subtitle="Xe chưa được kiểm tra. Thông tin sẽ được cập nhật sau."
          />
        );
      }

      if (inspectionTask.status === "scheduled") {
        return (
          <EmptyState
            icon={Clock}
            title="Đã lên lịch kiểm tra"
            subtitle="Xe đã được lên lịch kiểm tra. Thông tin sẽ được cập nhật sau."
          />
        );
      }

      if (inspectionTask.status === "in_progress") {
        return (
          <EmptyState
            icon={Clock}
            title="Đang kiểm tra"
            subtitle="Xe đang được kiểm tra. Vui lòng chờ kết quả."
          />
        );
      }

      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-foreground">
              Kết quả kiểm tra
            </h4>
          </div>

          {inspectionTask.comment && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h5 className="text-sm font-semibold mb-2">Nhận xét của kỹ thuật viên</h5>
              <p className="text-sm">{inspectionTask.comment}</p>
            </div>
          )}

          {inspectionTask.media && inspectionTask.media.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold mb-3">
                Hình ảnh kiểm tra ({inspectionTask.media.length})
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inspectionTask.media.map((mediaItem) => (
                  <div
                    key={mediaItem.url || mediaItem.publicId}
                    className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border hover:shadow-lg transition-shadow duration-200"
                  >
                    <img
                      src={mediaItem.url}
                      alt="Inspection"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {inspectionTask.status === "in_progress" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Xe đang được kiểm tra. Vui lòng chờ kết quả.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedStep.id === "waiting_approval") {
      if (booking.serviceOrderStatus === "waiting_customer_approval") {
        return (
          <div className="flex flex-col items-center">
            <EmptyState
              icon={Clock}
              title="Chờ phê duyệt báo giá"
              subtitle="Vui lòng xem chi tiết báo giá và phê duyệt để tiếp tục quá trình sửa chữa."
            />

            <Link to={`/booking/${booking.id}/quotes`}>
              <Button>Chi tiết báo giá</Button>
            </Link>
          </div>
        );
      } else {
        return (
          <EmptyState
            icon={Check}
            title="Hiện tại không có báo giá chờ phê duyệt"
            subtitle="Tất cả báo giá đã được phê duyệt hoặc không có báo giá nào được tạo."
          />
        );
      }
    }

    if (selectedStep.id === "servicing") {
      if (!servicingTask) {
        return (
          <EmptyState
            icon={Clock}
            title="Chưa bắt đầu sửa chữa"
            subtitle="Xe chưa được sửa chữa. Thông tin sẽ được cập nhật sau."
          />
        );
      }

      if (servicingTask.status === "scheduled") {
        return (
          <EmptyState
            icon={Clock}
            title="Đã lên lịch sửa chữa"
            subtitle="Xe đã được lên lịch sửa chữa. Thông tin sẽ được cập nhật sau."
          />
        );
      }

      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-foreground">
              Tiến độ sửa chữa
            </h4>
          </div>

          {servicingTask.timeline && servicingTask.timeline.length > 0 ? (
            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {servicingTask.timeline.map((entry) => (
                  <div key={entry.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />

                    <div className="bg-muted/50 rounded-lg pt-1 px-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h6 className="font-medium text-sm">{entry.title}</h6>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                      {entry.comment && (
                        <p className="text-sm text-muted-foreground">
                          {entry.comment}
                        </p>
                      )}

                      {entry.media && entry.media.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {entry.media.map((mediaItem) => (
                            <img
                              key={mediaItem.url || mediaItem.publicId}
                              src={mediaItem.url}
                              alt={mediaItem.kind}
                              className="w-full h-40 object-cover rounded-md"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            servicingTask.status === "in_progress" && (
              <EmptyState
                icon={Clock}
                title="Đang sửa chữa"
                subtitle="Xe đang được sửa chữa. Tiến độ sẽ được cập nhật sớm."
              />
            )
          )}
        </div>
      );
    }

    if (selectedStep.id === "completed") {
      if (booking.status === "completed") {
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Hoàn thành
            </h4>
            <EmptyState
              icon={Check}
              title="Đã hoàn thành"
              subtitle="Xe đã được sửa chữa và hoàn tất. Vui lòng đến gara để nhận xe."
            />
          </div>
        );
      } else {
        return (
          <EmptyState
            icon={Clock}
            title="Chưa hoàn thành"
            subtitle="Xe chưa được hoàn thành sửa chữa. Thông tin sẽ được cập nhật sau."
          />
        );
      }
    }

    return null;
  };

  return (
    <div className={className} {...props}>
        <h3 className="text-xl font-bold text-foreground mb-6">Tiến độ</h3>

        <div className="mb-12">
          <Stepper currentStep={currentStepIndex} variant="destructive" className="w-full">
            {steps.map((step, index) => (
              <StepperItem
                key={step.id}
                step={index}
                title={step.label}
                className={cn(
                  "flex-1 cursor-pointer transition-opacity",
                  selectedStepIndex === index && "opacity-100",
                  selectedStepIndex !== null && selectedStepIndex !== index && "opacity-50"
                )}
                onClick={() => handleStepClick(index)}
              />
            ))}
          </Stepper>
        </div>

        <div className="mt-8 ">
          {renderStepContent()}
        </div>
    </div>
  );
};

BookingStatusTimeline.displayName = "BookingStatusTimeline";
export default BookingStatusTimeline;
