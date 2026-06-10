// What-if failure simulation: remove a node, compute real reachability,
// report the blast radius in operational terms.

import { NetworkNode, NetworkEdge } from '../../../types';

export interface FailureResult {
  failedNodeId: string;
  unreachableNodeIds: string[];
  deadEdgeIds: string[];
  downSites: string[];
  isolatedCount: number;
  isArticulation: boolean;
  verdict: string;
}

export function simulateFailure(
  nodeId: string,
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): FailureResult {
  const failed = nodes.find(n => n.id === nodeId);
  const survivors = nodes.filter(n => n.id !== nodeId);
  const liveEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  const deadEdgeIds = edges.filter(e => e.source === nodeId || e.target === nodeId).map(e => e.id);

  // Connected components over the surviving graph
  const adj = new Map<string, string[]>();
  survivors.forEach(n => adj.set(n.id, []));
  liveEdges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  });

  const componentOf = new Map<string, number>();
  let componentCount = 0;
  survivors.forEach(start => {
    if (componentOf.has(start.id)) return;
    const queue = [start.id];
    componentOf.set(start.id, componentCount);
    while (queue.length) {
      const current = queue.shift()!;
      (adj.get(current) || []).forEach(next => {
        if (!componentOf.has(next)) {
          componentOf.set(next, componentCount);
          queue.push(next);
        }
      });
    }
    componentCount++;
  });

  // The "live" side of the network is the component holding the core
  // (AT&T Core, else any router, else the largest component).
  const anchor =
    survivors.find(n => n.type === 'network' && n.config?.networkType === 'at&t core') ??
    survivors.find(n => n.type === 'function' && (n.functionType === 'Router' || n.functionType === 'Cloud Router'));
  let liveComponent: number;
  if (anchor) {
    liveComponent = componentOf.get(anchor.id)!;
  } else {
    const sizes = new Map<number, number>();
    componentOf.forEach(c => sizes.set(c, (sizes.get(c) ?? 0) + 1));
    liveComponent = [...sizes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  }

  const unreachable = survivors.filter(n => componentOf.get(n.id) !== liveComponent);
  const unreachableNodeIds = unreachable.map(n => n.id);
  const downSites = [...new Set(unreachable.map(n => n.config?.city).filter(Boolean))] as string[];
  const isArticulation = unreachable.length > 0;

  const name = failed?.name ?? 'this node';
  const cloudCasualties = unreachable.filter(n => n.type === 'destination');
  let verdict: string;
  if (!isArticulation) {
    verdict = `${name} can fail safely. Every remaining node still has a path to the core. This is what designed-in redundancy looks like.`;
  } else if (cloudCasualties.length > 0) {
    verdict = `Losing ${name} strands ${cloudCasualties.length} of ${nodes.filter(n => n.type === 'destination').length} cloud on-ramps and isolates ${unreachable.length} node${unreachable.length > 1 ? 's' : ''}${downSites.length ? ` across ${downSites.join(', ')}` : ''}. This is a single point of failure on your critical path.`;
  } else {
    verdict = `Losing ${name} isolates ${unreachable.length} node${unreachable.length > 1 ? 's' : ''}${downSites.length ? ` in ${downSites.join(', ')}` : ''}. Workloads survive, but you lose visibility and any services those nodes provide.`;
  }

  return {
    failedNodeId: nodeId,
    unreachableNodeIds,
    deadEdgeIds,
    downSites,
    isolatedCount: unreachable.length,
    isArticulation,
    verdict
  };
}
