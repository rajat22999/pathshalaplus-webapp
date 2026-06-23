"use client";

import { useTranslation } from "@/hooks/use-translation";

interface StepperProps {
  /** 1-based index of the current step. */
  current: number;
  total: number;
  /** Right-aligned label for the current step (e.g. "Organization Setup"). */
  tag: string;
}

export function Stepper({ current, total, tag }: StepperProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i < current ? "bg-slate-900" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">
          {t("wiz.step_of", { step: current, total })}
        </span>
        <span className="text-sm font-semibold text-slate-900">{tag}</span>
      </div>
    </div>
  );
}
