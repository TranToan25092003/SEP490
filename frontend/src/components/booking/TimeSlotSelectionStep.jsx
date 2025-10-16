import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Clock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours} giờ ${mins} phút` : `${mins} phút`;
};

const formatTimeSlot = (slot) => {
  const hours = String(slot.hours).padStart(2, "0");
  const minutes = String(slot.minutes).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * @typedef {import("react").ComponentPropsWithRef<"div"> & {
 *   fetchAvailableTimeSlots: (day: number, month: number, year: number) => Promise<{
 *     timeSlots: Array<{hours: number, minutes: number, day: number, month: number, year: number, isAvailable: boolean}>;
 *     comment: string;
 *   }>;
 * }} TimeSlotSelectionStepProps
 */

/**
 * TimeSlotSelectionStep component for selecting date and time in the booking form.
 * Uses useFormContext to access form methods and state.
 * @param {TimeSlotSelectionStepProps} props
 */
const TimeSlotSelectionStep = ({ fetchAvailableTimeSlots, className, ...props }) => {
  const { setValue, watch } = useFormContext();
  const [date, setDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");

  const selectedTimeSlot = watch("timeslot");
  const services = watch("services", []);

  useEffect(() => {
    if (date) {
      loadAvailableSlots();
    }
  }, [date]);

  const loadAvailableSlots = async () => {
    if (!date) return;

    try {
      setLoading(true);
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();

      const data = await fetchAvailableTimeSlots(day, month, year);
      setAvailableSlots(data.timeSlots || []);
      setComment(data.comment || "");
    } catch (error) {
      console.error("Error fetching time slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotSelect = (slot) => {
    if (!slot.isAvailable) return;
    const clone = { ...slot };
    delete clone.isAvailable;
    setValue("timeslot", clone);
  };

  const isSlotSelected = (slot) => {
    if (!selectedTimeSlot) return false;
    return (
      selectedTimeSlot.hours === slot.hours &&
      selectedTimeSlot.minutes === slot.minutes &&
      selectedTimeSlot.day === slot.day &&
      selectedTimeSlot.month === slot.month &&
      selectedTimeSlot.year === slot.year
    );
  };

  const getTotalEstimatedTime = () => {
    return services.reduce((sum, service) => sum + service.estimatedTime, 0);
  };


  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="text-center mb-6">
        <h1>
          <span className="text-2xl font-bold">Chọn ngày phục vụ</span>
        </h1>
        {services.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Thời gian dự kiến: {formatTime(getTotalEstimatedTime())}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="font-semibold">Chọn ngày</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="font-semibold">Chọn giờ</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] space-y-3 overflow-y-auto">
            {!date && (
              <div className="text-center py-8 text-gray-500">
                Vui lòng chọn ngày trước
              </div>
            )}

            {date && loading && (
              <div className="flex flex-col h-full justify-center items-center space-y-2">
                <Spinner size={48} />
                <h2 className="text-foreground">Đang tải khung giờ...</h2>
              </div>
            )}

            {date && !loading && availableSlots.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có khung giờ nào khả dụng
              </div>
            )}

            {date &&
              !loading &&
              availableSlots.length > 0 &&
              availableSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant={isSlotSelected(slot) ? "default" : "outline"}
                  className={cn(
                    "w-full flex justify-start",
                    !slot.isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleTimeSlotSelect(slot)}
                  disabled={!slot.isAvailable}
                >
                  <Clock className="w-4 h-4" />
                  {formatTimeSlot(slot)}
                  {!slot.isAvailable && (
                    <span className="ml-auto text-xs">(Đã đầy)</span>
                  )}
                </Button>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

TimeSlotSelectionStep.displayName = "TimeSlotSelectionStep";

export default TimeSlotSelectionStep;
