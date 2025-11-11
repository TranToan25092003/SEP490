import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const StepperContext = React.createContext({
  currentStep: 0,
  totalSteps: 0,
});

const useStepper = () => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a Stepper");
  }
  return context;
};

const Stepper = React.forwardRef(
  ({ className, currentStep = 0, children, ...props }, ref) => {
    const steps = React.Children.toArray(children);
    const totalSteps = steps.length;

    return (
      <StepperContext.Provider value={{ currentStep, totalSteps }}>
        <div
          ref={ref}
          className={cn("flex w-full items-center justify-between", className)}
          {...props}
        >
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {step}
              {index < totalSteps - 1 && (
                <StepperSeparator
                  step={step}
                  completed={currentStep > index}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </StepperContext.Provider>
    );
  }
);
Stepper.displayName = "Stepper";

const StepperSeparator = ({ completed, step }) => {
  console.log(step);
  return (
    <div className={cn("flex-1 mx-1 h-[2px] bg-gray-200 dark:bg-gray-700 relative", {
      "bottom-6": !!step.props.description,
      "bottom-4": !step.props.description,
    })}>
      <div
        className={cn(
          "h-full transition-all duration-300",
          completed ? "bg-primary w-full" : "w-0"
        )}
      />
    </div>
  );
};

const StepperItem = React.forwardRef(
  ({ className, step, title, description, ...props }, ref) => {
    const { currentStep } = useStepper();
    const isCompleted = currentStep > step;
    const isCurrent = currentStep === step;

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center gap-2 min-w-[80px]", className)}
        {...props}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
            isCompleted
              ? "bg-primary border-primary text-primary-foreground"
              : isCurrent
              ? "border-primary text-primary bg-background"
              : "border-muted-foreground/30 text-muted-foreground bg-background"
          )}
        >
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : (
            <span className="text-sm font-semibold">{step + 1}</span>
          )}
        </div>
        {title && (
          <div className="text-center">
            <p
              className={cn(
                "text-sm font-medium",
                isCurrent || isCompleted
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {title}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
StepperItem.displayName = "StepperItem";

export { Stepper, StepperItem, useStepper };
