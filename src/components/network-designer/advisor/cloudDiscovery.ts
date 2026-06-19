// Mock cloud-account discovery - the vDiscovery-style import path.
// Given a provider and an account id, deterministically "discovers" a
// plausible environment: VPCs/VNETs with regions, subnets, and tags,
// hubbed behind a gateway on the AT&T core. Everything derives from
// a hash of the account id so the same account always discovers the same
// estate. Two VPCs deliberately share a CIDR: overlapping IP space is the
// most common real-world discovery failure, and our advisor flags it.

import { NetworkNode, NetworkEdge } from '../../types';
import { getNodeIcon } from '../../../utils/nodeUtils';
import { seedEdgeMetrics } from '../../../utils/mockTelemetry';
import { ParseResult } from './topologyParser';

interface ProviderProfile {
  label: string;
  regions: string[];
  edgeType: string;
}

const PROFILES: Record<string, ProviderProfile> = {
  AWS: { label: 'AWS', regions: ['us-east-1', 'us-west-2', 'us-east-2', 'eu-west-1'], edgeType: 'Direct Connect' },
  Azure: { label: 'Azure', regions: ['eastus', 'westus2', 'southcentralus', 'northeurope'], edgeType: 'ExpressRoute' },
  Google: { label: 'Google', regions: ['us-central1', 'us-east1', 'us-east4', 'europe-west1'], edgeType: 'Cloud Interconnect' },
  Oracle: { label: 'Oracle', regions: ['us-ashburn-1', 'us-phoenix-1'], edgeType: 'FastConnect' },
  // Neocloud (PRD exec summary) - AI-infrastructure cloud
  CoreWeave: { label: 'CoreWeave', regions: ['us-east-04', 'us-west-01'], edgeType: 'Ethernet' }
};

const ENVS = ['prod', 'staging', 'dev', 'shared'];
const TEAMS = ['payments', 'platform', 'data', 'edge'];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function discoverAccount(provider: keyof typeof PROFILES, accountId: string): ParseResult {
  const profile = PROFILES[provider] ?? PROFILES.AWS;
  const seed = hash(`${provider}:${accountId.trim() || 'demo'}`);
  const vpcCount = 2 + (seed % 3); // 2-4 VPCs
  const stamp = Date.now();

  const core: NetworkNode = {
    id: `node-disc-${stamp}-core`,
    type: 'network',
    x: 200, y: 300,
    name: 'AT&T Core',
    icon: getNodeIcon('network', undefined, 'at&t core'),
    status: 'active',
    config: { networkType: 'at&t core', provider: 'AT&T', city: 'Dallas', configured: true }
  };
  const hub: NetworkNode = {
    id: `node-disc-${stamp}-hub`,
    type: 'function',
    functionType: 'Router',
    x: 450, y: 300,
    name: `${profile.label}HubRouter`,
    icon: getNodeIcon('function', 'Router', undefined, { routerType: 'cloud' }),
    status: 'active',
    config: { routerType: 'cloud', city: 'Dallas', configured: true, asn: 64512 + (seed % 100) }
  };

  const vpcs: NetworkNode[] = [];
  for (let i = 0; i < vpcCount; i++) {
    const env = ENVS[(seed + i) % ENVS.length];
    const region = profile.regions[(seed + i) % profile.regions.length];
    // VPC 0 and 1 deliberately share 10.0.0.0/16 - the classic overlap
    const cidr = i === 1 ? '10.0.0.0/16' : `10.${i * 2}.0.0/16`;
    vpcs.push({
      id: `node-disc-${stamp}-vpc${i}`,
      type: 'destination',
      cloudProvider: provider,
      x: 720, y: 140 + i * 180,
      name: `${env}-vpc-${region}`,
      icon: getNodeIcon('destination', undefined, undefined, { provider }),
      status: 'active',
      config: {
        provider,
        region,
        configured: true,
        subnets: [cidr, `172.${16 + i}.0.0/20`],
        gateways: [`igw-${(seed + i).toString(36).slice(0, 6)}`, `tgw-${(seed * 7 + i).toString(36).slice(0, 6)}`],
        tags: { environment: env, team: TEAMS[(seed + i * 3) % TEAMS.length], discovered: 'true' }
      }
    });
  }

  const edges: NetworkEdge[] = [
    seedEdgeMetrics({
      id: `edge-disc-${stamp}-core`,
      source: core.id,
      target: hub.id,
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'active',
      config: { encrypted: true, resilience: 'redundant' }
    }),
    ...vpcs.map((vpc, i) =>
      seedEdgeMetrics({
        id: `edge-disc-${stamp}-vpc${i}`,
        source: hub.id,
        target: vpc.id,
        type: profile.edgeType,
        bandwidth: i === 0 ? '10 Gbps' : '1 Gbps',
        status: 'active',
        // no lastMile on purpose: discovered circuits are not yet activated,
        // so the advisor's last-mile finding fires on a fresh discovery
        config: {}
      })
    )
  ];

  return {
    ok: true,
    nodes: [core, hub, ...vpcs],
    edges,
    warnings: [],
    sourceName: `${profile.label} account ${accountId.trim() || 'demo'}`,
    provenance: { provider: profile.label, accountId: accountId.trim() || 'demo' }
  };
}

// The staged progress lines the modal animates through during a "scan"
export function discoverySteps(provider: string, accountId: string, vpcWord: string): string[] {
  return [
    `Authenticating to ${provider}…`,
    `Reading account ${accountId.trim() || 'demo'}…`,
    `Enumerating ${vpcWord}s…`,
    'Reading subnets and route tables…',
    'Collecting instance metadata and tags…',
    'Building topology…'
  ];
}

export const VPC_WORD: Record<string, string> = {
  AWS: 'VPC', Azure: 'VNET', Google: 'VPC', Oracle: 'VCN', CoreWeave: 'VPC'
};
