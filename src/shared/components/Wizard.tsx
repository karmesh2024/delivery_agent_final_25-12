'use client';

import React, { useState, ReactNode, useMemo, useCallback } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';

interface WizardProps {
  steps: {
    title: string;
    content: ReactNode;
    isValid?: (formData: any) => boolean; // Optional validation function for each step
  }[];
  formData: any; // The form data managed by the parent component
  onFinish: () => void;
  isLoading?: boolean;
}

export const Wizard: React.FC<WizardProps> = ({ steps, formData, onFinish, isLoading = false }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    if (steps[currentStep].isValid && !steps[currentStep].isValid(formData)) {
      // Validation failed, show error or prevent moving to next step
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [steps, currentStep, formData]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const progress = useMemo(() => ((currentStep + 1) / steps.length) * 100, [currentStep, steps.length]);

  const currentStepContent = useMemo(() => steps[currentStep].content, [steps, currentStep]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {steps[currentStep].title}
        </CardTitle>
        <Progress value={progress} className="w-full mt-4" />
        <p className="text-sm text-gray-500 text-center mt-2">
          الخطوة {currentStep + 1} من {steps.length}
        </p>
      </CardHeader>
      <CardContent>
        {currentStepContent}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleBack} disabled={currentStep === 0} variant="outline">
          السابق
        </Button>
        {currentStep === steps.length - 1 ? (
          <Button onClick={onFinish} disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : 'إنهاء وحفظ'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            التالي
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
