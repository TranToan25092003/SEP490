import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getTechniciansWithStatus } from "@/api/technicians";

const ChooseStaffModal = NiceModal.create(({ mode = "single", initialSelected = [] }) => {
  const modal = useModal();
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(initialSelected);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoading(true);
      const staffList = await getTechniciansWithStatus();
      setStaffList(staffList);
      setIsLoading(false);
    };

    fetchStaff();
  }, []);

  const availableTechnicians = staffList.filter(tech => !tech.isBusy);
  const busyTechnicians = staffList.filter(tech => tech.isBusy);

  const handleStaffToggle = (staff) => {
    if (mode === "single") {
      setSelectedStaff([staff]);
    } else {
      setSelectedStaff((prev) => {
        const isSelected = prev.some((s) => s.technicianClerkId === staff.technicianClerkId);
        return isSelected
          ? prev.filter((s) => s.technicianClerkId !== staff.technicianClerkId)
          : [...prev, staff];
      });
    }
  };

  const isSelected = (technicianClerkId) => {
    return selectedStaff.some((s) => s.technicianClerkId === technicianClerkId);
  };

  const renderTechnicianRow = (technician) => (
    <div
      key={technician.technicianClerkId}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isSelected(technician.technicianClerkId)
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {!technician.isBusy ? (
        <Checkbox
          id={technician.technicianClerkId}
          checked={isSelected(technician.technicianClerkId)}
          onCheckedChange={() => handleStaffToggle(technician)}
        />
      ) : null}
      <label
        htmlFor={technician.technicianClerkId}
        className={cn("flex-1 flex items-center cursor-pointer min-w-0")}
      >
        <span className="font-medium text-sm truncate">
          {technician.technicianName}
        </span>
      </label>
    </div>
  );

  const handleConfirm = () => {
    modal.resolve(mode === "single" ? selectedStaff[0] : selectedStaff);
    modal.remove();
  };

  const handleCancel = () => {
    modal.reject(new Error("Staff selection cancelled"));
    modal.remove();
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chọn Kỹ Thuật Viên</DialogTitle>
          <DialogDescription>
            {mode === "single"
              ? "Chọn một kỹ thuật viên để gán công việc"
              : "Chọn một hoặc nhiều kỹ thuật viên để gán công việc"}
          </DialogDescription>
        </DialogHeader>
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Không có kỹ thuật viên nào</p>
            </div>
          ) : (
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="available" className="relative">
                  Rảnh
                  {availableTechnicians.length > 0 && (
                    <Badge variant="success" className="ml-2 text-xs">
                      {availableTechnicians.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="busy" className="relative">
                  Đang bận
                  {busyTechnicians.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {busyTechnicians.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available">
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {availableTechnicians.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Không có kỹ thuật viên rảnh</p>
                    </div>
                  ) : (
                    availableTechnicians.map(renderTechnicianRow)
                  )}
                </div>
              </TabsContent>

              <TabsContent value="busy" className="mt-4">
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {busyTechnicians.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Không có kỹ thuật viên đang bận</p>
                    </div>
                  ) : (
                    busyTechnicians.map(renderTechnicianRow)
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedStaff.length === 0 || isLoading}
          >
            Xác Nhận ({selectedStaff.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ChooseStaffModal;
