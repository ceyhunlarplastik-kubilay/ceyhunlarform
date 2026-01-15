import { useMultiStepViewer } from "@/hooks/use-multi-step-viewer";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const MultiStepFormContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
};

export const FormHeader = ({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) => {
  const { currentStep, totalSteps } = useMultiStepViewer();

  return (
    <div className="flex flex-col gap-1 mb-4">
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Step {currentStep + 1} of {totalSteps}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-8 rounded-full transition-colors",
                i <= currentStep
                  ? "bg-primary bg-black dark:bg-white"
                  : "bg-muted bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>
      </div>
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
};

export const StepFields = () => {
  const { stepsFields, currentStep } = useMultiStepViewer();
  const step = stepsFields[currentStep];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-4"
      >
        {step.component}
      </motion.div>
    </AnimatePresence>
  );
};

export const FormFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { currentStep } = useMultiStepViewer();

  /**
   * Step 0 → Welcome
   * Step 1 → Sector
   */
  const isSingleCenteredStep = currentStep === 0 || currentStep === 1;

  return (
    <div
      className={cn(
        "mt-6",
        isSingleCenteredStep ? "flex justify-center" : "grid grid-cols-2 gap-3",
        className
      )}
    >
      {children}
    </div>
  );
};

export const PreviousButton = ({
  children,
  className,
  ...props
}: ButtonProps) => {
  const { prevStep, isFirstStep } = useMultiStepViewer();

  if (isFirstStep) return <div />;

  return (
    <Button
      type="button"
      variant="brandOutline"
      onClick={prevStep}
      className={cn("w-full justify-center gap-2", className)}
      {...props}
    >
      {children}
    </Button>
  );
};

export const NextButton = ({
  children,
  className,
  hideOnSteps,
  ...props
}: ButtonProps & { hideOnSteps?: number[] }) => {
  const { nextStep, isLastStep, isFirstStep, currentStep } =
    useMultiStepViewer();

  if (isLastStep) return null;
  if (hideOnSteps?.includes(currentStep)) return null;

  return (
    <Button
      type="button"
      variant="brand"
      onClick={nextStep}
      className={cn(
        "w-full justify-center gap-2",
        isFirstStep && "mx-auto", // İlk adımda ortala
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export const SubmitButton = ({
  children,
  className,
  ...props
}: ButtonProps) => {
  const { isLastStep } = useMultiStepViewer();

  if (!isLastStep) return null;

  return (
    <Button
      type="submit"
      variant="brand"
      className={cn("w-full justify-center gap-2", className)}
      {...props}
    >
      {children}
    </Button>
  );
};
