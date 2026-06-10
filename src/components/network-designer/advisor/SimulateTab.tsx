// What-if failure simulation tab: pick a node, fail it, read the blast
// radius. The canvas paints unreachable nodes and dead links in error red.

import { Zap, RotateCcw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { NetworkNode } from '../../../types';
import { FailureResult } from './failureSim';

interface SimulateTabProps {
  nodes: NetworkNode[];
  simResult: FailureResult | null;
  onSimulate: (nodeId: string) => void;
  onReset: () => void;
}

export function SimulateTab({ nodes, simResult, onSimulate, onReset }: SimulateTabProps) {
  const failed = simResult ? nodes.find(n => n.id === simResult.failedNodeId) : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-fw-border-secondary">
        <p className="text-xs text-fw-bodyLight leading-snug">
          Pick a node and the advisor computes the real blast radius: which paths die,
          which sites go dark, whether the design absorbs the loss.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-1.5">
        {nodes.map(node => {
          const isFailed = simResult?.failedNodeId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => (isFailed ? onReset() : onSimulate(node.id))}
              className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                isFailed
                  ? 'border-fw-border-error bg-fw-error-bg'
                  : 'border-fw-border-secondary bg-fw-base hover:bg-fw-wash'
              }`}
              type="button"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-fw-heading">{node.name}</span>
                <span className="ml-2 text-[10px] uppercase tracking-wide text-fw-bodyLight">
                  {node.functionType || node.config?.networkType || node.type}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium flex-shrink-0 ${
                isFailed ? 'text-fw-error' : 'text-fw-link'
              }`}>
                <Zap className="h-3 w-3" />
                {isFailed ? 'failed' : 'fail it'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Verdict */}
      {simResult && (
        <div className={`mx-3 mb-3 rounded-xl border px-3 py-3 ${
          simResult.isArticulation ? 'border-fw-border-error bg-fw-error-bg' : 'border-fw-border-success bg-fw-success-bg'
        }`}>
          <div className="flex items-start gap-2">
            {simResult.isArticulation
              ? <ShieldAlert className="h-4 w-4 text-fw-error mt-0.5 flex-shrink-0" />
              : <ShieldCheck className="h-4 w-4 text-fw-success mt-0.5 flex-shrink-0" />}
            <div className="min-w-0">
              <p className="text-xs text-fw-body leading-snug">{simResult.verdict}</p>
              {simResult.downSites.length > 0 && (
                <p className="text-[11px] text-fw-error font-medium mt-1.5">
                  Sites dark: {simResult.downSites.join(', ')}
                </p>
              )}
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-fw-link hover:underline"
                type="button"
              >
                <RotateCcw className="h-3 w-3" />
                Restore {failed?.name ?? 'node'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
