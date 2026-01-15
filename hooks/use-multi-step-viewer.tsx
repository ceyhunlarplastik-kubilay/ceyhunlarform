import React, { createContext, useContext, useState } from "react";

type StepField = {
  fields: string[];
  component: React.ReactNode;
};

type MultiStepContextType = {
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  stepsFields: StepField[];
  onStepValidation: (step: StepField) => Promise<boolean>;
};

const MultiStepContext = createContext<MultiStepContextType | undefined>(
  undefined
);

export const useMultiStepViewer = () => {
  const context = useContext(MultiStepContext);
  if (!context) {
    throw new Error(
      "useMultiStepViewer must be used within a MultiStepFormProvider"
    );
  }
  return context;
};

export const MultiStepFormProvider = ({
  children,
  stepsFields,
  onStepValidation,
}: {
  children: React.ReactNode;
  stepsFields: StepField[];
  onStepValidation: (step: StepField) => Promise<boolean>;
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Scroll to top when step changes with smooth animation
  React.useEffect(() => {
    const startPosition = window.pageYOffset;
    const targetPosition = 0;
    const distance = targetPosition - startPosition;
    const duration = 800; // 800ms
    let startTime: number | null = null;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      const ease = easeInOutCubic(progress);
      window.scrollTo(0, startPosition + distance * ease);

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }, [currentStep]);

  const nextStep = async () => {
    const isValid = await onStepValidation(stepsFields[currentStep]);
    if (isValid && currentStep < stepsFields.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <MultiStepContext.Provider
      value={{
        currentStep,
        totalSteps: stepsFields.length,
        nextStep,
        prevStep,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === stepsFields.length - 1,
        stepsFields,
        onStepValidation,
      }}
    >
      {children}
    </MultiStepContext.Provider>
  );
};
