// Topology import parser
// Accepts customer topology data as JSON or CSV and normalizes it
// into NetworkNode/NetworkEdge structures with an auto-layout pass.

import { NetworkNode, NetworkEdge } from '../../../types';
import { getNodeIcon, getNodeDisplayName } from '../../../utils/nodeUtils';
import { seedEdgeMetrics } from '../../../utils/mockTelemetry';
import { getSafeBounds, CANVAS_BOUNDS } from '../../../constants';

export interface ParseResult {
  ok: boolean;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  warnings: string[];
  error?: string;
  sourceName?: string;
  // Set when the topology came from cloud-account discovery
  provenance?: { provider: string; accountId: string };
}

type RawNode = Record<string, any>;
type RawEdge = Record<string, any>;

const CANVAS_WIDTH = 1100;

// Map loose type strings from customer data onto our node model
function normalizeType(raw: string | undefined, name: string): {
  type: NetworkNode['type'];
  functionType?: string;
  networkType?: string;
} {
  const t = (raw || '').toLowerCase().trim();
  const n = (name || '').toLowerCase();

  if (['destination', 'cloud', 'aws', 'azure', 'gcp', 'google', 'oracle', 'vpc', 'vnet'].includes(t)) {
    return { type: 'destination' };
  }
  if (['datacenter', 'data center', 'dc', 'colo', 'colocation'].includes(t)) {
    return { type: 'datacenter' };
  }
  if (['network', 'internet', 'mpls', 'wan', 'core', 'transit'].includes(t)) {
    const networkType = t === 'internet' ? 'internet' : t === 'core' || t === 'transit' ? 'at&t core' : 'private';
    return { type: 'network', networkType };
  }
  if (['router', 'cloud router', 'cloud-router'].includes(t)) {
    return { type: 'function', functionType: 'Router' };
  }
  if (['firewall', 'fw', 'ngfw'].includes(t)) {
    return { type: 'function', functionType: 'Firewall' };
  }
  if (['sdwan', 'sd-wan'].includes(t)) {
    return { type: 'function', functionType: 'SDWAN' };
  }
  if (['vnf', 'vnat', 'flexware', 'function'].includes(t)) {
    return { type: 'function', functionType: t === 'function' ? 'VNF' : t.toUpperCase() };
  }

  // Infer from name when type is missing or unknown
  if (/aws|azure|gcp|google|oracle|cloud(?! router)/.test(n)) return { type: 'destination' };
  if (/firewall|fw/.test(n)) return { type: 'function', functionType: 'Firewall' };
  if (/sd-?wan/.test(n)) return { type: 'function', functionType: 'SDWAN' };
  if (/router/.test(n)) return { type: 'function', functionType: 'Router' };
  if (/equinix|digital realty|datacenter|data center|colo/.test(n)) return { type: 'datacenter' };
  if (/internet/.test(n)) return { type: 'network', networkType: 'internet' };
  if (/core|mpls|backbone/.test(n)) return { type: 'network', networkType: 'at&t core' };
  return { type: 'function', functionType: 'VNF' };
}

function cleanBandwidth(raw: any): string {
  if (!raw) return '1 Gbps';
  const s = String(raw).trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(g|gb|gbps|m|mb|mbps)?/i);
  if (!m) return '1 Gbps';
  const value = m[1];
  const unit = (m[2] || 'gbps').toLowerCase();
  return unit.startsWith('m') ? `${value} Mbps` : `${value} Gbps`;
}

