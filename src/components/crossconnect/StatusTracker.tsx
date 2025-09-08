import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { WorkflowStep } from './CrossConnectWorkflow';

interface StatusTrackerProps {
  currentStep: WorkflowStep;
}

export function StatusTracker({ currentStep }: StatusTrackerProps) {
  const steps = [
    { id: 'loa-form', label: 'LOA Form' },
    { id: 'loa-submitted', label: 'LOA Review' },
    { id: 'loa-approved', label: 'LOA Approval' },
    { id: 'crossconnect-form', label: 'Cross-Connect' },
    { id: 'completed', label: 'Complete' }
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = {
      'loa-form': 0,
      'loa-review': 0,
      'loa-submitted': 1,
      'loa-approved': 2,
      'crossconnect-form': 3,
      'crossconnect-submitted': 4,
      'completed': 4
    };

    const currentStepIndex = stepOrder[currentStep as keyof typeof stepOrder];
    const thisStepIndex = stepOrder[stepId as keyof typeof stepOrder];

    if (thisStepIndex < currentStepIndex) {
      return 'completed';
    } else if (thisStepIndex === currentStepIndex) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full 
                ${getStepStatus(step.id) === 'completed' ? 'bg-green-100' : 
                  getStepStatus(step.id) === 'current' ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                {getStepStatus(step.id) === 'completed' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : getStepStatus(step.id) === 'current' ? (
                  <Circle className="h-6 w-6 text-blue-600" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <span className={`
                mt-2 text-xs font-medium
                ${getStepStatus(step.id) === 'completed' ? 'text-green-600' : 
                  getStepStatus(step.id) === 'current' ? 'text-blue-600' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 relative">
                <div className={`
                  absolute inset-0 
                  ${getStepStatus(step.id) === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                `}></div>
                {getStepStatus(step.id) === 'completed' && (
                  <ArrowRight className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}