import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Circle, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { translateTaskStatus } from "@/utils/enumsTranslator";
import CountdownTimer from "@/components/global/CountdownTimer";

const BookingProgressTimeline = ({ booking, tasks }) => {
  const [selectedStep, setSelectedStep] = useState(null);

  // Find tasks
  const inspectionTask = tasks.find((t) => t.type === "inspection");
  const servicingTask = tasks.find((t) => t.type === "servicing");

  // Define the 4 fixed steps
  const steps = [
    {
      id: "reception",
      label: "Tiếp nhận",
      status: booking ? "completed" : "pending",
      timestamp: booking?.createdAt,
      description: "Xe đã được tiếp nhận vào hệ thống",
    },
    {
      id: "inspection",
      label: "Kiểm tra",
      status: inspectionTask?.status || "pending",
      timestamp: inspectionTask?.completedAt || inspectionTask?.actualStart,
      task: inspectionTask,
      description: "Kiểm tra tình trạng xe và xác định công việc cần làm",
    },
    {
      id: "servicing",
      label: "Sửa chữa",
      status: servicingTask?.status || "pending",
      timestamp: servicingTask?.completedAt || servicingTask?.actualStart,
      task: servicingTask,
      description: "Thực hiện các công việc sửa chữa và bảo dưỡng",
    },
    {
      id: "completed",
      label: "Hoàn thành",
      status: booking?.status === "completed" ? "completed" : "pending",
      timestamp: booking?.status === "completed" ? booking.updatedAt : null,
      description: "Xe đã hoàn thành sửa chữa và sẵn sàng giao lại",
    },
  ];

  // Determine current active step
  const getCurrentStepIndex = () => {
    if (booking?.status === "completed") return 3;
    if (servicingTask?.status === "in_progress") return 2;
    if (servicingTask?.status === "completed") return 2;
    if (inspectionTask?.status === "in_progress") return 1;
    if (inspectionTask?.status === "completed") return 1;
    if (booking) return 0;
    return -1;
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepIcon = (step, index) => {
    if (step.status === "completed") {
      return <Check className="w-5 h-5 text-white" />;
    }
    if (index === currentStepIndex && step.status === "in_progress") {
      return <Clock className="w-5 h-5 text-white animate-pulse" />;
    }
    return <Circle className="w-5 h-5 text-white" />;
  };

  const getStepColor = (step, index) => {
    if (step.status === "completed") return "bg-green-500";
    if (index === currentStepIndex) return "bg-blue-500";
    return "bg-gray-300";
  };

  const handleStepClick = (step) => {
    // Only allow clicking on inspection and servicing steps if they have data
    if (step.id === "inspection" && inspectionTask) {
      setSelectedStep(step);
    } else if (step.id === "servicing" && servicingTask) {
      setSelectedStep(step);
    } else if (step.id === "reception" || step.id === "completed") {
      setSelectedStep(step);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side - Timeline steps */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-lg">Tiến trình</h3>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-8">
                {steps.map((step, index) => (
                  <button
                    type="button"
                    key={step.id}
                    className={cn(
                      "relative pl-12 w-full text-left transition-all",
                      selectedStep?.id === step.id && "scale-105",
                      (step.task ||
                        step.id === "reception" ||
                        step.id === "completed") &&
                        "hover:bg-accent/50 rounded-lg p-2 -ml-2"
                    )}
                    onClick={() => handleStepClick(step)}
                  >
                    {/* Step icon */}
                    <div
                      className={cn(
                        "absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-background",
                        getStepColor(step, index)
                      )}
                    >
                      {getStepIcon(step, index)}
                    </div>

                    {/* Step content */}
                    <div>
                      <h4 className="font-semibold text-sm">{step.label}</h4>
                      {step.timestamp && (
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(step.timestamp)}
                        </p>
                      )}
                      {step.status === "in_progress" && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-blue-600">
                            Đang thực hiện
                          </span>
                          {step.id === "inspection" &&
                            inspectionTask?.expectedEndTime && (
                              <CountdownTimer
                                targetTime={inspectionTask.expectedEndTime}
                                label="Còn lại"
                                compact
                              />
                            )}
                          {step.id === "servicing" &&
                            servicingTask?.expectedEndTime && (
                              <CountdownTimer
                                targetTime={servicingTask.expectedEndTime}
                                label="Còn lại"
                                compact
                              />
                            )}
                        </div>
                      )}
                      {step.status === "completed" && (
                        <span className="text-xs font-medium text-green-600">
                          Đã hoàn thành
                        </span>
                      )}
                      {step.status === "scheduled" && (
                        <span className="text-xs font-medium text-orange-600">
                          Đã lên lịch
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Details */}
      <div className="lg:col-span-2">
        {selectedStep ? (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-lg">{selectedStep.label}</h3>
              {selectedStep.timestamp && (
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(selectedStep.timestamp)}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {/* Reception details */}
              {selectedStep.id === "reception" && (
                <div className="space-y-4">
                  <p className="text-sm">{selectedStep.description}</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">
                      Thông tin tiếp nhận
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Mã đặt lịch:{" "}
                        </span>
                        <span className="font-mono">
                          {booking?.id?.slice(-8)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Thời gian:{" "}
                        </span>
                        <span>{formatDateTime(booking?.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Biển số xe:{" "}
                        </span>
                        <span className="font-semibold">
                          {booking?.vehicle?.licensePlate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inspection details */}
              {selectedStep.id === "inspection" && inspectionTask && (
                <div className="space-y-4">
                  <p className="text-sm">{selectedStep.description}</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">
                        Kết quả kiểm tra
                      </h4>
                      <span className="text-xs font-medium text-muted-foreground">
                        {translateTaskStatus(inspectionTask.status)}
                      </span>
                    </div>
                    {inspectionTask.expectedEndTime && (
                      <div className="mb-3">
                        <CountdownTimer
                          targetTime={inspectionTask.expectedEndTime}
                          label="Thời gian còn lại cho bước kiểm tra"
                          compact
                        />
                      </div>
                    )}
                    {inspectionTask.comment && (
                      <p className="text-sm mb-4">{inspectionTask.comment}</p>
                    )}
                    {inspectionTask.media &&
                      inspectionTask.media.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">
                            Hình ảnh kiểm tra
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {inspectionTask.media.map((mediaItem) => (
                              <img
                                key={mediaItem.url || mediaItem.publicId}
                                src={mediaItem.url}
                                alt="Inspection"
                                className="w-full h-32 object-cover rounded-md"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Servicing details with timeline */}
              {selectedStep.id === "servicing" && servicingTask && (
                <div className="space-y-4">
                  <p className="text-sm">{selectedStep.description}</p>

                  {/* Countdown timer - Always show when in_progress */}
                  {servicingTask.status === "in_progress" &&
                    servicingTask.expectedEndTime && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">
                            Thời gian còn lại
                          </h4>
                        </div>
                        <CountdownTimer
                          targetTime={servicingTask.expectedEndTime}
                          label="Thời gian còn lại cho bước sửa chữa"
                          compact
                        />
                      </div>
                    )}

                  {/* Initial servicing info */}
                  {servicingTask.comment && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2">
                        Thông tin sửa chữa
                      </h4>
                      <p className="text-sm">{servicingTask.comment}</p>
                      {servicingTask.media &&
                        servicingTask.media.length > 0 && (
                          <div className="mt-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {servicingTask.media.map((mediaItem) => (
                                <img
                                  key={mediaItem.url || mediaItem.publicId}
                                  src={mediaItem.url}
                                  alt="Servicing"
                                  className="w-full h-32 object-cover rounded-md"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Timeline entries */}
                  {servicingTask.timeline &&
                    servicingTask.timeline.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-3">
                          Tiến độ chi tiết
                        </h4>
                        <div className="relative">
                          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                          <div className="space-y-6">
                            {servicingTask.timeline.map((entry, idx) => (
                              <div
                                key={entry.id || idx}
                                className="relative pl-8"
                              >
                                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />

                                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="font-medium text-sm">
                                      {entry.title}
                                    </h5>
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
                                          key={
                                            mediaItem.url || mediaItem.publicId
                                          }
                                          src={mediaItem.url}
                                          alt={mediaItem.kind}
                                          className="w-full h-24 object-cover rounded-md"
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Completed details */}
              {selectedStep.id === "completed" && (
                <div className="space-y-4">
                  <p className="text-sm">{selectedStep.description}</p>
                  {booking?.status === "completed" &&
                    selectedStep.timestamp && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-sm text-green-800 mb-2">
                          Hoàn tất sửa chữa
                        </h4>
                        <p className="text-sm text-green-700">
                          Xe của bạn đã được sửa chữa hoàn tất vào{" "}
                          {formatDateTime(selectedStep.timestamp)}. Vui lòng đến
                          nhận xe theo thời gian đã hẹn.
                        </p>
                      </div>
                    )}
                  {booking?.status !== "completed" && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Xe đang trong quá trình sửa chữa. Chúng tôi sẽ thông báo
                        khi hoàn tất.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pending state */}
              {selectedStep.id === "inspection" && !inspectionTask && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa bắt đầu kiểm tra</p>
                </div>
              )}
              {selectedStep.id === "servicing" && !servicingTask && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa bắt đầu sửa chữa</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Chọn một bước để xem chi tiết</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookingProgressTimeline;
