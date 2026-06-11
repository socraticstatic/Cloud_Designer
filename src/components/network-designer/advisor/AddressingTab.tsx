// Advisor Addressing tab - the IP address plan for the whole design.
// The Assess tab only speaks about IP space when ranges collide; this
// shows every range each environment carries, conflicts marked in place
// with the same one-click renumber fix the finding offers. A clean plan
// says so explicitly - no news must be distinguishable from no coverage.

import { Network, AlertOctagon, CheckCircle2, Sparkles } from 'lucide-react';
import { NetworkNode } from '../../../types';
import { Finding, buildAddressPlan } from './advisorEngine';

interface AddressingTabProps {
  nodes: NetworkNode[];
  findings: Finding[];
  isReadOnly: boolean;
  onApplyFix: (finding: Finding) => void;
  onFocusFinding: (finding: Finding | null) => void;
  focusedFindingId?: string | null;
}

export function AddressingTab({
  nodes,
  findings,
  isReadOnly,
  onApplyFix,
  onFocusFinding,
  focusedFindingId
}: AddressingTabProps) {
  const plan = buildAddressPlan(nodes);

  // The renumber fix lives on the assessment finding; match it to the row
  // it rewrites (the finding targets a specific node + from-range)
  const fixFor = (nodeId: string, cidr: string) =>
    findings.find(f =>
      f.fix?.action.type === 'renumber-subnet' &&
      f.fix.action.nodeId === nodeId &&
      f.fix.action.from === cidr
    );

  if (plan.rows.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <Network className="h-8 w-8 text-fw-disabled" />
        <p className="mt-3 text-sm text-fw-bodyLight">
          No IP addressing data in this design yet. Discover a cloud account or add subnets to a node's
          configuration and the address plan builds itself.
        </p>
      </div>
    );
  }

  // Group rows by node, preserving topology order
  const byNode = plan.rows.reduce((acc, row) => {
    (acc[row.nodeId] ??= []).push(row);
    return acc;
  }, {} as Record<string, typeof plan.rows>);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar" data-testid="addressing-tab">
      {/* Plan summary */}
      <div className="px-4 py-3 border-b border-fw-border-secondary bg-fw-wash/50">
        <div className="flex items-center gap-2">
          {plan.conflictPairs > 0 ? (
            <>
              <AlertOctagon className="h-4 w-4 text-fw-error flex-shrink-0" />
              <p className="text-sm font-medium text-fw-heading">
                {plan.conflictPairs} {plan.conflictPairs === 1 ? 'conflict' : 'conflicts'} in {plan.rows.length} ranges
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-fw-success flex-shrink-0" />
              <p className="text-sm font-medium text-fw-heading">
                Address plan is clean - {plan.rows.length} {plan.rows.length === 1 ? 'range' : 'ranges'}, no overlaps
              </p>
            </>
          )}
        </div>
        <p className="text-xs text-fw-bodyLight mt-1">
          {Object.keys(byNode).length} environments carry addressing
          {plan.unaddressed > 0 && ` - ${plan.unaddressed} without subnet data`}
          {plan.nextFree && (
            <> - next free range: <span className="font-mono font-medium text-fw-heading">{plan.nextFree}</span></>
          )}
        </p>
      </div>

      {/* Per-environment ranges */}
      <div className="px-3 py-3 space-y-2">
        {Object.entries(byNode).map(([nodeId, rows]) => (
          <div key={nodeId} className="rounded-xl border border-fw-border-secondary bg-fw-base px-3 py-2.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-medium text-fw-heading">{rows[0].nodeName}</span>
              {(rows[0].provider || rows[0].site) && (
                <span className="text-[10px] uppercase tracking-wide text-fw-bodyLight">
                  {[rows[0].provider, rows[0].site].filter(Boolean).join(' - ')}
                </span>
              )}
            </div>
            <div className="mt-1.5 space-y-1.5">
              {rows.map(row => {
                const conflicted = row.conflicts.length > 0;
                const fixFinding = conflicted ? fixFor(row.nodeId, row.cidr) : undefined;
                const isFocused = fixFinding && focusedFindingId === fixFinding.id;
                return (
                  <div
                    key={row.cidr}
                    className={`rounded-lg px-2.5 py-1.5 ${
                      conflicted
                        ? `border border-fw-border-error ${isFocused ? 'bg-fw-accent' : 'bg-fw-error-bg/40'}`
                        : 'bg-fw-wash'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-mono text-xs ${conflicted ? 'text-fw-error font-medium' : 'text-fw-body'}`}>
                        {row.cidr}
                      </span>
                      {conflicted ? (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-fw-error">Conflict</span>
                      ) : (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-fw-success">Clear</span>
                      )}
                    </div>
                    {conflicted && (
                      <p className="text-xs text-fw-body mt-1 leading-snug">
                        Collides with{' '}
                        {row.conflicts.map((c, i) => (
                          <span key={`${c.nodeId}-${c.cidr}`}>
                            {i > 0 && ', '}
                            <span className="font-medium">{c.nodeName}</span>{' '}
                            <span className="font-mono">{c.cidr}</span>
                          </span>
                        ))}
                      </p>
                    )}
                    {fixFinding && !isReadOnly && (
                      <span className="inline-flex items-center gap-1.5 mt-1.5">
                        <span
                          role="button" tabIndex={0}
                          onClick={() => onApplyFix(fixFinding)}
                          onKeyDown={(e) => { if (e.key === 'Enter') onApplyFix(fixFinding); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover transition-colors cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3" />
                          {fixFinding.fix!.label}
                        </span>
                        <span
                          role="button" tabIndex={0}
                          onClick={() => onFocusFinding(isFocused ? null : fixFinding)}
                          onKeyDown={(e) => { if (e.key === 'Enter') onFocusFinding(isFocused ? null : fixFinding); }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-fw-wash text-fw-body hover:bg-fw-neutral transition-colors cursor-pointer"
                        >
                          {isFocused ? 'Clear highlight' : 'Highlight'}
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