// Column-based auto-layout: networks left, functions center,
// destinations right, datacenters lower-right - mirrors the
// left-to-right flow used across the network designer.
function layoutNodes(nodes: NetworkNode[]): NetworkNode[] {
  const safe = getSafeBounds(CANVAS_WIDTH, CANVAS_BOUNDS.MAX_Y);
  const columns: Record<string, NetworkNode[]> = { network: [], function: [], destination: [], datacenter: [] };
  nodes.forEach(n => columns[n.type]?.push(n));

  const columnX: Record<string, number> = {
    network: safe.minX + 40,
    function: safe.minX + (safe.maxX - safe.minX) * 0.42,
    destination: safe.maxX - 140,
    datacenter: safe.minX + (safe.maxX - safe.minX) * 0.68
  };

  const usable = safe.maxY - safe.minY - 120;
  Object.entries(columns).forEach(([type, group]) => {
    const gap = group.length > 1 ? Math.min(150, usable / (group.length - 1)) : 0;
    const startY = safe.minY + 60 + (usable - gap * Math.max(0, group.length - 1)) / 2;
    group.forEach((node, i) => {
      node.x = columnX[type];
      node.y = Math.round((startY + i * gap) / 20) * 20;
    });
  });

  return nodes;
}

function buildNodes(rawNodes: RawNode[], warnings: string[]): { nodes: NetworkNode[]; idMap: Map<string, string> } {
  const stamp = Date.now();
  const idMap = new Map<string, string>();
  const nodes: NetworkNode[] = rawNodes.map((raw, i) => {
    const sourceId = String(raw.id ?? raw.name ?? `imported-${i}`);
    const id = `node-import-${stamp}-${i}`;
    idMap.set(sourceId, id);
    const name = String(raw.name ?? raw.label ?? sourceId);
    const { type, functionType, networkType } = normalizeType(raw.type, name);
    const provider = raw.provider ?? raw.cloudProvider;

    if (!raw.type) warnings.push(`Node "${name}": no type given, inferred "${type}${functionType ? ` / ${functionType}` : ''}".`);

    return {
      id,
      type,
      ...(functionType ? { functionType: functionType as NetworkNode['functionType'] } : {}),
      ...(type === 'destination' && provider ? { cloudProvider: String(provider) } : {}),
      x: typeof raw.x === 'number' ? raw.x : 0,
      y: typeof raw.y === 'number' ? raw.y : 0,
      name: name || getNodeDisplayName(type, functionType, networkType, provider),
      icon: getNodeIcon(type, functionType, networkType, { ...(provider ? { provider: String(provider) } : {}), ...(raw.routerType ? { routerType: raw.routerType } : {}) }),
      status: raw.status === 'active' ? 'active' : 'inactive',
      config: {
        ...(provider ? { provider: String(provider) } : {}),
        ...(networkType ? { networkType: networkType as any } : {}),
        ...(raw.region ? { region: String(raw.region) } : {}),
        ...(raw.city ? { city: String(raw.city) } : {}),
        ...(raw.location ? { location: String(raw.location) } : {}),
        ...(typeof raw.latitude === 'number' ? { latitude: raw.latitude } : {}),
        ...(typeof raw.longitude === 'number' ? { longitude: raw.longitude } : {}),
        ...(raw.routerType ? { routerType: raw.routerType } : {}),
        imported: true,
        configured: true
      }
    };
  });

  const needsLayout = nodes.every(n => n.x === 0 && n.y === 0);
  return { nodes: needsLayout ? layoutNodes(nodes) : nodes, idMap };
}

