// Cloud-to-cloud paths tab (PRD U3) with policy-based selection (U4).
// Each destination pair shows the route the control plane would choose
// under the active policy; paths transiting the AT&T Core carry the
// AT&T-controlled badge (the O1 metric, made visible per design).

import { Route, Lock, Unlock } from 'lucide-react';
import { CloudPath, PathPolicy, POLICY_LABEL } from './pathEngine';

interface PathsTabProps {
  paths: CloudPath[];
  policy: PathPolicy;
  onPolicyChange: (policy: PathPolicy) => void;
  onFocusPath: (path: CloudPath | null) => void;
  focusedPathId: string | null;
}

export function PathsTab({ paths, policy, onPolicyChange, onFocusPath, focusedPathId }: PathsTabProps) {
  const controlled = paths.filter(p => p.attControlled).length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Policy selector - the control plane's routing intent */}
      <div className="px-4 py-3 border-b border-fw-border-secondary">
        <p className="text-[11px] font-medium text-fw-bodyLight uppercase tracking-wide">Optimize paths for</p>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {(Object.keys(POLICY_LABEL) as PathPolicy[]).map(key => (
            <button
              key={key}
              onClick={() => onPolicyChange(key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                policy === key ? 'bg-fw-ctaPrimary text-white' : 'bg-fw-wash text-fw-body hover:bg-fw-neutral'
              }`}
              type="button"
            >
              {POLICY_LABEL[key]}
            </button>
          ))}
        </div>
        {paths.length > 0 && (
          <p className="mt-2 text-xs text-fw-body">
            <span className="font-bold text-fw-link">{controlled} of {paths.length}</span> cloud-to-cloud
            paths ride the AT&T mid-mile
          </p>
        )}
      </div>

      {/* Path cards */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
        {paths.length === 0 && (
          <p className="text-sm text-fw-bodyLight text-center mt-8 px-4">
            Connect two or more cloud destinations and the control plane will compute
            the best path between them under your policy.
          </p>
        )}
        {paths.map(path => {
          const isFocused = focusedPathId === path.id;
          return (
            <button
              key={path.id}
              onClick={() => onFocusPath(isFocused ? null : path)}
              className={`w-full text-left rounded-xl border border-fw-border-secondary px-3 py-2.5 transition-colors ${
                isFocused ? 'bg-fw-accent border-fw-border-active' : 'bg-fw-base hover:bg-fw-wash'
              }`}
              type="button"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Route className="h-3.5 w-3.5 text-fw-link flex-shrink-0" />
                <span className="text-sm font-medium text-fw-heading">
                  {path.from.name} &harr; {path.to.name}
                </span>
                {path.attControlled && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide bg-cobalt-100 text-cobalt-700">
                    AT&T-CONTROLLED
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-fw-bodyLight truncate" title={path.hopNames.join(' > ')}>
                {path.hopNames.join(' › ')}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-fw-body flex-wrap">
                <span className="tabular-nums">{path.latencyMs} ms</span>
                <span className="tabular-nums">${path.monthlyCost.toLocaleString()}/mo transport</span>
                <span className="tabular-nums">~${path.egressMonthly.toLocaleString()}/mo egress</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide ${
                  path.controlMethod === 'native' ? 'bg-fw-success-bg text-fw-success' : 'bg-fw-wash text-fw-bodyLight'
                }`}>
                  {path.controlMethod === 'native' ? 'NATIVE CONTROL' : 'OVERLAY FALLBACK'}
                </span>
                <span className={`inline-flex items-center gap-1 ${path.fullyEncrypted ? 'text-fw-success' : 'text-fw-warn'}`}>
                  {path.fullyEncrypted ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  {path.fullyEncrypted ? 'encrypted' : 'partially open'}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-fw-disabled">{path.reason}{isFocused ? ' · highlighted on canvas' : ''}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
