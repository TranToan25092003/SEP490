import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getBayAvailabilitySnapshot } from "@/api/bays";
import { toast } from "sonner";
import { RefreshCw, Clock } from "lucide-react";
import EmptyState from "@/components/global/EmptyState";
import { formatDateTime } from "@/lib/utils";

const LOOKAHEAD_OPTIONS = [
  { label: "4 giờ tới", value: "4" },
  { label: "8 giờ tới", value: "8" },
  { label: "1 ngày", value: "24" },
];

const statusClasses = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-200 text-gray-600",
};

const statusLabels = {
  available: "Đang trống",
  occupied: "Đang sử dụng",
  inactive: "Ngưng hoạt động",
};

const formatRange = (start, end) => {
  if (!start || !end) return "Không xác định";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  const startStr = formatDateTime(startDate);
  const endStr = sameDay
    ? endDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : formatDateTime(endDate);

  return `${startStr} → ${endStr}`;
};

const BayAvailabilityCard = ({ bay }) => {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{bay.bayNumber}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {bay.description || "Không có mô tả"}
          </p>
        </div>
        <Badge className={statusClasses[bay.availabilityStatus] || ""}>
          {statusLabels[bay.availabilityStatus] || "Không xác định"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {bay.currentTask ? (
          <div className="rounded-lg border p-3 bg-muted/40">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Đang phục vụ
            </p>
            <p className="text-sm font-semibold mt-1">
              Lệnh {bay.currentTask.orderNumber || bay.currentTask.serviceOrderId}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRange(bay.currentTask.start, bay.currentTask.end)}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Bay đang trống. Dự kiến khả dụng đến{" "}
            <span className="font-medium">
              {bay.nextAvailableAt ? formatDateTime(bay.nextAvailableAt) : "Không xác định"}
            </span>
            .
          </div>
        )}

        {bay.upcomingTasks?.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Lịch sắp tới
            </p>
            <ul className="space-y-2">
              {bay.upcomingTasks.map((task) => (
                <li
                  key={task.taskId}
                  className="rounded-md border bg-white px-3 py-2 text-xs"
                >
                  <p className="font-medium">
                    Lệnh {task.orderNumber || task.serviceOrderId}
                  </p>
                  <p className="text-muted-foreground">{formatRange(task.start, task.end)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Chưa có lịch đặt trước trong khoảng thời gian đang xem.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const BayAvailabilityTab = () => {
  const [lookaheadHours, setLookaheadHours] = useState("8");
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSnapshot = useCallback(
    async (options = { silent: false }) => {
      if (!options.silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      try {
        const response = await getBayAvailabilitySnapshot({
          lookaheadHours,
          limitUpcoming: 5,
        });
        if (response.success) {
          setSnapshot(response.data);
        } else {
          toast.error("Không thể tải trạng thái bay");
        }
      } catch (error) {
        console.error(error);
        toast.error("Lỗi bất ngờ khi tải trạng thái bay");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lookaheadHours]
  );

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const lastUpdatedText = useMemo(() => {
    if (!snapshot?.now) return "Chưa cập nhật";
    return formatDateTime(snapshot.now);
  }, [snapshot]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((item) => (
          <Card key={item}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!snapshot || snapshot.bays.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Chưa có bay hoạt động"
        subtitle="Hãy tạo bay ở module quản lý để xem lịch sử dụng tại đây."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Khoảng thời gian xem:</span>
          <Select value={lookaheadHours} onValueChange={setLookaheadHours}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Chọn" />
            </SelectTrigger>
            <SelectContent>
              {LOOKAHEAD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Lần cập nhật gần nhất: {lastUpdatedText}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSnapshot({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {snapshot.bays.map((bay) => (
          <BayAvailabilityCard key={bay.id} bay={bay} />
        ))}
      </div>
    </div>
  );
};

export default BayAvailabilityTab;





