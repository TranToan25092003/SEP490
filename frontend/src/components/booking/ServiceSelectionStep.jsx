import {  useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

/**
 * ServiceSelectionStep component for selecting services in the booking form.
 * Uses useFormContext to access form methods and state.
 */
const ServiceSelectionStep = ({ services }) => {
  const { fields: selectedServices, remove, append } = useFieldArray({
    name: 'services'
  });

  const handleServiceToggle = (service) => {
    const idx = selectedServices.findIndex((s) => s.sid === service.sid);
    const isSelected = idx !== -1;
    
    if (isSelected) {
      remove(idx);
    } else {
      append(service);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Chọn một hoặc nhiều dịch vụ cho xe của bạn
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => {
          const isSelected = selectedServices.some((s) => s.sid === service.sid);
          
          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'border-primary border-2' : ''
              }`}
              onClick={() => handleServiceToggle(service)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  {
                    isSelected ? (
                      <div className="p-1 bg-primary/10 rounded">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <div className="p-1 bg-gray-200 rounded">
                        <Check className="h-4 w-4 text-gray-400 invisible" />
                      </div>
                    )
                  }
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {service.desc && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {service.desc}
                  </p>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-gray-500">
                    Thời gian: {formatTime(service.estimatedTime)}
                  </span>
                  <span className="font-semibold text-primary">
                    {formatPrice(service.basePrice)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

ServiceSelectionStep.displayName = 'ServiceSelectionStep';

export default ServiceSelectionStep;
