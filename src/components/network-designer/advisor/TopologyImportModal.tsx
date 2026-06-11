// Upload network topology data (JSON / CSV) - styled per the SDCI Figma
// "Network Designer" concept pages and AT&T Flywheel tokens.

import { useState, useRef, useCallback } from 'react';
import { X, UploadCloud, FileJson, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Z_INDEX } from '../../../constants';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { parseTopologyFile, parseTopologyJSON, ParseResult } from './topologyParser';
import { downloadSample } from './sampleTopologies';

interface TopologyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: ParseResult) => void;
}

export function TopologyImportModal({ isOpen, onClose, onImport }: TopologyImportModalProps) {
  const dialogRef = useModalA11y(onClose, isOpen);
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [pasted, setPasted] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => setResult(parseTopologyFile(file.name, String(reader.result)));
    reader.readAsText(file);
  }, []);

  if (!isOpen) return null;

  const handleParsePasted = () => setResult(parseTopologyJSON(pasted, 'pasted JSON'));

  const handleImport = () => {
    if (result?.ok) {
      onImport(result);
      setResult(null);
      setPasted('');
      onClose();
    }
  };

  const reset = () => setResult(null);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-fw-heading/40"
      style={{ zIndex: Z_INDEX.MODAL }}
      onClick={onClose}
    >
      <div
        className="bg-fw-base rounded-2xl shadow-xl w-[560px] max-w-[92vw] max-h-[85vh] overflow-y-auto custom-scrollbar"
        onClick={e => e.stopPropagation()}
        role="dialog"
        ref={dialogRef}
        aria-label="Import network topology"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-fw-border-secondary">
          <div>
            <h2 className="text-lg font-bold text-fw-heading">Import network topology</h2>
            <p className="text-sm text-fw-bodyLight mt-0.5">
              Upload your existing topology and get consultative feedback from the Network Advisor.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-fw-bodyLight hover:bg-fw-wash transition-colors"
            aria-label="Close"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-fw-border-secondary mb-5">
            {([['upload', 'Upload file'], ['paste', 'Paste JSON']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); reset(); }}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === key
                    ? 'border-fw-border-active text-fw-link'
                    : 'border-transparent text-fw-bodyLight hover:text-fw-body'
                }`}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'upload' && !result && (
            <>
              <div
                className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer ${
                  dragActive ? 'border-fw-border-active bg-fw-accent' : 'border-fw-border-secondary bg-fw-wash hover:bg-fw-accent'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
              >
                <UploadCloud className="h-10 w-10 mx-auto text-fw-link" />
                <p className="mt-3 text-sm font-medium text-fw-heading">
                  Drop your topology file here, or <span className="text-fw-link underline">browse</span>
                </p>
                <p className="mt-1 text-xs text-fw-bodyLight">JSON (nodes + edges) or CSV (connection list), up to 1 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,application/json,text/csv"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = '';
                  }}
                />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <span className="text-xs text-fw-bodyLight">Need a starting point?</span>
                <button
                  onClick={() => downloadSample('json')}
                  className="flex items-center gap-1.5 text-xs font-medium text-fw-link hover:text-fw-linkHover"
                  type="button"
                >
                  <FileJson className="h-3.5 w-3.5" /> Sample JSON <Download className="h-3 w-3" />
                </button>
                <button
                  onClick={() => downloadSample('csv')}
                  className="flex items-center gap-1.5 text-xs font-medium text-fw-link hover:text-fw-linkHover"
                  type="button"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Sample CSV <Download className="h-3 w-3" />
                </button>
              </div>
            </>
          )}

          {tab === 'paste' && !result && (
            <>
              <textarea
                value={pasted}
                onChange={e => setPasted(e.target.value)}
                placeholder={'{\n  "nodes": [...],\n  "edges": [...]\n}'}
                className="w-full h-48 px-3 py-2.5 text-sm font-mono border border-fw-border-secondary rounded-lg bg-fw-base text-fw-body placeholder:text-fw-disabled resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleParsePasted}
                  disabled={!pasted.trim()}
                  className="px-5 py-2 text-sm font-medium rounded-full bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover disabled:bg-fw-disabled-bg disabled:text-fw-disabled transition-colors"
                  type="button"
                >
                  Parse topology
                </button>
              </div>
            </>
          )}

          {/* Parse result */}
          {result && (
            <div>
              {result.ok ? (
                <div className="rounded-xl border border-fw-border-success bg-fw-success-bg px-4 py-3 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-fw-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-fw-heading">
                      Parsed {result.sourceName ? `"${result.sourceName}"` : 'topology'} successfully
                    </p>
                    <p className="text-sm text-fw-body mt-0.5">
                      {result.nodes.length} nodes, {result.edges.length} connections detected.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-fw-border-error bg-fw-error-bg px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-fw-error flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-fw-error">Could not parse topology</p>
                    <p className="text-sm text-fw-body mt-0.5">{result.error}</p>
                  </div>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="mt-3 rounded-xl border border-fw-border-warn bg-fw-warn-bg px-4 py-3">
                  <p className="text-xs font-medium text-fw-warn uppercase tracking-wide mb-1.5">
                    {result.warnings.length} import note{result.warnings.length > 1 ? 's' : ''}
                  </p>
                  <ul className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-fw-body">{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between mt-5">
                <button
                  onClick={reset}
                  className="px-4 py-2 text-sm font-medium rounded-full border border-fw-border-secondary text-fw-body hover:bg-fw-wash transition-colors"
                  type="button"
                >
                  Start over
                </button>
                <button
                  onClick={handleImport}
                  disabled={!result.ok}
                  className="px-5 py-2 text-sm font-medium rounded-full bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover disabled:bg-fw-disabled-bg disabled:text-fw-disabled transition-colors"
                  type="button"
                >
                  Import &amp; analyze
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
