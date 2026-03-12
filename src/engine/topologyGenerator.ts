// Intent-to-topology generator
// Translates business requirements into complete network topologies

import { NetworkNode, NetworkEdge } from '../types';
import { getNodeIcon, getNodeDisplayName } from '../utils/nodeUtils';

export interface TopologyIntent {
  sites: string[];           // City names
  clouds: string[];          // Provider IDs: AWS, Azure, Google, Oracle
  sla: 'standard' | 'high' | 'critical';  // Availability target
  bandwidth: string;         // e.g. '10 Gbps'
  compliance?: string[];     // HIPAA, PCI, FedRAMP
  sdwan?: boolean;           // Include SD-WAN overlay
}

export interface TopologyCandidate {
  id: string;
  name: string;
  description: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    estimatedMonthlyCost: string;
    availabilitySLA: string;
  };
}

// Cloud provider to interconnect type mapping
const CLOUD_EDGE_MAP: Record<string, string> = {
  'AWS': 'Direct Connect',
  'Azure': 'ExpressRoute',
  'Google': 'Cloud Interconnect',
  'Oracle': 'FastConnect',
};

let nodeCounter = 0;
let edgeCounter = 0;

function makeNodeId(): string {
  return `gen-node-${++nodeCounter}`;
}

function makeEdgeId(): string {
  return `gen-edge-${++edgeCounter}`;
}

function createNode(
  type: NetworkNode['type'],
  name: string,
  x: number,
  y: number,
  config: Record<string, any> = {},
  functionType?: string,
  cloudProvider?: string,
): NetworkNode {
  return {
    id: makeNodeId(),
    type,
    ...(functionType ? { functionType } : {}),
    ...(cloudProvider ? { cloudProvider } : {}),
    x,
    y,
    name,
    icon: getNodeIcon(type, functionType, config.networkType),
    status: 'inactive' as const,
    config,
  };
}

function createEdge(
  source: string,
  target: string,
  type: string,
  bandwidth: string,
  config: Record<string, any> = {},
): NetworkEdge {
  return {
    id: makeEdgeId(),
    source,
    target,
    type,
    bandwidth,
    status: 'inactive' as const,
    config,
  };
}

export function generateTopology(intent: TopologyIntent): TopologyCandidate[] {
  // Reset counters
  nodeCounter = 0;
  edgeCounter = 0;

  const candidates: TopologyCandidate[] = [];

  // Cost-Optimized
  candidates.push(generateCostOptimized(intent));

  // Balanced
  candidates.push(generateBalanced(intent));

  // Resilience-Optimized
  if (intent.sla === 'high' || intent.sla === 'critical') {
    candidates.push(generateResilient(intent));
  }

  return candidates;
}

function generateCostOptimized(intent: TopologyIntent): TopologyCandidate {
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const baseY = 300;
  const startX = 100;
  const spacing = 200;

  // Single IPE
  const ipe = createNode('network', 'AT&T Core', startX, baseY, {
    networkType: 'at&t core',
    city: intent.sites[0] || 'Dallas',
  });
  nodes.push(ipe);

  // Single Cloud Router
  const cr = createNode('function', 'Cloud Router', startX + spacing, baseY, {
    routerType: 'cloud',
    routingProtocol: 'bgp',
  }, 'Router');
  nodes.push(cr);

  // IPE to CR
  edges.push(createEdge(ipe.id, cr.id, 'MPLS', intent.bandwidth, { resilience: 'single' }));

  // Cloud destinations
  intent.clouds.forEach((cloud, i) => {
    const dest = createNode('destination', cloud, startX + spacing * 2, baseY - 80 + i * 160, {
      provider: cloud,
    }, undefined, cloud);
    nodes.push(dest);

    const edgeType = CLOUD_EDGE_MAP[cloud] || 'Direct Connect';
    edges.push(createEdge(cr.id, dest.id, edgeType, intent.bandwidth));
  });

  // Firewall if compliance required
  if (intent.compliance && intent.compliance.length > 0) {
    const fw = createNode('function', 'Firewall', startX + spacing / 2, baseY + 120, {
      firewallType: 'ngfw',
      inspectionLevel: 'deep',
    }, 'Firewall');
    nodes.push(fw);
    edges.push(createEdge(ipe.id, fw.id, 'Ethernet', '10 Gbps'));
    edges.push(createEdge(fw.id, cr.id, 'Ethernet', '10 Gbps'));
  }

  return {
    id: 'cost-optimized',
    name: 'Cost Optimized',
    description: 'Minimum viable topology. Single path, single router. Best for dev/test or non-critical workloads.',
    nodes,
    edges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      estimatedMonthlyCost: '$2,500/mo',
      availabilitySLA: '99.5%',
    },
  };
}

