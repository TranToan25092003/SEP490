import { useState, useRef, forwardRef, useImperativeHandle, useLayoutEffect } from "react";
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
import { cn } from "@/lib/utils";

/** @typedef {import("./index").BookingFormData} BookingFormData */
/** @typedef {import("./index").BookingFormProps} BookingFormProps */

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
 * @typedef {object} FlashMessageHandle
 * @property {(message: string, duration?: number) => void} showMessage - Function to show a message for a specified duration.
 */

/**
 * This component contains an imperative handle that accepts a
 * string and display that string for sepecified amount of milliseconds then
 * fade out.
 * @type {React.ForwardRefRenderFunction<FlashMessageHandle, React.ComponentPropsWithoutRef<"p">>}
 */
const FlashMessage = forwardRef((props, ref) => {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    showMessage: (msg, duration = 3000) => {
      setMessage(msg);
      setVisible(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, duration);
    }
  }));

  const { className, ...rest } = props;
  const clazzName = cn(className, "transition-opacity duration-500", visible ? "opacity-100" : "opacity-0");

  return (
    <p
      className={clazzName}
      {...rest}
    >
      {message}
    </p>
  );
});

/**
 * BookingForm component includes a multi-step form for booking services.
 * It manages form state and handles user input.
 * It outputs the collected data upon submission.
 * The component accepts async functions as props for handling form submission and data fetching (services and available time slots).
 * @param {BookingFormProps} props
 */
const BookingForm = ({
  onSubmit,
  myCar,
  services,
  fetchAvailableTimeSlots,
  className,
  ...props
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = useRef(null);
  const mounted = useRef(false);

  /** @type {React.RefObject<FlashMessageHandle>} handle */
  const flashMessageRef = useRef(null);

  useLayoutEffect(() => {
    if (content.current && mounted.current) {
      content.current.scrollIntoView();
    }

    mounted.current = true;
  }, [currentStep]);

  const methods = useForm({
    defaultValues: {
      services: [],
      timeslot: null,
    },
  });
  
  const selectedServices = methods.watch("services", []);
  const selectedTimeslot = methods.watch("timeslot", null);

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return selectedServices.length > 0 ? [true, null] : [false, "Vui lòng chọn ít nhất một dịch vụ."];
      case 1:
        return selectedTimeslot ? [true, null] : [false, "Vui lòng chọn thời gian hẹn."];
      default:
        return [false, "Không thể xác thực bước hiện tại."];
    }
  };

  const handleNext = (e) => {
    const [isValid, message] = validateStep(currentStep);
    if (!isValid) {
      if (message) {
        flashMessageRef.current?.showMessage(message);
      }
      return;
    }
    
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
    for (let step = 0; step < stepIndex; step++) {
      const [isValid, message] = validateStep(step);
      if (!isValid) {
        if (message) {
          setCurrentStep(step);
          flashMessageRef.current?.showMessage(message);
          return;
        }
      }
    }

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
      <form onSubmit={methods.handleSubmit(handleFormSubmit)} className={cn(className)} {...props}>
        <Card className="bg-gray-50 dark:bg-gray-800 gap-2" ref={content}>
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

          <CardContent className="px-2 md:px-8 pb-2">
            <div className={cn(currentStep !== 0 && "hidden") }>
              <ServiceSelectionStep services={services} />
            </div>
            <div className={cn(currentStep !== 1 && "hidden") }>
              <TimeSlotSelectionStep
                fetchAvailableTimeSlots={fetchAvailableTimeSlots}
              />
            </div>
            <div className={cn(currentStep !== 2 && "hidden") }>
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

            <FlashMessage
              className="text-red-500"
              ref={flashMessageRef}
            />

            {currentStep === steps.length - 1 ? (
              <Button
                key="submit"
                type="submit"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner /> : "Hoàn thành"}
              </Button>
            ) : (
              <Button key="next" onClick={handleNext} disabled={!validateStep(currentStep)[0]} size="lg">
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
