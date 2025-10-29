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
import { getServices } from "@/api/services";
import { formatPrice } from "@/lib/utils";

const ChooseServiceModal = NiceModal.create(() => {
  const modal = useModal();
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dịch vụ");
      console.error("Error fetching services:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (service) => {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.id === service.id);
      return isSelected
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service];
    });
  };

  const handleConfirm = () => {
    modal.resolve(selectedServices);
    modal.remove();
  };

  const handleCancel = () => {
    modal.reject(new Error("Service selection cancelled"));
    modal.remove();
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chọn Dịch Vụ</DialogTitle>
          <DialogDescription>
            Chọn một hoặc nhiều dịch vụ để thêm vào lệnh sửa chữa
          </DialogDescription>
        </DialogHeader>
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button size="sm" onClick={fetchServices}>
                Thử Lại
              </Button>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Không có dịch vụ nào</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {services.map((service) => (
                <div key={service.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    id={service.id}
                    checked={selectedServices.some((s) => s.id === service.id)}
                    onCheckedChange={() => handleServiceToggle(service)}
                    className="mt-1"
                  />
                  <label htmlFor={service.id} className="flex-1 cursor-pointer">
                    <div className="font-medium text-sm">{service.name}</div>
                    {service.description && (
                      <div className="text-xs text-gray-600 mt-1">
                        {service.description}
                      </div>
                    )}
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      {service.basePrice !== undefined && (
                        <span>{formatPrice(service.basePrice)}</span>
                      )}
                      {service.estimatedTimeInMinutes && (
                        <span>{service.estimatedTimeInMinutes} phút</span>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedServices.length === 0 || isLoading || !!error}
          >
            Xác Nhận ({selectedServices.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ChooseServiceModal;