function generateBalanced(intent: TopologyIntent): TopologyCandidate {
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const baseY = 300;
  const startX = 80;
  const spacing = 180;

  // IPE per site (max 2)
  const sites = intent.sites.slice(0, 2);
  const ipeNodes: NetworkNode[] = [];
  sites.forEach((site, i) => {
    const ipe = createNode('network', `AT&T Core - ${site}`, startX, baseY - 100 + i * 200, {
      networkType: 'at&t core',
      city: site,
    });
    nodes.push(ipe);
    ipeNodes.push(ipe);
  });

  // Cloud Router
  const cr = createNode('function', 'Cloud Router', startX + spacing, baseY, {
    routerType: 'cloud',
    routingProtocol: 'bgp',
    fastReroute: true,
  }, 'Router');
  nodes.push(cr);

  // IPE to CR with redundancy
  ipeNodes.forEach(ipe => {
    edges.push(createEdge(ipe.id, cr.id, 'MPLS', intent.bandwidth, { resilience: 'redundant', bfd: true }));
  });

  // Cloud destinations
  intent.clouds.forEach((cloud, i) => {
    const dest = createNode('destination', cloud, startX + spacing * 2, baseY - 80 + i * 130, {
      provider: cloud,
      region: cloud === 'AWS' ? 'us-east-1' : cloud === 'Azure' ? 'East US' : 'us-central1',
    }, undefined, cloud);
    nodes.push(dest);

    const edgeType = CLOUD_EDGE_MAP[cloud] || 'Direct Connect';
    edges.push(createEdge(cr.id, dest.id, edgeType, intent.bandwidth, { resilience: 'redundant' }));
  });

  // Firewall
  const fw = createNode('function', 'Firewall', startX + spacing / 2, baseY + 140, {
    firewallType: 'ngfw',
    inspectionLevel: 'deep',
  }, 'Firewall');
  nodes.push(fw);
  edges.push(createEdge(ipeNodes[0].id, fw.id, 'Ethernet', '10 Gbps'));
  edges.push(createEdge(fw.id, cr.id, 'Ethernet', '10 Gbps'));

  // SD-WAN if requested
  if (intent.sdwan) {
    const sdwan = createNode('function', 'SD-WAN', startX + spacing / 2, baseY - 140, {
      sdwanRole: 'edge',
    }, 'SDWAN');
    nodes.push(sdwan);
    edges.push(createEdge(ipeNodes[0].id, sdwan.id, 'MPLS', '1 Gbps'));
    edges.push(createEdge(sdwan.id, cr.id, 'VPN', '1 Gbps'));
  }

  return {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good trade-off between cost and resilience. Redundant backbone, firewall inspection, BFD fast failover.',
    nodes,
    edges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      estimatedMonthlyCost: '$5,800/mo',
      availabilitySLA: '99.9%',
    },
  };
}

