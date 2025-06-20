import React from 'react';

interface ProgressStepsProps {
  currentStep: number;
}

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  const steps = [
    { number: 1, label: 'Choose Template' },
    { number: 2, label: 'Generate Script' },
    { number: 3, label: 'Select Voice' },
    { number: 4, label: 'Generate Video' }
  ];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-gray-200 w-full"></div>
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-blue-500 transition-all duration-500" 
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      step.number <= currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <span 
                    className={`mt-2 text-sm font-medium ${
                      step.number <= currentStep ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 