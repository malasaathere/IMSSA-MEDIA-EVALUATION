import { Check } from "lucide-react";

export type WorkflowStep = {
  id: string;
  name: string;
};

export const MEDIA_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "draft", name: "Media Draft" },
  { id: "ready", name: "Ready for Review" },
  { id: "director_reviewed", name: "Director Reviewed" },
  { id: "approved", name: "Approved" },
  { id: "scheduled", name: "Scheduled" },
];

interface WorkflowStepperProps {
  currentStepId: string;
  steps?: WorkflowStep[];
  className?: string;
}

export function WorkflowStepper({ currentStepId, steps = MEDIA_WORKFLOW_STEPS, className = "" }: WorkflowStepperProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <div key={step.id} className="relative flex flex-col items-center flex-1">
              {/* Connecting Line */}
              {index !== steps.length - 1 && (
                <div 
                  className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 ${
                    isCompleted ? "bg-navy-600" : "bg-slate-200"
                  }`} 
                />
              )}
              
              {/* Circle */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-colors z-10 ${
                  isCompleted 
                    ? "bg-navy-600 border-navy-600 text-white" 
                    : isActive 
                      ? "border-navy-600 text-navy-600" 
                      : "border-slate-300 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-medium">{index + 1}</span>}
              </div>
              
              {/* Label */}
              <div className={`mt-2 text-xs font-medium text-center ${
                isActive ? "text-navy-900" : isCompleted ? "text-navy-700" : "text-slate-400"
              }`}>
                {step.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
