// Cloud-to-cloud path engine - the Cloud Connect control-plane view.
// For every pair of cloud destinations, enumerate simple paths through the
// topology and pick the best one under the active routing policy (PRD U4:
// policy-based path selection). Paths transiting the AT&T Core are marked
// AT&T-controlled - the PRD O1 success metric made visible.

import { NetworkNode, NetworkEdge } from '../../types';
import { estimateEdgeCost } from './advisorEngine';

export type PathPolicy = 'balanced' | 'latency' | 'cost' | 'security';

export const POLICY_LABEL: Record<PathPolicy, string> = {
  balanced: 'Balanced',
  latency: 'Lowest latency',
  cost: 'Lowest cost',
  security: 'Most secure'
};

export interface CloudPath {
  id: string;
  from: NetworkNode;
  to: NetworkNode;
  hopNames: string[];
  nodeIds: string[];
  edgeIds: string[];
  latencyMs: number;
  monthlyCost: number;
  fullyEncrypted: boolean;
  attControlled: boolean;
  reason: string;
}

const edgeLatency = (e: NetworkEdge): number => {
  const raw = parseFloat(String(e.metrics?.latency ?? ''));
  return Number.isFinite(raw) ? raw : 8;
};

export function computeCloudPaths(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  policy: PathPolicy
): CloudPath[] {
  const destinations = nodes.filter(n => n.type === 'destination');
  if (destinations.length < 2) return [];

  const byId = new Map(nodes.map(n => [n.id, n]));
  const adj = new Map<string, { edge: NetworkEdge; next: string }[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push({ edge: e, next: e.target });
      adj.get(e.target)!.push({ edge: e, next: e.source });
    }
  });

  // All simple paths up to 5 hops between two nodes
  const pathsBetween = (fromId: string, toId: string) => {
    const found: { nodeIds: string[]; pathEdges: NetworkEdge[] }[] = [];
    const walk = (current: string, visited: string[], pathEdges: NetworkEdge[]) => {
      if (pathEdges.length > 5 || found.length > 24) return;
      if (current === toId) {
        found.push({ nodeIds: [...visited], pathEdges: [...pathEdges] });
        return;
      }
      (adj.get(current) ?? []).forEach(({ edge, next }) => {
        if (visited.includes(next)) return;
        walk(next, [...visited, next], [...pathEdges, edge]);
      });
    };
    walk(fromId, [fromId], []);
    return found;
  };

  const score = (latency: number, cost: number, encrypted: boolean): number => {
    switch (policy) {
      case 'latency': return latency;
      case 'cost': return cost;
      case 'security': return (encrypted ? 0 : 100000) + latency;
      case 'balanced': return latency * 40 + cost / 25 + (encrypted ? 0 : 400);
    }
  };

  const reasonFor: Record<PathPolicy, string> = {
    latency: 'Selected for lowest end-to-end latency',
    cost: 'Selected for lowest monthly transport cost',
    security: 'Selected for end-to-end encryption',
    balanced: 'Selected for the best latency / cost / security balance'
  };

  const results: CloudPath[] = [];
  for (let i = 0; i < destinations.length; i++) {
    for (let j = i + 1; j < destinations.length; j++) {
      const from = destinations[i];
      const to = destinations[j];
      const candidates = pathsBetween(from.id, to.id);
      if (candidates.length === 0) continue;

      let best: CloudPath | null = null;
      let bestScore = Infinity;
      candidates.forEach(({ nodeIds, pathEdges }) => {
        const latencyMs = Math.round(pathEdges.reduce((s, e) => s + edgeLatency(e), 0) * 10) / 10;
        const monthlyCost = pathEdges.reduce((s, e) => s + estimateEdgeCost(e), 0);
        const fullyEncrypted = pathEdges.every(e => e.config?.encrypted === true);
        const sc = score(latencyMs, monthlyCost, fullyEncrypted);
        if (sc < bestScore) {
          bestScore = sc;
          best = {
            id: `path-${from.id}-${to.id}`,
            from, to,
            hopNames: nodeIds.map(id => byId.get(id)?.name ?? '?'),
            nodeIds,
            edgeIds: pathEdges.map(e => e.id),
            latencyMs,
            monthlyCost,
            fullyEncrypted,
            attControlled: nodeIds.some(id => {
              const n = byId.get(id);
              return n?.config?.networkType === 'at&t core' || n?.name === 'AT&T Core';
            }),
            reason: reasonFor[policy]
          };
        }
      });
      if (best) results.push(best);
    }
  }
  return results;
}
