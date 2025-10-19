import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";
import EmptyImageState from "./EmptyImageState";

/**
 * @typedef {object} Step
 * @property {number} id - The id of the step.
 * @property {string} label - The label of the step.
 * @property {string} time - The time of the step.
 * @property {string[]} imageUrls - Array of image URLs associated with the step.
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<typeof Card> & {
 *  steps: Step[];
 *  currentStep?: number;
 * }} BookingStatusTimelineProps
 */

/**
 * BookingStatusTimeline component to display progress timeline
 * with steps and image gallery
 * @param {BookingStatusTimelineProps} props 
 */
const BookingStatusTimeline = ({
  currentStep = 0,
  steps = [],
  className,
  ...props
}) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState(null);

  const handleStepClick = (index) => {
    setSelectedStepIndex(index === selectedStepIndex ? null : index);
  };

  const selectedStep = selectedStepIndex !== null ? steps[selectedStepIndex] : null;
  const selectedImages = selectedStep?.imageUrls || [];

  return (
    <Card className={className} {...props}>
      <CardContent className="pt-6">
        <h3 className="text-xl font-bold text-foreground mb-6">Tiến độ</h3>

        <div className="mb-12 px-4 overflow-x-auto">
          <Stepper currentStep={currentStep} variant="destructive" className="w-full">
            {steps.map((step, index) => (
              <StepperItem
                key={step.id}
                step={index}
                title={step.label}
                description={step.time}
                className={cn(
                  "flex-1 cursor-pointer transition-opacity",
                  selectedStepIndex === index && "opacity-100",
                  selectedStepIndex !== null && selectedStepIndex !== index && "opacity-50"
                )}
                onClick={() => handleStepClick(index)}
              />
            ))}
          </Stepper>
        </div>

        {selectedStepIndex === null ? (
          <EmptyImageState 
            message="Chưa chọn bước nào"
            description="Nhấp vào một bước trong tiến độ để xem ảnh cập nhật của bước đó."
          />
        ) : selectedImages.length > 0 ? (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Ảnh cập nhật - {selectedStep.label} ({selectedImages.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedImages.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border hover:shadow-lg transition-shadow duration-200"
                >
                  <img
                    src={image}
                    alt={`${selectedStep.label} - Progress update ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyImageState 
            message="Chưa có ảnh"
            description={`Bước "${selectedStep.label}" chưa có ảnh cập nhật nào.`}
          />
        )}
      </CardContent>
    </Card>
  );
};

BookingStatusTimeline.displayName = "BookingStatusTimeline";
export default BookingStatusTimeline;