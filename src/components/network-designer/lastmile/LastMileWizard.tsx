// Last Mile wizard - per the SDCI Figma "Last Mile | Modal" frames
// (6985:50103 type select, 6985:50300 Internet-to-cloud Simple/Advanced,
// 6985:50795 VPN-to-cloud Simple/Advanced).
//
// Connection-centric: opens from a provider-bound edge with a context strip
// (provider, region, bandwidth, circuit id), one step to pick the
// connection type, then a Simple/Advanced configuration form that ends in
// Activate Connection.

import { useState } from 'react';
import {
  X, Share2, Shield, ArrowRight, ArrowLeft, Check, Zap, Settings, Network, Cog
} from 'lucide-react';
import { NetworkNode, NetworkEdge } from '../../types';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { Z_INDEX } from '../../../constants';
import { getProviderIcon } from '../../icons/ProviderIcons';

export type LastMileType = 'internet' | 'vpn';

export interface LastMileConfig {
  connectionType: LastMileType;
  mode: 'simple' | 'advanced';
  subnets: string;
  ipStack: string;
  mtu: number;
  qos: string;
  peerAsnType?: string;
  vifType?: string;
  serviceAccess?: string;
  activatedAt: number;
}

interface LastMileWizardProps {
  edge: NetworkEdge;
  destination: NetworkNode;
  onClose: () => void;
  onActivate: (config: LastMileConfig) => void;
}

// Mock circuit identity derived from the edge so it's stable per connection
const PROVIDER_META: Record<string, { service: string; prefix: string; region: string }> = {
  aws: { service: 'AWS DIRECT CONNECT', prefix: 'dxcon', region: 'us-east-1' },
  azure: { service: 'AZURE EXPRESSROUTE', prefix: 'er', region: 'eastus' },
  google: { service: 'GOOGLE CLOUD INTERCONNECT', prefix: 'ic', region: 'us-east4' },
  oracle: { service: 'ORACLE FASTCONNECT', prefix: 'fc', region: 'us-ashburn-1' }
};

