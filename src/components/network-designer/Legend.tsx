// Canvas legend - mirrors the state legend frame on the SDCI Figma
// "Network Designer | Nodes" page.

import { useState } from 'react';
import { Info, X, AlertCircle, Pencil, Check } from 'lucide-react';
import { Z_INDEX } from '../../constants';

const LINE_STATES = [
  { label: 'Not configured', className: 'border-t-2 border-dashed border-gray-300' },
  { label: 'Inactive', className: 'border-t-2 border-gray-400' },
  { label: 'Active', className: 'border-t-2', style: { borderColor: '#2D7E24' } },
  { label: 'Error', className: 'border-t-2', style: { borderColor: '#C70032' } },
  { label: 'Warning', className: 'border-t-2', style: { borderColor: '#EA712F' } }
];

export function Legend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-6 right-6" style={{ zIndex: Z_INDEX.CHROME }}>
      {open && (
        <div className="absolute bottom-12 right-0 w-56 bg-fw-base rounded-xl shadow-lg border border-fw-border-secondary py-2">
          <div className="flex items-center justify-between px-3 pb-1.5 border-b border-fw-border-secondary">
            <span className="text-xs font-medium text-fw-bodyLight uppercase tracking-wide">Legend</span>
            <button onClick={() => setOpen(false)} className="text-fw-bodyLight hover:text-fw-body" type="button" aria-label="Close legend">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="px-3 py-2 space-y-2">
            <div className="flex items-center gap-2.5 text-xs text-fw-body">
              <AlertCircle className="h-3.5 w-3.5 text-fw-error" /> Error
            </div>
            <div className="flex items-center gap-2.5 text-xs text-fw-body">
              <Pencil className="h-3.5 w-3.5 text-fw-warn" /> Not configured
            </div>
            <div className="flex items-center gap-2.5 text-xs text-fw-body">
              <Check className="h-3.5 w-3.5 text-fw-success" /> Configured
            </div>
            <div className="flex items-center gap-2.5 text-xs text-fw-body">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600 inline-block" /> Active node
            </div>
            <div className="flex items-center gap-2.5 text-xs text-fw-body">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400 inline-block" /> Inactive node
            </div>
            {LINE_STATES.map(line => (
              <div key={line.label} className="flex items-center gap-2.5 text-xs text-fw-body">
                <span className={`w-6 inline-block ${line.className}`} style={line.style} /> {line.label}
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-full bg-fw-base border border-fw-border-secondary shadow-sm flex items-center justify-center text-fw-bodyLight hover:text-fw-body hover:shadow-md transition-all"
        title="Canvas legend"
        type="button"
      >
        <Info className="h-5 w-5" />
      </button>
    </div>
  );
}
