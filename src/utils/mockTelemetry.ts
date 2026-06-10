// Deterministic mock telemetry for the proof of concept.
// Seeds realistic per-link metrics from a hash of the edge id so values
// are stable across renders and refreshes (no Math.random drift).

import { NetworkEdge } from '../types';

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Map a hash into [min, max] with one decimal of precision
function spread(seed: number, min: number, max: number): number {
  return Math.round((min + (seed % 1000) / 1000 * (max - min)) * 10) / 10;
}

// Sanitize values that older simulation runs may have corrupted
function sanitize(edge: NetworkEdge): NetworkEdge {
  const m = edge.metrics!;
  const lossNum = Math.abs(parseFloat(String(m.packetLoss ?? '0').replace('%', '')) || 0);
  const util = Math.max(0, Math.min(100, m.bandwidthUtilization ?? 50));
  const latNum = Math.abs(parseFloat(String(m.latency ?? '5').replace('ms', '')) || 5);
  return {
    ...edge,
    metrics: {
      ...m,
      latency: `${Math.round(latNum * 10) / 10}ms`,
      packetLoss: `${Math.round(lossNum * 100) / 100}%`,
      bandwidthUtilization: Math.round(util)
    }
  };
}

export function seedEdgeMetrics(edge: NetworkEdge): NetworkEdge {
  if (edge.metrics?.latency) return sanitize(edge);

  const seed = hash(edge.id + edge.type);
  const isInternet = edge.type.toLowerCase().includes('internet');
  const latency = spread(seed, isInternet ? 8 : 1, isInternet ? 35 : 12);
  const packetLoss = spread(seed >> 3, 0, isInternet ? 0.8 : 0.15);
  const utilization = Math.round(spread(seed >> 5, 18, 86));

  const bwMatch = edge.bandwidth.match(/(\d+(?:\.\d+)?)/);
  const capacity = bwMatch ? parseFloat(bwMatch[1]) : 1;
  const throughput = Math.round(capacity * utilization) / 100;

  return {
    ...edge,
    metrics: {
      latency: `${latency}ms`,
      packetLoss: `${packetLoss}%`,
      throughput: `${throughput} ${edge.bandwidth.toLowerCase().includes('m') ? 'Mbps' : 'Gbps'}`,
      bandwidthUtilization: utilization
    }
  };
}

export function seedAllEdgeMetrics(edges: NetworkEdge[]): NetworkEdge[] {
  return edges.map(seedEdgeMetrics);
}