function generateResilient(intent: TopologyIntent): TopologyCandidate {
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const baseY = 300;
  const startX = 60;
  const spacing = 170;

  // Dual IPE
  const sites = intent.sites.length >= 2 ? intent.sites.slice(0, 2) : [intent.sites[0] || 'Dallas', 'Chicago'];
  const ipeNodes: NetworkNode[] = [];
  sites.forEach((site, i) => {
    const ipe = createNode('network', `AT&T Core - ${site}`, startX, baseY - 120 + i * 240, {
      networkType: 'at&t core',
      city: site,
    });
    nodes.push(ipe);
    ipeNodes.push(ipe);
  });

  // Dual Cloud Routers
  const cr1 = createNode('function', 'Cloud Router Primary', startX + spacing, baseY - 80, {
    routerType: 'cloud',
    routingProtocol: 'bgp',
    fastReroute: true,
    bfd: true,
  }, 'Router');
  const cr2 = createNode('function', 'Cloud Router Secondary', startX + spacing, baseY + 80, {
    routerType: 'cloud',
    routingProtocol: 'bgp',
    fastReroute: true,
    bfd: true,
  }, 'Router');
  nodes.push(cr1, cr2);

  // Cross-connect between routers
  edges.push(createEdge(cr1.id, cr2.id, 'Ethernet', '10 Gbps', { resilience: 'ha', bfd: true }));

  // Each IPE to both CRs (dual-diverse)
  ipeNodes.forEach(ipe => {
    edges.push(createEdge(ipe.id, cr1.id, 'MPLS', intent.bandwidth, { resilience: 'dualdiverse', bfd: true }));
    edges.push(createEdge(ipe.id, cr2.id, 'MPLS', intent.bandwidth, { resilience: 'dualdiverse', bfd: true }));
  });

  // Cloud destinations connected to both routers
  intent.clouds.forEach((cloud, i) => {
    const dest = createNode('destination', cloud, startX + spacing * 2 + 30, baseY - 80 + i * 130, {
      provider: cloud,
      region: cloud === 'AWS' ? 'us-east-1' : cloud === 'Azure' ? 'East US' : 'us-central1',
    }, undefined, cloud);
    nodes.push(dest);

    const edgeType = CLOUD_EDGE_MAP[cloud] || 'Direct Connect';
    edges.push(createEdge(cr1.id, dest.id, edgeType, intent.bandwidth, { resilience: 'redundant' }));
    edges.push(createEdge(cr2.id, dest.id, edgeType, intent.bandwidth, { resilience: 'redundant' }));
  });

  // Dual firewalls
  const fw1 = createNode('function', 'Firewall Primary', startX + spacing / 2, baseY - 60, {
    firewallType: 'ngfw',
    inspectionLevel: 'deep',
    highAvailability: true,
  }, 'Firewall');
  const fw2 = createNode('function', 'Firewall Secondary', startX + spacing / 2, baseY + 60, {
    firewallType: 'ngfw',
    inspectionLevel: 'deep',
    highAvailability: true,
  }, 'Firewall');
  nodes.push(fw1, fw2);

  edges.push(createEdge(ipeNodes[0].id, fw1.id, 'Ethernet', '10 Gbps'));
  edges.push(createEdge(fw1.id, cr1.id, 'Ethernet', '10 Gbps'));
  if (ipeNodes.length > 1) {
    edges.push(createEdge(ipeNodes[1].id, fw2.id, 'Ethernet', '10 Gbps'));
  }
  edges.push(createEdge(fw2.id, cr2.id, 'Ethernet', '10 Gbps'));

  return {
    id: 'resilient',
    name: 'Resilience Optimized',
    description: 'Maximum redundancy. Dual-diverse paths, dual Cloud Routers, dual firewalls, BFD fast reroute across all links.',
    nodes,
    edges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      estimatedMonthlyCost: '$12,500/mo',
      availabilitySLA: '99.99%',
    },
  };
}

