import { useState } from 'react';
import BookingHeader from '@/components/booking/BookingHeader';
import { Stepper, StepperItem } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Booking = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Thông tin cá nhân",
      description: "Nhập thông tin của bạn",
    },
    {
      title: "Chọn dịch vụ",
      description: "Chọn dịch vụ cần thiết",
    },
    {
      title: "Chọn thời gian",
      description: "Đặt lịch hẹn",
    },
    {
      title: "Xác nhận",
      description: "Xác nhận đặt lịch",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  return (
    <div className="space-y-14 py-4">
      <BookingHeader />

      <div className="min-h-[300px] mb-8">
        <Card className="bg-gray-50 dark:bg-gray-800 space-y-4">
          <CardHeader>
            <Stepper currentStep={currentStep}>
              {steps.map((step, index) => (
                <StepperItem
                  key={index}
                  step={index}
                  title={step.title}
                  description={step.description}
                  className="cursor-pointer"
                  onClick={() => handleStepClick(index)}
                />
              ))}
            </Stepper>
          </CardHeader>
          <CardContent className="px-8 py-3">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {steps[currentStep].title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {steps[currentStep].description}
              </p>

              {/* Placeholder for form content */}
              <div className="py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg">Nội dung form sẽ được thêm vào đây...</p>
                <p className="text-sm mt-2">
                  Bước {currentStep + 1} / {steps.length}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              size="lg"
            >
              Quay lại
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              size="lg"
            >
              {currentStep === steps.length - 1 ? "Hoàn thành" : "Tiếp theo"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="flex justify-between items-center"></div>
    </div>
  );
};

export default Booking;
