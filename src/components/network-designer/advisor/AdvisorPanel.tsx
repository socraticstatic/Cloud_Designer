// Network Advisor panel - consultative findings rendered in the SDCI Figma
// state language: error red, warning orange, recommendation blue, positive green.
// Clicking a finding highlights the affected nodes/edges on the canvas.

import { useState } from 'react';
import {
  X, RefreshCw, AlertOctagon, AlertCircle, Lightbulb, CheckCircle2, Sparkles
} from 'lucide-react';
import { Z_INDEX } from '../../../constants';
import { Assessment, Finding, FindingSeverity } from './advisorEngine';

interface AdvisorPanelProps {
  assessment: Assessment | null;
  isOpen: boolean;
  onClose: () => void;
  onRerun: () => void;
  onFocusFinding: (finding: Finding | null) => void;
  onApplyFix?: (finding: Finding) => void;
  focusedFindingId?: string | null;
}

const SEVERITY_META: Record<FindingSeverity, {
  label: string;
  icon: typeof AlertOctagon;
  text: string;
  border: string;
  chip: string;
}> = {
  error: { label: 'Critical', icon: AlertOctagon, text: 'text-fw-error', border: 'border-l-fw-border-error', chip: 'bg-fw-error-bg text-fw-error' },
  warning: { label: 'Warning', icon: AlertCircle, text: 'text-fw-warn', border: 'border-l-fw-border-warn', chip: 'bg-fw-warn-bg text-fw-warn' },
  recommendation: { label: 'Recommendation', icon: Lightbulb, text: 'text-fw-info', border: 'border-l-fw-border-active', chip: 'bg-fw-accent text-fw-info' },
  positive: { label: 'Strength', icon: CheckCircle2, text: 'text-fw-success', border: 'border-l-fw-border-success', chip: 'bg-fw-success-bg text-fw-success' }
};

const ORDER: FindingSeverity[] = ['error', 'warning', 'recommendation', 'positive'];

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-fw-success-bg text-fw-success border-fw-border-success',
  B: 'bg-fw-success-bg text-fw-success border-fw-border-success',
  C: 'bg-fw-warn-bg text-fw-warn border-fw-border-warn',
  D: 'bg-fw-warn-bg text-fw-warn border-fw-border-warn',
  F: 'bg-fw-error-bg text-fw-error border-fw-border-error'
};

