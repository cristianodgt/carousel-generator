"use client";
import { Check, Upload, Settings, Sparkles, Eye } from "lucide-react";

const steps = [
  { label: "Upload", icon: Upload },
  { label: "Configurar", icon: Settings },
  { label: "Gerar", icon: Sparkles },
  { label: "Preview", icon: Eye },
];

interface WizardStepperProps {
  currentStep: number;
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const Icon = isCompleted ? Check : step.icon;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${isCompleted ? "bg-primary text-primary-foreground" : ""}
                  ${isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : ""}
                  ${!isCompleted && !isCurrent ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 mb-5 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
