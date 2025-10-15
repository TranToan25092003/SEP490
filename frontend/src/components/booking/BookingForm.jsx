import { useState, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import ServiceSelectionStep from "./ServiceSelectionStep";
import TimeSlotSelectionStep from "./TimeSlotSelectionStep";
import ConfirmationStep from "./ConfirmationStep";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { useLayoutEffect } from "react";

/**
 * @typedef {object} CarInfo
 * @property {string} licensePlate - The license plate of the car.
 */

/**
 * @typedef {object} ServiceInfo
 * @property {string} sid - The unique identifier of the service.
 * @property {string} name - The name of the service.
 * @property {number} basePrice - The base price of the service (in VND).
 * @property {string | undefined} desc - The description of the service (optional).
 * @property {number} estimatedTime - The estimated time for the service in minutes.
 */

/**
 * @typedef {object} TimeSlot
 * @property {number} hours - The hour of the time slot (0-23).
 * @property {number} minutes - The minutes of the time slot (0-59).
 * @property {number} day - The day of the month (1-31).
 * @property {number} month - The month (0-11).
 * @property {number} year - The full year (e.g., 2024).
 */

/**
 * @typedef {object} AvailableTimeSlotInfo
 * @property {(TimeSlot | {
 *   isAvailable: boolean;
 * })[]} timeSlots - Array of time slots with availability status.
 * @property {string} comment - Additional comments regarding the time slots.
 */

/**
 * @typedef {object} BookingFormData
 * @property {ServiceInfo[]} services - Array of selected services for the booking.
 * @property {TimeSlot} timeslot - The selected time slot for the booking.
 */

/**
 * @typedef {import("react").FC<{
 *   onSubmit: (data: BookingFormData) => Promise<any>;
 *   myCar: CarInfo;
 *   services: ServiceInfo[];
 *   fetchAvailableTimeSlots: (day: number, month: number, year: number) => Promise<AvailableTimeSlotInfo>;
 * }>} BookingFormProps
 */

const steps = [
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

/**
 * BookingForm component includes a multi-step form for booking services.
 * It manages form state and handles user input.
 * It outputs the collected data upon submission.
 * The component accepts async functions as props for handling form submission and data fetching (services and available time slots).
 * @type {BookingFormProps}
 */
const BookingForm = ({
  onSubmit,
  myCar,
  services,
  fetchAvailableTimeSlots,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = useRef(null);

  useLayoutEffect(() => {
    if (content.current) {
      content.current.scrollIntoView();
    }
  }, [currentStep]);

  const methods = useForm({
    defaultValues: {
      services: [],
      timeslot: null,
    }
  });

  const handleNext = (e) => {
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

  const handleFormSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      methods.reset();
      setCurrentStep(0);
    } catch (error) {
      console.error("Error submitting booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleFormSubmit)}>
        <Card className="bg-gray-50 dark:bg-gray-800 space-y-4" ref={content}>
          <CardHeader className="sticky top-0 py-3 bg-linear-to-b from-gray-50/50 from-70% to-transparent backdrop-blur-md z-10">
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

          <CardContent className="px-2 md:px-8 py-6">
            <div className={currentStep !== 0 ? "hidden" : ""}>
              <ServiceSelectionStep services={services} />
            </div>
            <div className={currentStep !== 1 ? "hidden" : ""}>
              <TimeSlotSelectionStep fetchAvailableTimeSlots={fetchAvailableTimeSlots} />
            </div>
            <div className={currentStep !== 2 ? "hidden" : ""}>
              <ConfirmationStep myCar={myCar} />
            </div>
          </CardContent>

          <CardFooter className="border-t flex justify-between sticky bottom-0 bg-gray-50/50 backdrop-blur-md z-10 px-8 py-4">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              size="lg"
            >
              Quay lại
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button key="submit" type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : "Hoàn thành"}
              </Button>
            ) : (
              <Button key="next" onClick={handleNext} size="lg">
                Tiếp theo
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};

BookingForm.displayName = "BookingForm";

export default BookingForm;