export function AdvisorPanel({
  assessment,
  isOpen,
  onClose,
  onRerun,
  onFocusFinding,
  onApplyFix,
  focusedFindingId
}: AdvisorPanelProps) {
  const [filter, setFilter] = useState<FindingSeverity | 'all'>('all');

  if (!isOpen) return null;

  const findings = assessment?.findings ?? [];
  const visible = filter === 'all' ? findings : findings.filter(f => f.severity === filter);
  const counts = ORDER.reduce((acc, s) => ({ ...acc, [s]: findings.filter(f => f.severity === s).length }), {} as Record<FindingSeverity, number>);

  return (
    <div
      className="absolute top-4 right-4 bottom-4 w-[380px] bg-fw-base rounded-2xl shadow-xl border border-fw-border-secondary flex flex-col"
      style={{ zIndex: Z_INDEX.FLOATING_PANEL }}
      role="complementary"
      aria-label="Network Advisor"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-fw-border-secondary">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-fw-link" />
          <h2 className="text-base font-bold text-fw-heading">Network Advisor</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRerun}
            className="p-2 rounded-lg text-fw-bodyLight hover:bg-fw-wash transition-colors"
            title="Re-run analysis"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => { onFocusFinding(null); onClose(); }}
            className="p-2 rounded-lg text-fw-bodyLight hover:bg-fw-wash transition-colors"
            aria-label="Close advisor"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!assessment ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <Sparkles className="h-8 w-8 text-fw-disabled" />
          <p className="mt-3 text-sm text-fw-bodyLight">
            Import a topology or build one on the canvas, then run the advisor for consultative feedback.
          </p>
          <button
            onClick={onRerun}
            className="mt-4 px-5 py-2 text-sm font-medium rounded-full bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover transition-colors"
            type="button"
          >
            Analyze current design
          </button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="px-4 py-3 border-b border-fw-border-secondary">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl border flex items-center justify-center text-xl font-bold ${GRADE_STYLE[assessment.grade]}`}>
                {assessment.grade}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-fw-body leading-snug">{assessment.summary}</p>
                {assessment.monthlyCost > 0 && (
                  <p className="text-xs text-fw-bodyLight mt-1">
                    Est. transport spend:{' '}
                    <span className="font-medium text-fw-heading">${assessment.monthlyCost.toLocaleString()}/mo</span>
                  </p>
                )}
              </div>
            </div>

            {/* Score chips */}
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              {([
                ['Resil', assessment.scores.resiliency],
                ['Redun', assessment.scores.redundancy],
                ['DR', assessment.scores.disaster],
                ['Sec', assessment.scores.security],
                ['Perf', assessment.scores.performance]
              ] as const).map(([label, score]) => (
                <div key={label} className="rounded-lg bg-fw-wash px-1.5 py-1.5 text-center">
                  <div className={`text-sm font-bold ${score >= 70 ? 'text-fw-success' : score >= 40 ? 'text-fw-warn' : 'text-fw-error'}`}>
                    {Math.round(score)}
                  </div>
                  <div className="text-[10px] text-fw-bodyLight uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>

            {/* Severity filter */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === 'all' ? 'bg-fw-ctaPrimary text-white' : 'bg-fw-wash text-fw-body hover:bg-fw-neutral'
                }`}
                type="button"
              >
                All {findings.length}
              </button>
              {ORDER.filter(s => counts[s] > 0).map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(filter === s ? 'all' : s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === s ? 'ring-1 ring-fw-border-focus' : ''
                  } ${SEVERITY_META[s].chip}`}
                  type="button"
                >
                  {SEVERITY_META[s].label} {counts[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Findings list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
            {visible.length === 0 && (
              <p className="text-sm text-fw-bodyLight text-center mt-8">No findings in this category.</p>
            )}
            {visible.map(finding => {
              const meta = SEVERITY_META[finding.severity];
              const Icon = meta.icon;
              const isFocused = focusedFindingId === finding.id;
              return (
                <button
                  key={finding.id}
                  onClick={() => onFocusFinding(isFocused ? null : finding)}
                  className={`w-full text-left rounded-xl border border-fw-border-secondary border-l-4 ${meta.border} px-3 py-2.5 transition-colors ${
                    isFocused ? 'bg-fw-accent' : 'bg-fw-base hover:bg-fw-wash'
                  }`}
                  type="button"
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${meta.text}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-fw-heading leading-tight">{finding.title}</span>
                        <span className="text-[10px] uppercase tracking-wide text-fw-bodyLight">{finding.category}</span>
                      </div>
                      <p className="text-xs text-fw-body mt-1 leading-snug">{finding.detail}</p>
                      {finding.recommendation && (
                        <p className="text-xs text-fw-link mt-1.5 leading-snug">
                          <span className="font-medium">Recommendation:</span> {finding.recommendation}
                        </p>
                      )}
                      {finding.fix && onApplyFix && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyFix(finding);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              onApplyFix(finding);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-xs font-medium bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover transition-colors cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3" />
                          {finding.fix.label}
                        </span>
                      )}
                      {(finding.nodeIds.length > 0 || finding.edgeIds.length > 0) && (
                        <p className="text-[10px] text-fw-bodyLight mt-1.5">
                          {isFocused ? 'Highlighted on canvas - click to clear' : 'Click to highlight on canvas'}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2.5 border-t border-fw-border-secondary">
            <p className="text-[10px] text-fw-bodyLight">
              Generated {new Date(assessment.generatedAt).toLocaleString()} - mock advisory for proof of concept
            </p>
          </div>
        </>
      )}
    </div>
  );
}