function circuitIdentity(edge: NetworkEdge, destination: NetworkNode) {
  const provider = (destination.cloudProvider || destination.config?.provider || 'aws').toLowerCase();
  const key = Object.keys(PROVIDER_META).find(k => provider.includes(k)) ?? 'aws';
  const meta = PROVIDER_META[key];
  let h = 0;
  for (let i = 0; i < edge.id.length; i++) h = (h * 31 + edge.id.charCodeAt(i)) >>> 0;
  const suffix = h.toString(36).slice(0, 7);
  return {
    service: meta.service,
    region: destination.config?.region || meta.region,
    circuitId: `${meta.prefix}-${suffix}`
  };
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-fw-border-secondary rounded-lg bg-white text-fw-body focus:outline-none focus:ring-1 focus:ring-fw-border-focus';
const labelClass = 'block text-xs font-medium text-fw-heading mb-1';
const helperClass = 'mt-1 text-[11px] text-fw-bodyLight';

export function LastMileWizard({ edge, destination, onClose, onActivate }: LastMileWizardProps) {
  const existing = edge.config?.lastMile as LastMileConfig | undefined;
  const [step, setStep] = useState<'type' | 'configure'>(existing ? 'configure' : 'type');
  const [connectionType, setConnectionType] = useState<LastMileType>(existing?.connectionType ?? 'internet');
  const [mode, setMode] = useState<'simple' | 'advanced'>(existing?.mode ?? 'simple');
  const [subnets, setSubnets] = useState(existing?.subnets ?? '0.0.0.0/0');
  const [ipStack, setIpStack] = useState(existing?.ipStack ?? 'IPv4 Only');
  const [mtu, setMtu] = useState(existing?.mtu ?? 1500);
  const [qos, setQos] = useState(existing?.qos ?? 'Best Effort');
  const [peerAsnType, setPeerAsnType] = useState(existing?.peerAsnType ?? 'Public');
  const [vifType, setVifType] = useState(existing?.vifType ?? 'Private VIF');
  const [serviceAccess, setServiceAccess] = useState(existing?.serviceAccess ?? 'Internet');

  const dialogRef = useModalA11y(onClose);
  const identity = circuitIdentity(edge, destination);
  const ProviderIcon = getProviderIcon(destination.cloudProvider || destination.config?.provider);
  const subnetsValid = /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(subnets.trim());
  const mtuValid = mtu >= 1500 && mtu <= 9001;

  const handleActivate = () => {
    onActivate({
      connectionType,
      mode,
      subnets: subnets.trim(),
      ipStack,
      mtu,
      qos,
      ...(mode === 'advanced' ? { peerAsnType, vifType, serviceAccess } : {}),
      activatedAt: Date.now()
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-6"
      style={{ zIndex: Z_INDEX.MODAL }}
      onClick={onClose}
      role="dialog"
      aria-label="Last Mile setup"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] max-h-[85vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-bold text-fw-heading">
            {destination.name} Interconnect - Last Mile
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-fw-bodyLight hover:bg-fw-wash transition-colors"
            aria-label="Close"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Circuit context strip */}
        <div className="mx-5 rounded-xl border border-fw-border-secondary bg-fw-accent/40 px-3 py-2.5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white border border-fw-border-secondary flex items-center justify-center flex-shrink-0">
            {ProviderIcon ? <ProviderIcon className="h-5 w-5" /> : <Network className="h-5 w-5 text-fw-link" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold tracking-wide text-fw-heading">{identity.service}</span>
              {step === 'configure' && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide ${
                  connectionType === 'internet' ? 'bg-fw-accent text-fw-info' : 'bg-fw-success-bg text-fw-success'
                }`}>
                  {connectionType === 'internet' ? 'INTERNET TO CLOUD' : 'VPN TO CLOUD'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-fw-bodyLight mt-0.5">
              {identity.region} &nbsp;·&nbsp; {edge.bandwidth} &nbsp;·&nbsp; {identity.circuitId}
            </p>
          </div>
        </div>

        {step === 'type' ? (
          <div className="px-5 pb-5">
            <p className="text-xs font-semibold text-fw-heading mt-4 mb-2">Select Connection Type</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'internet' as const, icon: Share2, tint: 'bg-fw-accent text-fw-link', title: 'Internet to Cloud', blurb: `Public connectivity to ${destination.name} services` },
                { key: 'vpn' as const, icon: Shield, tint: 'bg-fw-success-bg text-fw-success', title: 'VPN to Cloud', blurb: `Secure private connectivity to ${destination.name}` }
              ]).map(({ key, icon: Icon, tint, title, blurb }) => (
                <button
                  key={key}
                  onClick={() => { setConnectionType(key); setStep('configure'); }}
                  className="text-left rounded-xl border border-fw-border-secondary hover:border-fw-border-active hover:shadow-md transition-all p-3.5 flex flex-col min-h-[150px]"
                  type="button"
                >
                  <span className={`h-9 w-9 rounded-lg flex items-center justify-center ${tint}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="mt-3 text-sm font-bold text-fw-heading">{title}</span>
                  <span className="mt-1 text-[11px] text-fw-bodyLight leading-snug">{blurb}</span>
                  <span className="mt-auto self-end h-7 w-7 rounded-full bg-fw-ctaPrimary text-white flex items-center justify-center">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5">
            {/* Simple | Advanced tabs */}
            <div className="flex gap-1 mt-3 border-b border-fw-border-secondary">
              {([
                ['simple', 'Simple', Zap],
                ['advanced', 'Advanced', Settings]
              ] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                    mode === key ? 'border-fw-link text-fw-link' : 'border-transparent text-fw-bodyLight hover:text-fw-body'
                  }`}
                  type="button"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {mode === 'advanced' && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-fw-heading mt-4">
                <Network className="h-3.5 w-3.5" /> Network Configuration
              </p>
            )}

            {/* Network fields */}
            <div className="mt-3">
              <label className={labelClass}>Internet Subnets<span className="text-fw-error">*</span></label>
              <input
                value={subnets}
                onChange={(e) => setSubnets(e.target.value)}
                className={`${inputClass} ${!subnetsValid ? 'border-fw-border-error' : ''}`}
                aria-label="Internet Subnets"
              />
              <p className={!subnetsValid ? 'mt-1 text-[11px] text-fw-error' : helperClass}>
                CIDR notation for internet subnets
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>IP Stack Type<span className="text-fw-error">*</span></label>
                <select value={ipStack} onChange={(e) => setIpStack(e.target.value)} className={inputClass} aria-label="IP Stack Type">
                  <option>IPv4 Only</option>
                  <option>IPv6 Only</option>
                  <option>Dual Stack</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Layer 3 MTU</label>
                <input
                  type="number"
                  min={1500}
                  max={9001}
                  value={mtu}
                  onChange={(e) => setMtu(parseInt(e.target.value, 10) || 0)}
                  className={`${inputClass} ${!mtuValid ? 'border-fw-border-error' : ''}`}
                  aria-label="Layer 3 MTU"
                />
                <p className={!mtuValid ? 'mt-1 text-[11px] text-fw-error' : helperClass}>Valid range: 1500-9001 bytes</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>Quality of Service<span className="text-fw-error">*</span></label>
                <select value={qos} onChange={(e) => setQos(e.target.value)} className={inputClass} aria-label="Quality of Service">
                  <option>Best Effort</option>
                  <option>Business Critical</option>
                  <option>Real Time</option>
                </select>
                <p className={helperClass}>Traffic prioritization setting</p>
              </div>
              {mode === 'advanced' && (
                <div>
                  <label className={labelClass}>Peer ASN Type</label>
                  <select value={peerAsnType} onChange={(e) => setPeerAsnType(e.target.value)} className={inputClass} aria-label="Peer ASN Type">
                    <option>Public</option>
                    <option>Private</option>
                  </select>
                </div>
              )}
            </div>

            {/* Advanced-only service section */}
            {mode === 'advanced' && (
              <>
                <div className="h-px bg-fw-border-secondary my-4" />
                <p className="flex items-center gap-1.5 text-xs font-semibold text-fw-heading">
                  <Cog className="h-3.5 w-3.5" /> Service Configuration
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelClass}>VIF Type</label>
                    <select value={vifType} onChange={(e) => setVifType(e.target.value)} className={inputClass} aria-label="VIF Type">
                      <option>Private VIF</option>
                      <option>Public VIF</option>
                      <option>Transit VIF</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Service Access</label>
                    <select value={serviceAccess} onChange={(e) => setServiceAccess(e.target.value)} className={inputClass} aria-label="Service Access">
                      <option>Internet</option>
                      <option>Private services</option>
                      <option>All services</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => setStep('type')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border border-fw-border-secondary text-fw-body hover:bg-fw-wash transition-colors"
                type="button"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                onClick={handleActivate}
                disabled={!subnetsValid || !mtuValid}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium transition-colors ${
                  subnetsValid && mtuValid
                    ? 'bg-fw-ctaPrimary text-white hover:bg-fw-ctaPrimaryHover'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                type="button"
              >
                <Check className="h-3.5 w-3.5" />
                Activate Connection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
