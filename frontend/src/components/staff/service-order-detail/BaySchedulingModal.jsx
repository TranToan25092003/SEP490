import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { getAllBays, getBaySlots } from "@/api/bays";
import { formatDateTime, cn, formatDate } from "@/lib/utils";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

const baySchedulingSchema = z.object({
  bayId: z.string().min(1, "Vui lòng chọn một bay"),
  duration: z
    .number({
      invalid_type_error: "Thời gian phải là số",
    })
    .int("Thời gian phải là số nguyên")
    .min(15, "Thời gian phải lớn hơn hoặc bằng 15 phút")
    .max(1440, "Thời gian không được vượt quá 1440 phút (24 giờ)")
    .refine((val) => val % 15 === 0, {
      message: "Thời gian phải là bội số của 15 phút",
    }),
  slot: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .nullable(),
});

const BaySchedulingModal = NiceModal.create(({ task }) => {
  const modal = useModal();

  const [bays, setBays] = useState([]);
  const [isLoadingBays, setIsLoadingBays] = useState(true);
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [searchDate, setSearchDate] = useState(new Date());
  const [searchTime, setSearchTime] = useState(format(new Date(), "HH:mm"));
  const [searchFrom, setSearchFrom] = useState(new Date().toISOString());

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
    register,
  } = useForm({
    resolver: zodResolver(baySchedulingSchema),
    defaultValues: {
      bayId: "",
      duration: 60,
      slot: null,
    },
  });

  const selectedBayId = watch("bayId");
  const duration = watch("duration");
  const selectedSlot = watch("slot");

  const selectedBay = bays.find((b) => b.id === selectedBayId) || null;

  useEffect(() => {
    if (searchDate && searchTime) {
      const [hours, minutes] = searchTime.split(":");
      const newDate = new Date(searchDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      setSearchFrom(newDate.toISOString());
    }
  }, [searchDate, searchTime]);

  const fetchBays = useCallback(async () => {
    try {
      setIsLoadingBays(true);
      const baysData = await getAllBays();
      setBays(baysData.filter(bay => bay.status === "available"));
    } catch (error) {
      console.error("Error fetching bays:", error);
    } finally {
      setIsLoadingBays(false);
    }
  }, []);

  useEffect(() => {
    fetchBays();
  }, [fetchBays]);

  const fetchSlots = useCallback(async () => {
    const isValid = await trigger(["bayId", "duration"]);
    if (!isValid) {
      setSlots([]);
      return;
    }

    try {
      setIsLoadingSlots(true);
      const slotsData = await getBaySlots(
        selectedBayId,
        10,
        duration,
        searchFrom,
        task ? [task.id] : []
      );

      const sortedSlots = slotsData.sort((a, b) => {
        return new Date(a.start) - new Date(b.start);
      });

      setSlots(sortedSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedBayId, duration, trigger, searchFrom]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedBayId && duration) {
        fetchSlots();
      } else {
        setSlots([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedBayId, duration, fetchSlots]);

  const onSubmit = (data) => {
    modal.resolve({
      bay: selectedBay,
      slot: data.slot,
      duration: data.duration,
    });
    modal.remove();
  };

  const handleCancel = () => {
    modal.reject(new Error("Bay scheduling cancelled"));
    modal.remove();
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent className="sm:max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>{ task ? "Chỉnh sửa lịch bay" : "Lên Lịch bay" }</DialogTitle>
          <DialogDescription>
            Chọn bay, thời gian và khung giờ phù hợp
          </DialogDescription>
          {task && (task.expectedStartTime || task.expectedEndTime) && (
            <div className="mt-4 p-3 bg-secondary rounded-lg space-y-1 text-sm">
              {task.expectedStartTime && (
                <div>
                  <span className="font-medium">Thời gian bắt đầu dự kiến hiện tại:</span>
                  <span className="ml-2">{formatDateTime(task.expectedStartTime)}</span>
                </div>
              )}
              {task.expectedEndTime && (
                <div>
                  <span className="font-medium">Thời gian kết thúc dự kiến hiện tại:</span>
                  <span className="ml-2">{formatDateTime(task.expectedEndTime)}</span>
                </div>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 px-2 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel className="required-asterisk">
                  Chọn bay
                </FieldLabel>
                {isLoadingBays ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <Spinner className="h-6 w-6" />
                    <p className="text-sm text-muted-foreground">
                      Đang tải danh sách bay...
                    </p>
                  </div>
                ) : bays.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Không có bay nào</p>
                  </div>
                ) : (
                  <Controller
                    name="bayId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          setValue("slot", null);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn một bay">
                            {selectedBay && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedBay.bayNumber}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {bays.map((bay) => (
                            <SelectItem key={bay.id} value={bay.id}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {bay.bayNumber}
                                  </div>
                                  {bay.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {bay.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
                {errors.bayId && (
                  <FieldError>{errors.bayId.message}</FieldError>
                )}
                <FieldDescription>
                  Chọn bay sửa chữa phù hợp cho công việc
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="duration" className="required-asterisk">
                  Thời gian dự kiến (phút)
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    {...register("duration", {
                      valueAsNumber: true,
                      onChange: () => setValue("slot", null),
                    })}
                    placeholder="Nhập thời gian dự kiến"
                  />
                </div>
                {errors.duration && (
                  <FieldError>{errors.duration.message}</FieldError>
                )}
                <FieldDescription>
                  Thời gian dự kiến để hoàn thành công việc (tính bằng phút)
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Thời gian bắt đầu tìm kiếm</FieldLabel>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !searchDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {searchDate ? (
                          formatDate(searchDate)
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={searchDate}
                        onSelect={(date) => {
                          if (date) setSearchDate(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    step={60}
                    value={searchTime}
                    onChange={(e) => setSearchTime(e.target.value)}
                    className="w-[120px]"
                  />
                </div>
                <FieldDescription>
                  Chọn ngày và giờ để bắt đầu tìm kiếm các khung giờ trống
                </FieldDescription>
              </Field>
            </FieldGroup>
          </div>

          <div className="space-y-4 md:border-l border-secondary md:pl-6">
            <FieldGroup>
              <Field>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel>Gợi ý chọn khung giờ</FieldLabel>
                  {!isLoadingSlots && slots.length > 0 && (
                    <Badge variant="secondary">
                      {slots.length} khung giờ trống
                    </Badge>
                  )}
                </div>
                {isLoadingSlots ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <Spinner className="h-6 w-6" />
                    <p className="text-sm text-muted-foreground">
                      Đang tải khung giờ trống...
                    </p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {!selectedBayId || !duration
                        ? "Vui lòng chọn bay và thời gian"
                        : "Không có khung giờ trống cho bay này"}
                    </p>
                    {selectedBayId && duration && (
                      <p className="text-xs mt-1">
                        Vui lòng thử chọn bay khác hoặc thời gian khác
                      </p>
                    )}
                  </div>
                ) : (
                  <Controller
                    name="slot"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value ? JSON.stringify(field.value) : ""}
                        onValueChange={(value) =>
                          field.onChange(value ? JSON.parse(value) : null)
                        }
                      >
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                          {slots.map((slot, index) => {
                            const slotKey = `${slot.start}-${slot.end}`;
                            const startDate = new Date(slot.start);
                            const isToday =
                              startDate.toDateString() ===
                              new Date().toDateString();
                            const isTomorrow =
                              startDate.toDateString() ===
                              new Date(Date.now() + 86400000).toDateString();

                            return (
                              <label
                                key={slotKey}
                                htmlFor={slotKey}
                                className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                              >
                                <RadioGroupItem
                                  value={JSON.stringify(slot)}
                                  id={slotKey}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">
                                      {formatDateTime(slot.start)}
                                    </span>
                                    {index === 0 && (
                                      <Badge
                                        variant="default"
                                        className="text-xs"
                                      >
                                        Sớm nhất
                                      </Badge>
                                    )}
                                    {isToday && (
                                      <Badge
                                        variant="success"
                                        className="text-xs"
                                      >
                                        Hôm nay
                                      </Badge>
                                    )}
                                    {isTomorrow && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Ngày mai
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Kết thúc: {formatDateTime(slot.end)}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </RadioGroup>
                    )}
                  />
                )}
                {errors.slot && <FieldError>{errors.slot.message}</FieldError>}
              </Field>
            </FieldGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoadingSlots || !selectedSlot}
          >
            Xác Nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default BaySchedulingModal;
