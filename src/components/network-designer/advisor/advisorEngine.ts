// Network Advisor engine
// Consultative analysis of a topology. Produces findings whose severities
// map onto the Figma node/edge state legend:
//   error -> red, warning -> orange, recommendation -> blue, positive -> green

import { NetworkNode, NetworkEdge } from '../../../types';
import { validateTopology } from '../../../engine/validationEngine';
import { calculateNetworkScores } from '../../../utils/calculations';

export type FindingSeverity = 'error' | 'warning' | 'recommendation' | 'positive';

export interface Finding {
  id: string;
  severity: FindingSeverity;
  category: 'Resiliency' | 'Security' | 'Performance' | 'Architecture' | 'Geography';
  title: string;
  detail: string;
  recommendation?: string;
  nodeIds: string[];
  edgeIds: string[];
}

export interface Assessment {
  findings: Finding[];
  scores: { resiliency: number; redundancy: number; disaster: number; security: number; performance: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  generatedAt: number;
}

function parseGbps(bandwidth: string): number {
  const m = bandwidth.match(/(\d+(?:\.\d+)?)\s*(g|m)/i);
  if (!m) return 1;
  const v = parseFloat(m[1]);
  return m[2].toLowerCase() === 'm' ? v / 1000 : v;
}

function neighborEdges(nodeId: string, edges: NetworkEdge[]): NetworkEdge[] {
  return edges.filter(e => e.source === nodeId || e.target === nodeId);
}

// Articulation points via DFS - single points of failure
function findArticulationPoints(nodes: NetworkNode[], edges: NetworkEdge[]): Set<string> {
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  });

  const visited = new Set<string>();
  const disc = new Map<string, number>();
  const low = new Map<string, number>();
  const points = new Set<string>();
  let timer = 0;

  function dfs(u: string, parent: string | null) {
    visited.add(u);
    disc.set(u, timer); low.set(u, timer); timer++;
    let children = 0;
    for (const v of adj.get(u) || []) {
      if (v === parent) continue;
      if (visited.has(v)) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      } else {
        children++;
        dfs(v, u);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        if (parent !== null && low.get(v)! >= disc.get(u)!) points.add(u);
      }
    }
    if (parent === null && children > 1) points.add(u);
  }

  nodes.forEach(n => { if (!visited.has(n.id)) dfs(n.id, null); });
  return points;
}

