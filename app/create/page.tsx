"use client";
import { useCarouselStore } from "@/hooks/useCarouselStore";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { StepUpload } from "@/components/wizard/StepUpload";
import { StepConfigure } from "@/components/wizard/StepConfigure";
import { StepGenerate } from "@/components/wizard/StepGenerate";
import { StepPreview } from "@/components/wizard/StepPreview";

export default function CreatePage() {
  const { currentStep } = useCarouselStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Gerador de Carrossel
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie carrosseis profissionais para Instagram com IA
          </p>
        </div>

        <WizardStepper currentStep={currentStep} />

        <div className="mt-8">
          {currentStep === 0 && <StepUpload />}
          {currentStep === 1 && <StepConfigure />}
          {currentStep === 2 && <StepGenerate />}
          {currentStep === 3 && <StepPreview />}
        </div>
      </div>
    </div>
  );
}
