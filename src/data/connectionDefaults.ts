// Service-aware connection defaults
// Given a source node type/subtype and target node type/subtype,
// return the default edge configuration for AT&T NetBond Advanced

import { NetworkNode } from '../types';

interface EdgeDefaults {
  type: string;
  bandwidth: string;
  resilience?: string;
  description?: string;
}

type NodeSignature = {
  type: NetworkNode['type'];
  functionType?: string;
  networkType?: string;
  provider?: string;
};

function getNodeSignature(node: NetworkNode): NodeSignature {
  return {
    type: node.type,
    functionType: node.functionType,
    networkType: node.config?.networkType,
    provider: node.cloudProvider || node.config?.provider,
  };
}

function isIPE(sig: NodeSignature): boolean {
  return sig.type === 'network' && (sig.networkType === 'at&t core' || sig.networkType === 'AT&T Core');
}

function isCloudRouter(node: NetworkNode): boolean {
  return node.type === 'function' && (node.functionType === 'Router' || node.functionType === 'Cloud Router') &&
    (node.config?.routerType === 'cloud' || node.name?.toLowerCase().includes('cloud router'));
}

function isCloudDestination(sig: NodeSignature): boolean {
  return sig.type === 'destination';
}

function isDatacenter(sig: NodeSignature): boolean {
  return sig.type === 'datacenter';
}

function isSDWAN(sig: NodeSignature): boolean {
  return sig.type === 'function' && sig.functionType === 'SDWAN';
}

function isFirewall(sig: NodeSignature): boolean {
  return sig.type === 'function' && sig.functionType === 'Firewall';
}

function isFlexWare(sig: NodeSignature): boolean {
  return sig.type === 'function' && sig.functionType === 'FlexWare';
}

// Cloud provider to interconnect service mapping
const CLOUD_INTERCONNECT_MAP: Record<string, { type: string; description: string }> = {
  'AWS': { type: 'Direct Connect', description: 'NetBond for AWS via Direct Connect' },
  'Azure': { type: 'ExpressRoute', description: 'NetBond for Azure via ExpressRoute' },
  'Google': { type: 'Cloud Interconnect', description: 'NetBond for GCP via Cloud Interconnect' },
  'Oracle': { type: 'FastConnect', description: 'NetBond for Oracle via FastConnect' },
};