export function runAdvisor(nodes: NetworkNode[], edges: NetworkEdge[]): Assessment {
  const findings: Finding[] = [];
  let seq = 0;
  const add = (f: Omit<Finding, 'id'>) => findings.push({ ...f, id: `finding-${++seq}` });

  const destinations = nodes.filter(n => n.type === 'destination');
  const firewalls = nodes.filter(n => n.type === 'function' && n.functionType === 'Firewall');
  const internetNodes = nodes.filter(n => n.type === 'network' && n.config?.networkType === 'internet');
  const routers = nodes.filter(n => n.type === 'function' && (n.functionType === 'Router' || n.functionType === 'Cloud Router'));

  // --- Resiliency: single points of failure ---
  const spofs = findArticulationPoints(nodes, edges);
  spofs.forEach(id => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    add({
      severity: 'error',
      category: 'Resiliency',
      title: `Single point of failure: ${node.name}`,
      detail: `If ${node.name} fails, the topology splits and traffic between the segments it joins is lost. No alternate path exists around this node.`,
      recommendation: `Deploy a redundant ${node.functionType || node.type} and dual-home the adjacent connections so no single device isolates part of the network.`,
      nodeIds: [id],
      edgeIds: neighborEdges(id, edges).map(e => e.id)
    });
  });

  // --- Resiliency: single-homed cloud destinations ---
  destinations.forEach(dest => {
    const links = neighborEdges(dest.id, edges);
    if (links.length === 1 && (!links[0].config?.resilience || links[0].config.resilience === 'single')) {
      add({
        severity: 'warning',
        category: 'Resiliency',
        title: `${dest.name} is single-homed`,
        detail: `${dest.name} has one non-redundant connection. A circuit fault or maintenance window takes this workload offline.`,
        recommendation: 'Upgrade the link to a redundant or dual-diverse resilience profile, or add a second connection through a different path.',
        nodeIds: [dest.id],
        edgeIds: links.map(e => e.id)
      });
    }
  });

  // --- Security: unencrypted internet paths ---
  edges.forEach(edge => {
    const isInternet = edge.type.toLowerCase().includes('internet');
    if (isInternet && edge.config?.encrypted !== true) {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      add({
        severity: 'error',
        category: 'Security',
        title: `Unencrypted internet link: ${src?.name} to ${tgt?.name}`,
        detail: 'Traffic on this internet transport is not encrypted. Anything crossing it is exposed in transit.',
        recommendation: 'Enable IPsec encryption on this link or move the workload to a private transport (AVPN, ASE, dedicated interconnect).',
        nodeIds: [edge.source, edge.target],
        edgeIds: [edge.id]
      });
    }
  });

  // --- Security: internet exposure without a firewall ---
  if (internetNodes.length > 0 && firewalls.length === 0 && destinations.length > 0) {
    add({
      severity: 'error',
      category: 'Security',
      title: 'Internet-facing topology has no firewall',
      detail: 'Internet transport reaches cloud workloads with no inspection point anywhere in the path.',
      recommendation: 'Insert a firewall function (NGFW or cloud-native equivalent) between the internet edge and your cloud routers.',
      nodeIds: internetNodes.map(n => n.id),
      edgeIds: []
    });
  }

  // --- Security: partial encryption coverage ---
  if (edges.length > 0) {
    const encrypted = edges.filter(e => e.config?.encrypted === true).length;
    const ratio = encrypted / edges.length;
    if (ratio > 0 && ratio < 0.5) {
      add({
        severity: 'warning',
        category: 'Security',
        title: `Only ${Math.round(ratio * 100)}% of links are encrypted`,
        detail: 'Encryption is applied inconsistently. Mixed posture usually means a compliance audit finding later.',
        recommendation: 'Standardize: encrypt every link that leaves a trusted facility boundary.',
        nodeIds: [],
        edgeIds: edges.filter(e => e.config?.encrypted !== true).map(e => e.id)
      });
    }
  }

  // --- Performance: bandwidth bottlenecks ---
  routers.forEach(router => {
    const links = neighborEdges(router.id, edges);
    if (links.length < 2) return;
    const capacities = links.map(parseLink => parseGbps(parseLink.bandwidth));
    const max = Math.max(...capacities);
    const min = Math.min(...capacities);
    if (max / min >= 8) {
      const slow = links[capacities.indexOf(min)];
      add({
        severity: 'warning',
        category: 'Performance',
        title: `Bandwidth bottleneck at ${router.name}`,
        detail: `${router.name} carries a ${max} Gbps-class path into a ${min < 1 ? `${min * 1000} Mbps` : `${min} Gbps`} link. Under load the slow link saturates first.`,
        recommendation: 'Increase the constrained link to within 4x of the fastest adjacent path, or steer bulk traffic away from it with QoS.',
        nodeIds: [router.id],
        edgeIds: [slow.id]
      });
    }
  });

  // --- Geography: no regional diversity ---
  const cities = new Set(
    nodes.map(n => n.config?.city || n.config?.region || n.config?.location).filter(Boolean)
  );
  if (nodes.length >= 4 && cities.size <= 1) {
    add({
      severity: 'recommendation',
      category: 'Geography',
      title: 'No geographic diversity',
      detail: cities.size === 1
        ? `Every located node sits in ${[...cities][0]}. A regional event takes down the entire design.`
        : 'No location metadata found, so disaster-recovery posture cannot be assessed.',
      recommendation: 'Place a secondary path or standby capacity in a second region, and record location metadata on each node.',
      nodeIds: nodes.map(n => n.id),
      edgeIds: []
    });
  }

  // --- Architecture: multi-cloud without a cloud router hub ---
  const cloudProviders = new Set(destinations.map(d => d.cloudProvider || d.config?.provider).filter(Boolean));
  if (cloudProviders.size >= 2 && routers.length === 0) {
    add({
      severity: 'recommendation',
      category: 'Architecture',
      title: 'Multi-cloud without a routing hub',
      detail: `Workloads span ${cloudProviders.size} cloud providers but there is no cloud router to hub them. Inter-cloud traffic likely hairpins or rides the public internet.`,
      recommendation: 'Add a Cloud Router so inter-cloud traffic stays on the private backbone with one policy point.',
      nodeIds: destinations.map(d => d.id),
      edgeIds: []
    });
  }

  // --- Fold in the live validation engine (orphans, missing IPE, etc.) ---
  validateTopology(nodes, edges).forEach(issue => {
    if (findings.some(f => f.nodeIds.includes(issue.nodeId || '') && f.severity === 'error')) return;
    add({
      severity: issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'recommendation',
      category: 'Architecture',
      title: issue.message,
      detail: issue.message,
      nodeIds: issue.nodeId ? [issue.nodeId] : [],
      edgeIds: issue.edgeId ? [issue.edgeId] : []
    });
  });

  // --- Positives: call out what is done well ---
  const dualDiverse = edges.filter(e => e.config?.resilience === 'dualdiverse' || e.config?.resilience === 'ha');
  if (dualDiverse.length > 0) {
    add({
      severity: 'positive',
      category: 'Resiliency',
      title: `${dualDiverse.length} high-availability link${dualDiverse.length > 1 ? 's' : ''} configured`,
      detail: 'These links carry an HA or dual-diverse resilience profile - failover paths are designed in, not bolted on.',
      nodeIds: [],
      edgeIds: dualDiverse.map(e => e.id)
    });
  }
  if (edges.length > 0 && edges.every(e => e.config?.encrypted === true)) {
    add({
      severity: 'positive',
      category: 'Security',
      title: 'Full encryption coverage',
      detail: 'Every connection in the topology is encrypted in transit.',
      nodeIds: [],
      edgeIds: []
    });
  }
  if (firewalls.length > 0) {
    add({
      severity: 'positive',
      category: 'Security',
      title: 'Inspection point present',
      detail: `${firewalls.map(f => f.name).join(', ')} provides a security inspection point in the path.`,
      nodeIds: firewalls.map(f => f.id),
      edgeIds: []
    });
  }

  // --- Score + grade ---
  const scores = calculateNetworkScores(nodes, edges);
  const errors = findings.filter(f => f.severity === 'error').length;
  const warningsCount = findings.filter(f => f.severity === 'warning').length;
  const grade: Assessment['grade'] =
    errors >= 3 ? 'F' : errors === 2 ? 'D' : errors === 1 ? 'C' : warningsCount >= 2 ? 'B' : 'A';

  const summary =
    errors > 0
      ? `${errors} critical issue${errors > 1 ? 's' : ''} need${errors === 1 ? 's' : ''} attention before this design is production-ready.`
      : warningsCount > 0
        ? `Structurally sound. ${warningsCount} improvement${warningsCount > 1 ? 's' : ''} would harden the design.`
        : 'Well-architected. No critical issues found.';

  return { findings, scores, grade, summary, generatedAt: Date.now() };
}
