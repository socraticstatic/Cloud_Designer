// Upload network topology data (JSON / CSV) - styled per the SDCI Figma
// "Network Designer" concept pages and AT&T Flywheel tokens.

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, UploadCloud, FileJson, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Z_INDEX } from '../../../constants';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { parseTopologyFile, parseTopologyJSON, ParseResult } from './topologyParser';
import { downloadSample } from './sampleTopologies';
import { discoverAccount, discoverySteps, VPC_WORD } from './cloudDiscovery';
import { Radar } from 'lucide-react';

interface TopologyImportModalProps {
  isOpen: boolean;
  initialTab?: 'upload' | 'paste' | 'discover';
  onClose: () => void;
  onImport: (result: ParseResult) => void;
}

export function TopologyImportModal({ isOpen, onClose, onImport, initialTab = 'upload' }: TopologyImportModalProps) {
  const dialogRef = useModalA11y(onClose, isOpen);
  const [tab, setTab] = useState<'upload' | 'paste' | 'discover'>('upload');
  const [provider, setProvider] = useState<'AWS' | 'Azure' | 'Google' | 'Oracle'>('AWS');
  const [accountId, setAccountId] = useState('');
  const [scanStep, setScanStep] = useState(-1); // -1 idle, >=0 scanning
  const [pasted, setPasted] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open on the requested tab (e.g. the welcome screen's Discover card)
  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  const startScan = (prov: typeof provider, acct: string) => {
    setScanStep(0);
    const steps = discoverySteps(prov, acct, VPC_WORD[prov]);
    steps.forEach((_, i) => {
      setTimeout(() => {
        setScanStep(i + 1);
        if (i === steps.length - 1) {
          setResult(discoverAccount(prov, acct));
          setScanStep(-1);
        }
      }, 450 * (i + 1));
    });
  };

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
            {([['upload', 'Upload file'], ['paste', 'Paste JSON'], ['discover', 'Discover']] as const).map(([key, label]) => (
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

          {tab === 'discover' && !result && (
            <div>
              <p className="text-xs text-fw-bodyLight leading-snug">
                Connect to a cloud account and discover its live estate: {VPC_WORD[provider]}s, subnets,
                instances, and tags become a topology the advisor can assess. Mocked for this proof of
                concept - the same account always discovers the same environment.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="block text-xs font-medium text-fw-heading mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={e => setProvider(e.target.value as typeof provider)}
                    className="w-full px-3 py-2 text-sm border border-fw-border-secondary rounded-lg bg-white"
                    aria-label="Cloud provider"
                    disabled={scanStep >= 0}
                  >
                    <option>AWS</option>
                    <option>Azure</option>
                    <option>Google</option>
                    <option>Oracle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-fw-heading mb-1">Account / subscription ID</label>
                  <input
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    placeholder="e.g. 4156-8721-0042"
                    className="w-full px-3 py-2 text-sm border border-fw-border-secondary rounded-lg"
                    aria-label="Account ID"
                    disabled={scanStep >= 0}
                  />
                </div>
              </div>

              {scanStep < 0 && (
                <p className="mt-2 text-[11px] text-fw-bodyLight">
                  No account handy?{' '}
                  <button
                    onClick={() => { setProvider('AWS'); setAccountId('4156-8721-0042'); startScan('AWS', '4156-8721-0042'); }}
                    className="text-fw-link underline hover:no-underline"
                    type="button"
                  >
                    Try the demo account
                  </button>
                </p>
              )}

              {scanStep >= 0 ? (
                <div className="mt-5 rounded-xl border border-fw-border-secondary bg-fw-wash px-4 py-4">
                  {discoverySteps(provider, accountId, VPC_WORD[provider]).map((line, i) => (
                    <p key={line} className={`text-xs py-0.5 flex items-center gap-2 ${
                      i < scanStep ? 'text-fw-success' : i === scanStep ? 'text-fw-heading font-medium' : 'text-fw-disabled'
                    }`}>
                      {i < scanStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : i === scanStep ? <Radar className="h-3.5 w-3.5 animate-spin" /> : <span className="w-3.5" />}
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => startScan(provider, accountId)}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover transition-colors"
                  type="button"
                >
                  <Radar className="h-4 w-4" />
                  Scan account
                </button>
              )}
            </div>
          )}

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
