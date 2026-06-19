// Network Advisor engine
// Consultative analysis of a topology. Produces findings whose severities
// map onto the Figma node/edge state legend:
//   error -> red, warning -> orange, recommendation -> blue, positive -> green

import { NetworkNode, NetworkEdge } from '../../../types';
import { validateTopology } from '../../../engine/validationEngine';
import { calculateNetworkScores } from '../../../utils/calculations';

export type FindingSeverity = 'error' | 'warning' | 'recommendation' | 'positive';

// One-click remediation descriptors - serializable so assessments persist
export type FixAction =
  | { type: 'encrypt-edges'; edgeIds: string[] }
  | { type: 'set-resilience'; edgeIds: string[]; value: 'redundant' | 'ha' | 'dualdiverse' }
  | { type: 'add-redundant-node'; nodeId: string }
  | { type: 'add-firewall' }
  | { type: 'renumber-subnet'; nodeId: string; from: string; to: string };

export interface Finding {
  id: string;
  severity: FindingSeverity;
  category: 'Resiliency' | 'Security' | 'Performance' | 'Architecture' | 'Geography' | 'Cost';
  title: string;
  detail: string;
  recommendation?: string;
  nodeIds: string[];
  edgeIds: string[];
  fix?: { label: string; action: FixAction };
}