function buildEdges(rawEdges: RawEdge[], idMap: Map<string, string>, warnings: string[]): NetworkEdge[] {
  const stamp = Date.now();
  const edges: NetworkEdge[] = [];
  rawEdges.forEach((raw, i) => {
    const sourceKey = String(raw.source ?? raw.from ?? '');
    const targetKey = String(raw.target ?? raw.to ?? '');
    const source = idMap.get(sourceKey);
    const target = idMap.get(targetKey);
    if (!source || !target) {
      warnings.push(`Connection ${i + 1}: endpoint "${!source ? sourceKey : targetKey}" not found - skipped.`);
      return;
    }
    if (source === target) {
      warnings.push(`Connection ${i + 1}: "${sourceKey}" connects to itself - skipped.`);
      return;
    }
    if (edges.some(e => (e.source === source && e.target === target) || (e.source === target && e.target === source))) {
      warnings.push(`Connection ${i + 1}: duplicate of an earlier ${sourceKey} - ${targetKey} link - skipped.`);
      return;
    }
    edges.push(seedEdgeMetrics({
      id: `edge-import-${stamp}-${i}`,
      source,
      target,
      type: String(raw.type ?? raw.connectionType ?? 'Ethernet'),
      bandwidth: cleanBandwidth(raw.bandwidth),
      status: raw.status === 'active' ? 'active' : 'inactive',
      config: {
        ...(raw.resilience ? { resilience: raw.resilience } : {}),
        ...(typeof raw.encrypted === 'boolean' || raw.encrypted === 'true' || raw.encrypted === 'false'
          ? { encrypted: raw.encrypted === true || raw.encrypted === 'true' }
          : {}),
        ...(raw.qosProfile ? { qosProfile: raw.qosProfile } : {})
      }
    }));
  });
  return edges;
}

export function parseTopologyJSON(text: string, sourceName?: string): ParseResult {
  const warnings: string[] = [];
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e: any) {
    return { ok: false, nodes: [], edges: [], warnings, error: `Invalid JSON: ${e.message}` };
  }

  const rawNodes: RawNode[] = data.nodes ?? data.devices ?? [];
  const rawEdges: RawEdge[] = data.edges ?? data.links ?? data.connections ?? [];

  if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
    return { ok: false, nodes: [], edges: [], warnings, error: 'No nodes found. Expected a "nodes" array (aliases: "devices").' };
  }
  if (!Array.isArray(rawEdges)) {
    return { ok: false, nodes: [], edges: [], warnings, error: '"edges" must be an array (aliases: "links", "connections").' };
  }

  const { nodes, idMap } = buildNodes(rawNodes, warnings);
  const edges = buildEdges(rawEdges, idMap, warnings);
  return { ok: true, nodes, edges, warnings, sourceName };
}

// CSV edge list: source,target,type,bandwidth[,encrypted][,resilience]
// Node identities and types are inferred from names.
export function parseTopologyCSV(text: string, sourceName?: string): ParseResult {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { ok: false, nodes: [], edges: [], warnings, error: 'CSV needs a header row plus at least one connection row.' };
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim());
  const col = (name: string) => header.indexOf(name);
  const si = col('source') >= 0 ? col('source') : 0;
  const ti = col('target') >= 0 ? col('target') : 1;
  if (header.length < 2) {
    return { ok: false, nodes: [], edges: [], warnings, error: 'CSV header must include at least "source,target".' };
  }

  const nodeNames = new Map<string, RawNode>();
  const rawEdges: RawEdge[] = [];

  lines.slice(1).forEach(line => {
    const cells = line.split(',').map(c => c.trim());
    const source = cells[si];
    const target = cells[ti];
    if (!source || !target) return;
    [source, target].forEach(n => {
      if (!nodeNames.has(n)) nodeNames.set(n, { id: n, name: n });
    });
    rawEdges.push({
      source,
      target,
      type: col('type') >= 0 ? cells[col('type')] : undefined,
      bandwidth: col('bandwidth') >= 0 ? cells[col('bandwidth')] : undefined,
      encrypted: col('encrypted') >= 0 ? cells[col('encrypted')]?.toLowerCase() === 'true' : undefined,
      resilience: col('resilience') >= 0 ? cells[col('resilience')] : undefined,
      status: 'active'
    });
  });

  const { nodes, idMap } = buildNodes([...nodeNames.values()], warnings);
  const edges = buildEdges(rawEdges, idMap, warnings);
  return { ok: true, nodes, edges, warnings, sourceName };
}

export function parseTopologyFile(fileName: string, text: string): ParseResult {
  if (fileName.toLowerCase().endsWith('.csv')) return parseTopologyCSV(text, fileName);
  return parseTopologyJSON(text, fileName);
}
