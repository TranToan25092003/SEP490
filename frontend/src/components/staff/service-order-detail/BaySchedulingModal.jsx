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
  DialogContent
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
import { formatDateTime } from "@/lib/utils";
import { Calendar, MapPin } from "lucide-react";

const baySchedulingSchema = z.object({
  bayId: z.string().min(1, "Vui lòng chọn một bay"),
  duration: z.number()
    .int("Thời gian phải là số nguyên")
    .min(1, "Thời gian phải lớn hơn 0")
    .max(1440, "Thời gian không được vượt quá 1440 phút (24 giờ)"),
  slot: z.object({
    start: z.string(),
    end: z.string()
  }).nullable()
});

const BaySchedulingModal = NiceModal.create(() => {
  const modal = useModal();

  const [step, setStep] = useState(1);
  const [bays, setBays] = useState([]);
  const [isLoadingBays, setIsLoadingBays] = useState(true);
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger
  } = useForm({
    resolver: zodResolver(baySchedulingSchema),
    defaultValues: {
      bayId: "",
      duration: 60,
      slot: null
    }
  });

  const selectedBayId = watch("bayId");
  const duration = watch("duration");
  const selectedSlot = watch("slot");

  const selectedBay = bays.find(b => b.id === selectedBayId) || null;

  const fetchBays = useCallback(async () => {
    try {
      setIsLoadingBays(true);
      const baysData = await getAllBays();
      setBays(baysData);
    } catch (error) {
      console.error("Error fetching bays:", error);
    } finally {
      setIsLoadingBays(false);
    }
  }, []);

  useEffect(() => {
    fetchBays();
  }, [fetchBays]);

  const handleNext = async () => {
    const isValid = await trigger(["bayId", "duration"]);
    if (!isValid) return;

    try {
      setStep(2);
      setIsLoadingSlots(true);
      const slotsData = await getBaySlots(selectedBayId, 10, duration);

      const sortedSlots = slotsData.sort((a, b) => {
        return new Date(a.start) - new Date(b.start);
      });

      setSlots(sortedSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setValue("slot", null);
  };

  const onSubmit = (data) => {
    modal.resolve({
      bay: selectedBay,
      slot: data.slot,
      duration: data.duration
    });
    modal.remove();
  };

  const handleCancel = () => {
    modal.reject(new Error("Bay scheduling cancelled"));
    modal.remove();
  };

  const renderStep1 = () => (
    <FieldGroup>
      <Field>
        <FieldLabel>Chọn bay</FieldLabel>
        {isLoadingBays ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Spinner className="h-6 w-6" />
            <p className="text-sm text-muted-foreground">Đang tải danh sách bay...</p>
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
              <Select value={field.value} onValueChange={field.onChange}>
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
                          <div className="font-medium">{bay.bayNumber}</div>
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
        {errors.bayId && <FieldError>{errors.bayId.message}</FieldError>}
        <FieldDescription>
          Chọn bay sửa chữa phù hợp cho công việc
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="duration">Thời Gian Dự Kiến (phút)</FieldLabel>
        <Controller
          name="duration"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Input
                id="duration"
                type="number"
                min="1"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                placeholder="Nhập thời gian dự kiến"
              />
            </div>
          )}
        />
        {errors.duration && <FieldError>{errors.duration.message}</FieldError>}
        <FieldDescription>
          Thời gian dự kiến để hoàn thành công việc (tính bằng phút)
        </FieldDescription>
      </Field>
    </FieldGroup>
  );

  const renderStep2 = () => (
    <FieldGroup>
      <Field>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel>Gợi ý chọn khung giờ</FieldLabel>
          {!isLoadingSlots && slots.length > 0 && (
            <Badge variant="secondary">{slots.length} khung giờ trống</Badge>
          )}
        </div>
        {isLoadingSlots ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Spinner className="h-6 w-6" />
            <p className="text-sm text-muted-foreground">Đang tải khung giờ trống...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Không có khung giờ trống cho bay này</p>
            <p className="text-xs mt-1">Vui lòng thử chọn bay khác hoặc thời gian khác</p>
          </div>
        ) : (
          <Controller
            name="slot"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value ? JSON.stringify(field.value) : ""}
                onValueChange={(value) => field.onChange(value ? JSON.parse(value) : null)}
              >
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                  {slots.map((slot, index) => {
                    const slotKey = `${slot.start}-${slot.end}`;
                    const startDate = new Date(slot.start);
                    const isToday = startDate.toDateString() === new Date().toDateString();
                    const isTomorrow = startDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                    return (
                      <label
                        key={slotKey}
                        htmlFor={slotKey}
                        className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                      >
                        <RadioGroupItem value={JSON.stringify(slot)} id={slotKey} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {formatDateTime(slot.start)}
                            </span>
                            {index === 0 && (
                              <Badge variant="default" className="text-xs">
                                Sớm nhất
                              </Badge>
                            )}
                            {isToday && (
                              <Badge variant="success" className="text-xs">
                                Hôm nay
                              </Badge>
                            )}
                            {isTomorrow && (
                              <Badge variant="secondary" className="text-xs">
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

      <Field>
        <Button variant="outline">Chọn khung giờ khác</Button>
      </Field>
    </FieldGroup>
  );

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lên Lịch bay</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Chọn bay và nhập thời gian dự kiến để hoàn thành công việc"
              : "Chọn khung giờ phù hợp từ danh sách các khung giờ trống"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto p-2">
          {step === 1 ? renderStep1() : renderStep2()}
        </div>

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={handleBack}>
              Quay Lại
            </Button>
          )}
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          {step === 1 ? (
            <Button
              onClick={handleNext}
              disabled={isLoadingBays}
            >
              Tiếp Theo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isLoadingSlots || !selectedSlot}
            >
              Xác Nhận
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default BaySchedulingModal;