export function getEdgeDefaults(source: NetworkNode, target: NetworkNode): EdgeDefaults {
  const srcSig = getNodeSignature(source);
  const tgtSig = getNodeSignature(target);

  // IPE <-> Cloud Router: MPLS backbone
  if ((isIPE(srcSig) && isCloudRouter(target)) || (isCloudRouter(source) && isIPE(tgtSig))) {
    return { type: 'MPLS', bandwidth: '10 Gbps', resilience: 'redundant', description: 'AVPN backbone link' };
  }

  // Cloud Router <-> Cloud Destination: NetBond interconnect
  if (isCloudRouter(source) && isCloudDestination(tgtSig)) {
    const provider = target.cloudProvider || target.config?.provider || '';
    const interconnect = CLOUD_INTERCONNECT_MAP[provider];
    if (interconnect) {
      return { type: interconnect.type, bandwidth: '10 Gbps', resilience: 'redundant', description: interconnect.description };
    }
    return { type: 'Direct Connect', bandwidth: '10 Gbps', description: 'Cloud interconnect' };
  }
  if (isCloudDestination(srcSig) && isCloudRouter(target)) {
    const provider = source.cloudProvider || source.config?.provider || '';
    const interconnect = CLOUD_INTERCONNECT_MAP[provider];
    if (interconnect) {
      return { type: interconnect.type, bandwidth: '10 Gbps', resilience: 'redundant', description: interconnect.description };
    }
    return { type: 'Direct Connect', bandwidth: '10 Gbps', description: 'Cloud interconnect' };
  }

  // Cloud Router <-> Datacenter: Ethernet
  if ((isCloudRouter(source) && isDatacenter(tgtSig)) || (isDatacenter(srcSig) && isCloudRouter(target))) {
    return { type: 'Ethernet', bandwidth: '10 Gbps', description: 'Cross-connect to datacenter' };
  }

  // SD-WAN <-> IPE: MPLS underlay
  if ((isSDWAN(srcSig) && isIPE(tgtSig)) || (isIPE(srcSig) && isSDWAN(tgtSig))) {
    return { type: 'MPLS', bandwidth: '1 Gbps', description: 'SD-WAN MPLS underlay' };
  }

  // SD-WAN <-> Cloud Router: overlay tunnel
  if ((isSDWAN(srcSig) && isCloudRouter(target)) || (isCloudRouter(source) && isSDWAN(tgtSig))) {
    return { type: 'VPN', bandwidth: '1 Gbps', description: 'SD-WAN overlay tunnel' };
  }

  // Firewall <-> Cloud Router: Ethernet
  if ((isFirewall(srcSig) && isCloudRouter(target)) || (isCloudRouter(source) && isFirewall(tgtSig))) {
    return { type: 'Ethernet', bandwidth: '10 Gbps', description: 'Security inspection path' };
  }

  // Firewall <-> IPE: Ethernet
  if ((isFirewall(srcSig) && isIPE(tgtSig)) || (isIPE(srcSig) && isFirewall(tgtSig))) {
    return { type: 'Ethernet', bandwidth: '10 Gbps', description: 'Firewall to IPE link' };
  }

  // FlexWare <-> IPE: MPLS (transport-agnostic CPE)
  if ((isFlexWare(srcSig) && isIPE(tgtSig)) || (isIPE(srcSig) && isFlexWare(tgtSig))) {
    return { type: 'MPLS', bandwidth: '1 Gbps', description: 'FlexWare to IPE transport' };
  }

  // FlexWare <-> Cloud Router
  if ((isFlexWare(srcSig) && isCloudRouter(target)) || (isCloudRouter(source) && isFlexWare(tgtSig))) {
    return { type: 'Ethernet', bandwidth: '1 Gbps', description: 'FlexWare to Cloud Router' };
  }

  // Network node (Internet/VPN/Ethernet) <-> anything: use network type defaults
  if (srcSig.type === 'network' && !isIPE(srcSig)) {
    return { type: 'Ethernet', bandwidth: '1 Gbps', description: 'Network transport link' };
  }
  if (tgtSig.type === 'network' && !isIPE(tgtSig)) {
    return { type: 'Ethernet', bandwidth: '1 Gbps', description: 'Network transport link' };
  }

  // Fallback
  return { type: 'Ethernet', bandwidth: '1 Gbps', description: 'Network connection' };
}

// Determine which node types can auto-connect when added
export function getAutoConnectTarget(
  newNode: NetworkNode,
  existingNodes: NetworkNode[]
): { targetNode: NetworkNode; edgeDefaults: EdgeDefaults; message: string } | null {
  const newSig = getNodeSignature(newNode);

  // Cloud destination added -> connect to Cloud Router
  if (isCloudDestination(newSig)) {
    const cloudRouter = existingNodes.find(n => isCloudRouter(n));
    if (cloudRouter) {
      const defaults = getEdgeDefaults(cloudRouter, newNode);
      const provider = newNode.cloudProvider || newNode.config?.provider || 'Cloud';
      return {
        targetNode: cloudRouter,
        edgeDefaults: defaults,
        message: `Connect ${provider} to ${cloudRouter.name} via ${defaults.type}?`
      };
    }
  }

  // Function node added -> connect to IPE
  if (newSig.type === 'function' && newSig.functionType !== 'Router' && newSig.functionType !== 'Cloud Router') {
    const ipe = existingNodes.find(n => {
      const sig = getNodeSignature(n);
      return isIPE(sig);
    });
    if (ipe) {
      const defaults = getEdgeDefaults(ipe, newNode);
      return {
        targetNode: ipe,
        edgeDefaults: defaults,
        message: `Connect ${newNode.functionType || 'function'} to AT&T Core via ${defaults.type}?`
      };
    }
  }

  // Datacenter added -> connect to Cloud Router
  if (isDatacenter(newSig)) {
    const cloudRouter = existingNodes.find(n => isCloudRouter(n));
    if (cloudRouter) {
      const defaults = getEdgeDefaults(cloudRouter, newNode);
      return {
        targetNode: cloudRouter,
        edgeDefaults: defaults,
        message: `Connect ${newNode.name} to ${cloudRouter.name} via ${defaults.type}?`
      };
    }
  }

  return null;
}