export interface Assessment {
  findings: Finding[];
  scores: { resiliency: number; redundancy: number; disaster: number; security: number; performance: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  monthlyCost: number;
  generatedAt: number;
}

// Mock transport pricing for the POC cost model ($/Gbps/month)
const TRANSPORT_PRICE_PER_GBPS: Record<string, number> = {
  'MPLS': 180,
  'Internet': 30,
  'Ethernet': 90,
  'Direct Connect': 110,
  'ExpressRoute': 110,
  'Cloud Interconnect': 110,
  'FastConnect': 110,
  'Wavelength': 250,
  'Dark Fiber': 250,
  'VPN': 40
};

export function estimateEdgeCost(edge: NetworkEdge): number {
  const gbps = parseGbps(edge.bandwidth);
  const rate = TRANSPORT_PRICE_PER_GBPS[edge.type] ?? 80;
  const resilienceMultiplier =
    edge.config?.resilience === 'dualdiverse' ? 1.9 :
    edge.config?.resilience === 'ha' ? 1.6 :
    edge.config?.resilience === 'redundant' ? 1.4 : 1;
  return Math.round(gbps * rate * resilienceMultiplier);
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
  const routers = nodes.filter(n => n.type === 'function' && (n.functionType === 'Router' || n.functionType === 'Gateway'));

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
      edgeIds: neighborEdges(id, edges).map(e => e.id),
      fix: { label: `Add redundant ${node.functionType || 'node'}`, action: { type: 'add-redundant-node', nodeId: id } }
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
        edgeIds: links.map(e => e.id),
        fix: { label: 'Upgrade to dual-diverse', action: { type: 'set-resilience', edgeIds: links.map(e => e.id), value: 'dualdiverse' } }
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
        edgeIds: [edge.id],
        fix: { label: 'Enable encryption', action: { type: 'encrypt-edges', edgeIds: [edge.id] } }
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
      recommendation: 'Insert a firewall function (NGFW or cloud-native equivalent) between the internet edge and your gateways.',
      nodeIds: internetNodes.map(n => n.id),
      edgeIds: [],
      fix: { label: 'Add firewall', action: { type: 'add-firewall' } }
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
        edgeIds: edges.filter(e => e.config?.encrypted !== true).map(e => e.id),
        fix: { label: 'Encrypt all links', action: { type: 'encrypt-edges', edgeIds: edges.filter(e => e.config?.encrypted !== true).map(e => e.id) } }
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

  // --- Architecture: multi-cloud without a gateway hub ---
  const cloudProviders = new Set(destinations.map(d => d.cloudProvider || d.config?.provider).filter(Boolean));
  if (cloudProviders.size >= 2 && routers.length === 0) {
    add({
      severity: 'recommendation',
      category: 'Architecture',
      title: 'Multi-cloud without a routing hub',
      detail: `Workloads span ${cloudProviders.size} cloud providers but there is no gateway to hub them. Inter-cloud traffic likely hairpins or rides the public internet.`,
      recommendation: 'Add a Gateway so inter-cloud traffic stays on the private backbone with one policy point.',
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

  // --- Resiliency: asymmetric protection on multi-homed destinations ---
  destinations.forEach(dest => {
    const links = neighborEdges(dest.id, edges);
    if (links.length < 2) return;
    const protectedLinks = links.filter(e => e.config?.resilience && e.config.resilience !== 'single');
    const exposed = links.filter(e => !e.config?.resilience || e.config.resilience === 'single');
    if (protectedLinks.length > 0 && exposed.length > 0) {
      add({
        severity: 'warning',
        category: 'Resiliency',
        title: `${dest.name} has asymmetric protection`,
        detail: `${dest.name} is multi-homed, but only ${protectedLinks.length} of ${links.length} paths carry a resilience profile. The unprotected path is the one that fails during the maintenance window.`,
        recommendation: 'Protect every path to a multi-homed workload, or consciously document the unprotected one as best-effort.',
        nodeIds: [dest.id],
        edgeIds: exposed.map(e => e.id),
        fix: { label: 'Protect remaining paths', action: { type: 'set-resilience', edgeIds: exposed.map(e => e.id), value: 'redundant' } }
      });
    }
  });

  // --- Performance: bandwidth oversubscription at the hub ---
  routers.forEach(router => {
    const links = neighborEdges(router.id, edges);
    if (links.length < 3) return;
    const capacities = links.map(e => parseGbps(e.bandwidth));
    const uplink = Math.max(...capacities);
    const downstream = capacities.reduce((a, b) => a + b, 0) - uplink;
    if (downstream > uplink * 2) {
      add({
        severity: 'warning',
        category: 'Performance',
        title: `${router.name} is oversubscribed ${(downstream / uplink).toFixed(1)}:1`,
        detail: `${router.name} aggregates ${downstream} Gbps of downstream capacity into a ${uplink} Gbps uplink. Above 2:1, concurrent peaks congest the uplink.`,
        recommendation: 'Upgrade the uplink, add a second hub, or steer bulk traffic off-peak with QoS.',
        nodeIds: [router.id],
        edgeIds: [links[capacities.indexOf(uplink)].id]
      });
    }
  });

  // --- Provisioning: provider circuits without an activated last mile ---
  const providerEdgeTypes = ['direct connect', 'expressroute', 'cloud interconnect', 'fastconnect'];
  const unactivated = edges.filter(e => {
    if (e.config?.lastMile) return false;
    const isProviderEdge = providerEdgeTypes.some(t => e.type.toLowerCase().includes(t));
    const touchesCloud = destinations.some(d => d.id === e.source || d.id === e.target);
    return isProviderEdge && touchesCloud;
  });
  if (unactivated.length > 0) {
    add({
      severity: 'recommendation',
      category: 'Architecture',
      title: `${unactivated.length} provider circuit${unactivated.length > 1 ? 's' : ''} without last-mile activation`,
      detail: 'These dedicated interconnects are drawn but their last mile is not configured. The circuit exists on paper; traffic cannot ride it until activation.',
      recommendation: 'Open each connection and run Set up last mile to choose the connection type and activate it.',
      nodeIds: [],
      edgeIds: unactivated.map(e => e.id)
    });
  }

  // --- Routing hygiene: BGP ASN + VLAN collisions ---
  routers.forEach(router => {
    if (!router.config?.asn) {
      add({
        severity: 'recommendation',
        category: 'Architecture',
        title: `${router.name} has no BGP ASN`,
        detail: `${router.name} routes between domains but carries no autonomous system number. Peering cannot be provisioned without one.`,
        recommendation: 'Assign a private ASN (64512-65534) in the router configuration panel.',
        nodeIds: [router.id],
        edgeIds: []
      });
    }
  });
  const vlanSeen = new Map<number, string[]>();
  edges.forEach(e => {
    const vlan = e.config?.vlanId ?? e.vlan;
    if (typeof vlan === 'number') {
      vlanSeen.set(vlan, [...(vlanSeen.get(vlan) ?? []), e.id]);
    }
  });
  vlanSeen.forEach((ids, vlan) => {
    if (vlan < 1 || vlan > 4094) {
      add({
        severity: 'warning',
        category: 'Architecture',
        title: `VLAN ${vlan} is outside the valid range`,
        detail: 'Valid 802.1Q VLAN IDs run 1-4094. This value cannot be provisioned.',
        recommendation: 'Assign a VLAN ID between 1 and 4094.',
        nodeIds: [],
        edgeIds: ids
      });
      return;
    }
    if (ids.length > 1) {
      add({
        severity: 'warning',
        category: 'Architecture',
        title: `VLAN ${vlan} assigned to ${ids.length} links`,
        detail: 'Duplicate VLAN IDs across links in the same domain cause provisioning conflicts.',
        recommendation: 'Give each link a unique VLAN ID (1-4094).',
        nodeIds: [],
        edgeIds: ids
      });
    }
  });

  // --- IP space: overlapping CIDRs across nodes ---
  // The most common real-world cloud discovery failure. Pairwise-compare
  // every subnet every node carries; overlaps get a one-click renumber.
  {
    const carriers = nodes
      .filter(n => Array.isArray(n.config?.subnets) && n.config!.subnets.length > 0)
      .map(n => ({ node: n, ranges: (n.config!.subnets as string[]).map(c => ({ cidr: c, range: cidrRange(c) })) }));
    const allCidrs = new Set(carriers.flatMap(c => c.ranges.map(r => r.cidr)));
    const reported = new Set<string>();
    for (let i = 0; i < carriers.length; i++) {
      for (let j = i + 1; j < carriers.length; j++) {
        carriers[i].ranges.forEach(a => {
          carriers[j].ranges.forEach(b => {
            if (!a.range || !b.range) return;
            if (a.range[0] <= b.range[1] && b.range[0] <= a.range[1]) {
              const key = [carriers[i].node.id, carriers[j].node.id, a.cidr, b.cidr].join('|');
              if (reported.has(key)) return;
              reported.add(key);
              const replacement = nextFreeCidr(allCidrs);
              allCidrs.add(replacement);
              add({
                severity: 'error',
                category: 'Architecture',
                title: `Overlapping IP space: ${carriers[i].node.name} and ${carriers[j].node.name}`,
                detail: `${carriers[i].node.name} uses ${a.cidr} and ${carriers[j].node.name} uses ${b.cidr} - the ranges collide. Routing between these environments is ambiguous and peering them will fail.`,
                recommendation: `Renumber one side. ${replacement} is free in this design.`,
                nodeIds: [carriers[i].node.id, carriers[j].node.id],
                edgeIds: [],
                fix: {
                  label: `Renumber to ${replacement}`,
                  action: { type: 'renumber-subnet', nodeId: carriers[j].node.id, from: b.cidr, to: replacement }
                }
              });
            }
          });
        });
      }
    }
  }

  // --- Cost advisory ---
  const monthlyCost = edges.reduce((sum, e) => sum + estimateEdgeCost(e), 0);
  edges.forEach(edge => {
    const gbps = parseGbps(edge.bandwidth);
    if (gbps >= 40) {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      add({
        severity: 'recommendation',
        category: 'Cost',
        title: `Premium capacity: ${src?.name} to ${tgt?.name} (${edge.bandwidth})`,
        detail: `This ${edge.type} link runs ~$${estimateEdgeCost(edge).toLocaleString()}/mo at ${edge.bandwidth}. Capacity above 40 Gbps is premium transport.`,
        recommendation: 'Verify forecast utilization justifies the tier, or step down and scale with demand.',
        nodeIds: [],
        edgeIds: [edge.id]
      });
    }
  });
  const internetCapacity = edges.filter(e => e.type.toLowerCase().includes('internet')).reduce((s2, e) => s2 + parseGbps(e.bandwidth), 0);
  const totalCapacity = edges.reduce((s2, e) => s2 + parseGbps(e.bandwidth), 0);
  if (totalCapacity > 0 && internetCapacity / totalCapacity > 0.5 && destinations.length > 0) {
    add({
      severity: 'recommendation',
      category: 'Cost',
      title: 'Majority of capacity rides public internet',
      detail: `${Math.round((internetCapacity / totalCapacity) * 100)}% of provisioned bandwidth is internet transport. Cheap per Gbps, but SLA-free - outage cost usually exceeds the transport savings.`,
      recommendation: 'Move critical workloads to dedicated interconnects; keep internet as the burst/backup tier.',
      nodeIds: [],
      edgeIds: edges.filter(e => e.type.toLowerCase().includes('internet')).map(e => e.id)
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

  return { findings, scores, grade, summary, monthlyCost, generatedAt: Date.now() };
}

// The four consultative dimensions shown in the Advisor header. Resilience
// folds the three availability scores; cost efficiency is derived from how
// many cost advisories the assessment raised.
export interface Dimensions {
  resilience: number;
  security: number;
  performance: number;
  cost: number;
}

export function toDimensions(assessment: Assessment): Dimensions {
  const { scores, findings } = assessment;
  const costFindings = findings.filter(f => f.category === 'Cost').length;
  return {
    resilience: Math.round((scores.resiliency + scores.redundancy + scores.disaster) / 3),
    security: Math.round(scores.security),
    performance: Math.round(scores.performance),
    cost: Math.max(25, Math.min(95, 95 - costFindings * 18))
  };
}

// Apply a one-click remediation to the topology. Returns the modified
// copies plus a human summary for the toast.
export function applyFix(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  action: FixAction
): { nodes: NetworkNode[]; edges: NetworkEdge[]; summary: string } {
  switch (action.type) {
    case 'encrypt-edges': {
      const ids = new Set(action.edgeIds);
      return {
        nodes,
        edges: edges.map(e => ids.has(e.id) ? { ...e, config: { ...e.config, encrypted: true } } : e),
        summary: `Enabled encryption on ${action.edgeIds.length} link${action.edgeIds.length > 1 ? 's' : ''}.`
      };
    }
    case 'set-resilience': {
      const ids = new Set(action.edgeIds);
      return {
        nodes,
        edges: edges.map(e => ids.has(e.id) ? { ...e, config: { ...e.config, resilience: action.value } } : e),
        summary: `Upgraded ${action.edgeIds.length} link${action.edgeIds.length > 1 ? 's' : ''} to ${action.value === 'dualdiverse' ? 'dual-diverse' : action.value} resilience.`
      };
    }
    case 'add-redundant-node': {
      const original = nodes.find(n => n.id === action.nodeId);
      if (!original) return { nodes, edges, summary: 'Node no longer exists.' };
      const stamp = Date.now();
      const spot = findClearSpot(original.x + 40, Math.min(original.y + 120, 700), nodes);
      const twin: NetworkNode = {
        ...original,
        id: `node-fix-${stamp}`,
        name: `${original.name} (Secondary)`,
        x: spot.x,
        y: spot.y,
        config: { ...original.config, routerRole: 'secondary' }
      };
      const twinEdges: NetworkEdge[] = neighborEdgesLocal(original.id, edges).map((e, i) => ({
        ...e,
        id: `edge-fix-${stamp}-${i}`,
        source: e.source === original.id ? twin.id : e.source,
        target: e.target === original.id ? twin.id : e.target,
        config: { ...e.config, resilience: 'redundant' }
      }));
      const withRole = nodes.map(n =>
        n.id === original.id ? { ...n, config: { ...n.config, routerRole: 'primary' } } : n
      );
      return {
        nodes: [...withRole, twin],
        edges: [...edges, ...twinEdges],
        summary: `Added ${twin.name} and dual-homed ${twinEdges.length} connection${twinEdges.length > 1 ? 's' : ''}.`
      };
    }
    case 'renumber-subnet': {
      return {
        nodes: nodes.map(n =>
          n.id === action.nodeId
            ? {
                ...n,
                config: {
                  ...n.config,
                  subnets: ((n.config?.subnets as string[]) ?? []).map(c => (c === action.from ? action.to : c))
                }
              }
            : n
        ),
        edges,
        summary: `Renumbered ${action.from} to ${action.to}.`
      };
    }
    case 'add-firewall': {
      const stamp = Date.now();
      const router = nodes.find(n => n.type === 'function' && (n.functionType === 'Router' || n.functionType === 'Gateway'));
      const internet = nodes.find(n => n.type === 'network' && n.config?.networkType === 'internet');
      const anchor = router ?? nodes[0];
      const fwSpot = findClearSpot(
        anchor ? anchor.x - 60 : 400,
        anchor ? Math.min(anchor.y + 140, 700) : 400,
        nodes
      );
      const firewall: NetworkNode = {
        id: `node-fix-${stamp}`,
        type: 'function',
        functionType: 'Firewall',
        x: fwSpot.x,
        y: fwSpot.y,
        name: 'Edge Firewall',
        icon: undefined as any, // rehydrated by the caller
        status: 'inactive',
        config: { firewallType: 'ngfw', deploymentMode: 'inline' }
      };
      const newEdges: NetworkEdge[] = [];
      if (internet) {
        newEdges.push({
          id: `edge-fix-${stamp}-a`,
          source: internet.id,
          target: firewall.id,
          type: 'Ethernet',
          bandwidth: '10 Gbps',
          status: 'inactive',
          config: { encrypted: true }
        });
      }
      if (router) {
        newEdges.push({
          id: `edge-fix-${stamp}-b`,
          source: firewall.id,
          target: router.id,
          type: 'Ethernet',
          bandwidth: '10 Gbps',
          status: 'inactive',
          config: { encrypted: true }
        });
      }
      return {
        nodes: [...nodes, firewall],
        edges: [...edges, ...newEdges],
        summary: 'Inserted an inline NGFW between the internet edge and your routing layer.'
      };
    }
  }
}

function neighborEdgesLocal(nodeId: string, edges: NetworkEdge[]): NetworkEdge[] {
  return edges.filter(e => e.source === nodeId || e.target === nodeId);
}

// --- Address plan: the full IP inventory, not just the conflicts ---
// The Assess tab only mentions IP space when ranges collide; a reviewer
// asking "what about addressing?" deserves the whole picture - every
// range each environment carries, with conflicts marked in place.
export interface AddressRow {
  nodeId: string;
  nodeName: string;
  site: string | null;
  provider: string | null;
  cidr: string;
  valid: boolean;
  conflicts: { nodeId: string; nodeName: string; cidr: string }[];
}

export interface AddressPlan {
  rows: AddressRow[];
  conflictPairs: number;
  nextFree: string | null;
  /** nodes that carry no subnet data at all */
  unaddressed: number;
}

export function buildAddressPlan(nodes: NetworkNode[]): AddressPlan {
  const carriers = nodes
    .filter(n => Array.isArray(n.config?.subnets) && n.config!.subnets.length > 0)
    .map(n => ({ node: n, ranges: (n.config!.subnets as string[]).map(c => ({ cidr: c, range: cidrRange(c) })) }));

  const rows: AddressRow[] = carriers.flatMap(c =>
    c.ranges.map(r => ({
      nodeId: c.node.id,
      nodeName: c.node.name,
      site: c.node.config?.city ?? null,
      provider: c.node.config?.provider ?? c.node.cloudProvider ?? null,
      cidr: r.cidr,
      valid: r.range !== null,
      conflicts: [] as AddressRow['conflicts']
    }))
  );

  // Same cross-node pairwise semantics as the overlap finding
  const seenPairs = new Set<string>();
  for (let i = 0; i < carriers.length; i++) {
    for (let j = i + 1; j < carriers.length; j++) {
      carriers[i].ranges.forEach(a => {
        carriers[j].ranges.forEach(b => {
          if (!a.range || !b.range) return;
          if (a.range[0] <= b.range[1] && b.range[0] <= a.range[1]) {
            seenPairs.add([carriers[i].node.id, carriers[j].node.id, a.cidr, b.cidr].join('|'));
            rows.find(r => r.nodeId === carriers[i].node.id && r.cidr === a.cidr)!
              .conflicts.push({ nodeId: carriers[j].node.id, nodeName: carriers[j].node.name, cidr: b.cidr });
            rows.find(r => r.nodeId === carriers[j].node.id && r.cidr === b.cidr)!
              .conflicts.push({ nodeId: carriers[i].node.id, nodeName: carriers[i].node.name, cidr: a.cidr });
          }
        });
      });
    }
  }

  const allCidrs = new Set(rows.map(r => r.cidr));
  return {
    rows,
    conflictPairs: seenPairs.size,
    nextFree: rows.length > 0 ? nextFreeCidr(allCidrs) : null,
    unaddressed: nodes.length - carriers.length
  };
}

// CIDR helpers for overlap detection. Returns [start, end] as uint32,
// or null for anything that doesn't parse as IPv4 CIDR.
function cidrRange(cidr: string): [number, number] | null {
  const m = cidr.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
  if (!m) return null;
  const octets = [+m[1], +m[2], +m[3], +m[4]];
  const bits = +m[5];
  if (octets.some(o => o > 255) || bits > 32) return null;
  const base = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  const start = (base & mask) >>> 0;
  const end = (start + (bits === 32 ? 0 : (1 << (32 - bits)) - 1)) >>> 0;
  return [start, end];
}

// Next unused 10.x.0.0/16 in this design
function nextFreeCidr(used: Set<string>): string {
  for (let x = 0; x < 256; x++) {
    const candidate = `10.${x}.0.0/16`;
    const candRange = cidrRange(candidate)!;
    const collides = [...used].some(u => {
      const r = cidrRange(u);
      return r && candRange[0] <= r[1] && r[0] <= candRange[1];
    });
    if (!collides) return candidate;
  }
  return '192.168.0.0/16';
}

// Spiral out from the desired position until the spot is clear of every
// existing node card (including its label zone below).
function findClearSpot(x: number, y: number, nodes: NetworkNode[]): { x: number; y: number } {
  const collides = (px: number, py: number) =>
    nodes.some(n => Math.abs(n.x - px) < 96 && Math.abs(n.y - py) < 116);
  if (!collides(x, y)) return { x, y };
  for (let radius = 110; radius <= 440; radius += 110) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      const px = Math.max(20, x + Math.cos(angle) * radius);
      const py = Math.max(20, Math.min(700, y + Math.sin(angle) * radius));
      if (!collides(px, py)) return { x: px, y: py };
    }
  }
  return { x: x + 160, y };
}