// Apply a specific AI recommendation to existing topology
export function applyRecommendation(
  recType: string,
  nodes: NetworkNode[],
  edges: NetworkEdge[],
): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  nodeCounter = nodes.length * 10; // avoid ID collisions
  edgeCounter = edges.length * 10;

  const newNodes = [...nodes];
  const newEdges = [...edges];

  switch (recType) {
    case 'redundant': {
      // Add a second Cloud Router and cross-connect
      const existingCR = nodes.find(n =>
        n.type === 'function' && (n.functionType === 'Router' || n.functionType === 'Cloud Router') &&
        (n.config?.routerType === 'cloud' || n.name?.toLowerCase().includes('cloud router'))
      );
      if (existingCR) {
        const cr2 = createNode('function', 'Cloud Router Secondary', existingCR.x, existingCR.y + 150, {
          routerType: 'cloud',
          routingProtocol: 'bgp',
          fastReroute: true,
          bfd: true,
        }, 'Router');
        newNodes.push(cr2);
        newEdges.push(createEdge(existingCR.id, cr2.id, 'Ethernet', '10 Gbps', { resilience: 'ha', bfd: true }));

        // Connect secondary to all destinations
        const destEdges = edges.filter(e => e.source === existingCR.id);
        destEdges.forEach(e => {
          const targetNode = nodes.find(n => n.id === e.target);
          if (targetNode && targetNode.type === 'destination') {
            newEdges.push(createEdge(cr2.id, e.target, e.type, e.bandwidth, { resilience: 'redundant' }));
          }
        });

        // Connect secondary to IPE
        const ipeEdges = edges.filter(e => e.target === existingCR.id);
        ipeEdges.forEach(e => {
          const srcNode = nodes.find(n => n.id === e.source);
          if (srcNode && srcNode.config?.networkType === 'at&t core') {
            newEdges.push(createEdge(e.source, cr2.id, e.type, e.bandwidth, { resilience: 'dualdiverse', bfd: true }));
          }
        });
      }
      break;
    }

    case 'security': {
      // Add a firewall between IPE and Cloud Router
      const ipe = nodes.find(n => n.config?.networkType === 'at&t core');
      const cr = nodes.find(n =>
        n.type === 'function' && (n.functionType === 'Router' || n.functionType === 'Cloud Router')
      );
      if (ipe && cr) {
        const fw = createNode('function', 'Firewall', (ipe.x + cr.x) / 2, Math.max(ipe.y, cr.y) + 120, {
          firewallType: 'ngfw',
          inspectionLevel: 'deep',
          deploymentMode: 'inline',
        }, 'Firewall');
        newNodes.push(fw);
        newEdges.push(createEdge(ipe.id, fw.id, 'Ethernet', '10 Gbps'));
        newEdges.push(createEdge(fw.id, cr.id, 'Ethernet', '10 Gbps'));
      }
      break;
    }

    case 'multiregion': {
      // Add a second site with IPE + CR
      const existingIPE = nodes.find(n => n.config?.networkType === 'at&t core');
      const existingCR = nodes.find(n =>
        n.type === 'function' && (n.functionType === 'Router' || n.functionType === 'Cloud Router')
      );
      if (existingIPE && existingCR) {
        const ipe2 = createNode('network', 'AT&T Core - Chicago', existingIPE.x, existingIPE.y + 200, {
          networkType: 'at&t core',
          city: 'Chicago',
        });
        const cr2 = createNode('function', 'Cloud Router DR', existingCR.x, existingCR.y + 200, {
          routerType: 'cloud',
          routingProtocol: 'bgp',
        }, 'Router');
        newNodes.push(ipe2, cr2);
        newEdges.push(createEdge(ipe2.id, cr2.id, 'MPLS', '10 Gbps', { resilience: 'redundant' }));

        // Cross-connect existing CR to new CR
        newEdges.push(createEdge(existingCR.id, cr2.id, 'MPLS', '10 Gbps', { resilience: 'ha', replication: true }));

        // Connect new CR to existing destinations
        const destEdges = edges.filter(e => e.source === existingCR.id);
        destEdges.forEach(e => {
          const targetNode = nodes.find(n => n.id === e.target);
          if (targetNode && targetNode.type === 'destination') {
            newEdges.push(createEdge(cr2.id, e.target, e.type, e.bandwidth));
          }
        });
      }
      break;
    }

    case 'cost': {
      // Downgrade non-critical edge bandwidth to 1 Gbps
      newEdges.forEach((edge, i) => {
        const match = edge.bandwidth?.match(/(\d+)\s*(\w+)/);
        if (match) {
          const val = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          const gbps = unit.includes('g') ? val : val / 1000;
          if (gbps > 1) {
            newEdges[i] = { ...edge, bandwidth: '1 Gbps' };
          }
        }
      });
      break;
    }
  }

  return { nodes: newNodes, edges: newEdges };
}
