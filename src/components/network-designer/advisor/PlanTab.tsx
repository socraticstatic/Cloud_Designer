// Remediation playbook tab: fixes ordered by score-per-dollar with
// cumulative projections, plus an Apply-all stepper.

import { Play, Square, Sparkles, Check } from 'lucide-react';
import { PlanStep } from './fixPreview';

interface PlanTabProps {
  plan: PlanStep[];
  baselineGrade: string;
  baselineCost: number;
  isApplyingAll: boolean;
  applyingStep: number;
  onApplyAll: () => void;
  onStopApplyAll: () => void;
  onApplyStep: (step: PlanStep) => void;
  onFocusStep: (step: PlanStep) => void;
}

export function PlanTab({
  plan,
  baselineGrade,
  baselineCost,
  isApplyingAll,
  applyingStep,
  onApplyAll,
  onStopApplyAll,
  onApplyStep,
  onFocusStep
}: PlanTabProps) {
  if (plan.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <Check className="h-8 w-8 text-fw-success" />
        <p className="mt-3 text-sm text-fw-bodyLight">
          Nothing left to remediate. Every fixable finding has been addressed.
        </p>
      </div>
    );
  }

  const final = plan[plan.length - 1];
  const totalCostDelta = final.cumulativeCost - baselineCost;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Projection header */}
      <div className="px-4 py-3 border-b border-fw-border-secondary">
        <p className="text-sm text-fw-body">
          {plan.length} step{plan.length > 1 ? 's' : ''} {plan.length > 1 ? 'take' : 'takes'} this design from{' '}
          <span className="font-bold">{baselineGrade}</span> to{' '}
          <span className="font-bold text-fw-success">{final.cumulativeGrade}</span>
          {totalCostDelta !== 0 && (
            <span className="text-fw-bodyLight">
              {' '}({totalCostDelta > 0 ? '+' : ''}${Math.abs(totalCostDelta).toLocaleString()}/mo)
            </span>
          )}
        </p>
        <button
          onClick={isApplyingAll ? onStopApplyAll : onApplyAll}
          className={`mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isApplyingAll
              ? 'bg-fw-error-bg text-fw-error hover:bg-red-100'
              : 'bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover'
          }`}
          type="button"
        >
          {isApplyingAll ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {isApplyingAll ? `Applying step ${applyingStep + 1} of ${plan.length}…` : 'Apply all fixes'}
        </button>
      </div>

      {/* Ordered steps */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
        {plan.map((step, i) => {
          const isActive = isApplyingAll && i === applyingStep;
          const isDone = isApplyingAll && i < applyingStep;
          const gain = step.impact.deltas;
          const gainBits = [
            gain.resilience > 0 && `+${gain.resilience} Resilience`,
            gain.security > 0 && `+${gain.security} Security`,
            gain.performance > 0 && `+${gain.performance} Performance`
          ].filter(Boolean);
          return (
            <div
              key={step.finding.id}
              className={`rounded-xl border px-3 py-2.5 transition-all ${
                isActive ? 'border-fw-border-active bg-fw-accent' :
                isDone ? 'border-fw-border-success bg-fw-success-bg opacity-70' :
                'border-fw-border-secondary bg-fw-base'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                  isDone ? 'bg-fw-success text-white' : 'bg-fw-wash text-fw-heading'
                }`}>
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => onFocusStep(step)}
                    className="text-left text-sm font-medium text-fw-heading leading-tight hover:text-fw-link"
                    type="button"
                  >
                    {step.finding.fix!.label}
                  </button>
                  <p className="text-xs text-fw-bodyLight mt-0.5 leading-snug">{step.finding.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px]">
                    {gainBits.map(bit => (
                      <span key={bit as string} className="px-1.5 py-0.5 rounded bg-fw-success-bg text-fw-success font-medium">{bit}</span>
                    ))}
                    <span className={`px-1.5 py-0.5 rounded font-medium ${
                      step.impact.costDelta > 0 ? 'bg-fw-wash text-fw-bodyLight' : 'bg-fw-success-bg text-fw-success'
                    }`}>
                      {step.impact.costDelta > 0 ? `+$${step.impact.costDelta.toLocaleString()}/mo` : 'no added cost'}
                    </span>
                    <span className="text-fw-disabled">after: {step.cumulativeGrade}</span>
                  </div>
                </div>
                {!isApplyingAll && (
                  <button
                    onClick={() => onApplyStep(step)}
                    className="flex-shrink-0 p-1.5 rounded-full bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover"
                    title="Apply this fix"
                    type="button"
                  >
                    <Sparkles className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
