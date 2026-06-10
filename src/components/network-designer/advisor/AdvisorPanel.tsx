// Network Advisor panel v2 - canvas-fused consultative experience.
// Three tabs: Assess (grade ring, dimensions, narrative, findings with
// fix preview), Plan (ordered remediation playbook), Simulate (what-if
// failure analysis). Severity language follows the SDCI Figma legend.

import { useState } from 'react';
import {
  X, RefreshCw, AlertOctagon, AlertCircle, Lightbulb, CheckCircle2, Sparkles, Eye
} from 'lucide-react';
import { NetworkNode } from '../../../types';
import { Assessment, Finding, FindingSeverity, toDimensions } from './advisorEngine';
import { PlanStep } from './fixPreview';
import { FailureResult } from './failureSim';
import { HistoryPoint } from './scoreHistory';
import { GradeRing, DimensionBars, TrendSparkline, NarrativeBlock } from './advisorVisuals';
import { PlanTab } from './PlanTab';
import { SimulateTab } from './SimulateTab';

export type AdvisorTab = 'assess' | 'plan' | 'simulate';

interface AdvisorPanelProps {
  assessment: Assessment | null;
  narrative: string;
  history: HistoryPoint[];
  plan: PlanStep[];
  nodes: NetworkNode[];
  simResult: FailureResult | null;
  previewFindingId: string | null;
  isApplyingAll: boolean;
  applyingStep: number;
  isOpen: boolean;
  focusedFindingId?: string | null;
  onClose: () => void;
  onRerun: () => void;
  onFocusFinding: (finding: Finding | null) => void;
  onPreviewFix: (finding: Finding) => void;
  onCancelPreview: () => void;
  onApplyFix: (finding: Finding) => void;
  onApplyAll: () => void;
  onStopApplyAll: () => void;
  onSimulate: (nodeId: string) => void;
  onResetSim: () => void;
  onTabChange?: (tab: AdvisorTab) => void;
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

export function AdvisorPanel({
  assessment,
  narrative,
  history,
  plan,
  nodes,
  simResult,
  previewFindingId,
  isApplyingAll,
  applyingStep,
  isOpen,
  focusedFindingId,
  onClose,
  onRerun,
  onFocusFinding,
  onPreviewFix,
  onCancelPreview,
  onApplyFix,
  onApplyAll,
  onStopApplyAll,
  onSimulate,
  onResetSim,
  onTabChange
}: AdvisorPanelProps) {
  const [filter, setFilter] = useState<FindingSeverity | 'all'>('all');
  const [tab, setTab] = useState<AdvisorTab>('assess');

  if (!isOpen) return null;

  const switchTab = (next: AdvisorTab) => {
    setTab(next);
    onTabChange?.(next);
  };

  const findings = assessment?.findings ?? [];
  const visible = filter === 'all' ? findings : findings.filter(f => f.severity === filter);
  const counts = ORDER.reduce((acc, s) => ({ ...acc, [s]: findings.filter(f => f.severity === s).length }), {} as Record<FindingSeverity, number>);
  const dimensions = assessment ? toDimensions(assessment) : null;
  const previousDims = history.length >= 2 ? history[history.length - 2].dimensions : null;
  const fixableCount = findings.filter(f => f.fix).length;

  return (
    <div
      className="h-full w-[400px] bg-fw-base border-l border-fw-border-secondary rounded-r-xl flex flex-col"
      role="complementary"
      aria-label="Network Advisor"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
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
            onClick={() => { onFocusFinding(null); onCancelPreview(); onResetSim(); onClose(); }}
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
          {/* Tabs */}
          <div className="flex gap-1 px-4 pb-2 border-b border-fw-border-secondary">
            {([
              ['assess', 'Assess', null],
              ['plan', 'Plan', fixableCount || null],
              ['simulate', 'Simulate', null]
            ] as const).map(([key, label, badge]) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === key ? 'bg-fw-accent text-fw-link' : 'text-fw-bodyLight hover:bg-fw-wash'
                }`}
                type="button"
              >
                {label}
                {badge != null && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-fw-ctaPrimary text-white text-[9px] font-bold">{badge}</span>
                )}
              </button>
            ))}
          </div>

          {tab === 'assess' && (
            <>
              {/* Score header */}
              <div className="px-4 py-3 border-b border-fw-border-secondary">
                <div className="flex items-center gap-3">
                  <GradeRing grade={assessment.grade} />
                  <div className="flex-1 min-w-0">
                    <DimensionBars current={dimensions!} previous={previousDims} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  {assessment.monthlyCost > 0 ? (
                    <p className="text-xs text-fw-bodyLight">
                      Transport:{' '}
                      <span className="font-medium text-fw-heading">${assessment.monthlyCost.toLocaleString()}/mo</span>
                    </p>
                  ) : <span />}
                  <TrendSparkline history={history} />
                </div>
              </div>

              {/* Narrative */}
              <div className="px-4 py-3 border-b border-fw-border-secondary bg-fw-wash/50">
                <NarrativeBlock text={narrative} />
              </div>

              {/* Severity filter */}
              <div className="flex gap-1.5 px-4 py-2.5 flex-wrap border-b border-fw-border-secondary">
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

              {/* Findings list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
                {visible.length === 0 && (
                  <p className="text-sm text-fw-bodyLight text-center mt-8">No findings in this category.</p>
                )}
                {visible.map(finding => {
                  const meta = SEVERITY_META[finding.severity];
                  const Icon = meta.icon;
                  const isFocused = focusedFindingId === finding.id;
                  const isPreviewing = previewFindingId === finding.id;
                  return (
                    <button
                      key={finding.id}
                      onClick={() => onFocusFinding(isFocused ? null : finding)}
                      className={`w-full text-left rounded-xl border border-fw-border-secondary border-l-4 ${meta.border} px-3 py-2.5 transition-colors ${
                        isFocused || isPreviewing ? 'bg-fw-accent' : 'bg-fw-base hover:bg-fw-wash'
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
                          {finding.fix && (
                            <span className="inline-flex items-center gap-1.5 mt-2">
                              {isPreviewing ? (
                                <>
                                  <span
                                    role="button" tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); onApplyFix(finding); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onApplyFix(finding); } }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-fw-success text-white hover:opacity-90 transition-opacity cursor-pointer"
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    Apply
                                  </span>
                                  <span
                                    role="button" tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); onCancelPreview(); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onCancelPreview(); } }}
                                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-fw-wash text-fw-body hover:bg-fw-neutral transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span
                                    role="button" tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); onPreviewFix(finding); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onPreviewFix(finding); } }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-fw-border-active text-fw-link hover:bg-fw-accent transition-colors cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Preview
                                  </span>
                                  <span
                                    role="button" tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); onApplyFix(finding); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onApplyFix(finding); } }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover transition-colors cursor-pointer"
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    {finding.fix.label}
                                  </span>
                                </>
                              )}
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
            </>
          )}

          {tab === 'plan' && (
            <PlanTab
              plan={plan}
              baselineGrade={assessment.grade}
              baselineCost={assessment.monthlyCost}
              isApplyingAll={isApplyingAll}
              applyingStep={applyingStep}
              onApplyAll={onApplyAll}
              onStopApplyAll={onStopApplyAll}
              onApplyStep={(step) => onApplyFix(step.finding)}
              onFocusStep={(step) => onFocusFinding(step.finding)}
            />
          )}

          {tab === 'simulate' && (
            <SimulateTab
              nodes={nodes}
              simResult={simResult}
              onSimulate={onSimulate}
              onReset={onResetSim}
            />
          )}

          <div className="px-4 py-2 border-t border-fw-border-secondary">
            <p className="text-[10px] text-fw-bodyLight">
              Generated {new Date(assessment.generatedAt).toLocaleString()} - mock advisory for proof of concept
            </p>
          </div>
        </>
      )}
    </div>
  );
}
