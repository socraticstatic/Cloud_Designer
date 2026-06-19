// Service-aware connection defaults
// Given a source node type/subtype and target node type/subtype,
// return the default edge configuration for AT&T NetBond Advanced

import { NetworkNode } from '../types';

interface EdgeDefaults {
  type: string;
  bandwidth: string;
  resilience?: 'single' | 'redundant' | 'ha' | 'dualdiverse' | 'standard';
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

function isGateway(node: NetworkNode): boolean {
  return node.type === 'function' && (node.functionType === 'Router' || node.functionType === 'Gateway') &&
    (node.config?.routerType === 'cloud' || /gateway|cloud router/.test(node.name?.toLowerCase() ?? ''));
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

  // IPE <-> Gateway: MPLS backbone
  if ((isIPE(srcSig) && isGateway(target)) || (isGateway(source) && isIPE(tgtSig))) {
    return { type: 'MPLS', bandwidth: '10 Gbps', resilience: 'redundant', description: 'AVPN backbone link' };
  }

  // Gateway <-> Cloud Destination: NetBond interconnect
  if (isGateway(source) && isCloudDestination(tgtSig)) {
    const provider = target.cloudProvider || target.config?.provider || '';
    const interconnect = CLOUD_INTERCONNECT_MAP[provider];
    if (interconnect) {
      return { type: interconnect.type, bandwidth: '10 Gbps', resilience: 'redundant', description: interconnect.description };
    }
    return { type: 'Direct Connect', bandwidth: '10 Gbps', description: 'Cloud interconnect' };
  }
  if (isCloudDestination(srcSig) && isGateway(target)) {
    const provider = source.cloudProvider || source.config?.provider || '';
    const interconnect = CLOUD_INTERCONNECT_MAP[provider];
    if (interconnect) {
      return { type: interconnect.type, bandwidth: '10 Gbps', resilience: 'redundant', description: interconnect.description };
    }
    return { type: 'Direct Connect', bandwidth: '10 Gbps', description: 'Cloud interconnect' };
  }

  // Gateway <-> Datacenter: Ethernet
  if ((isGateway(source) && isDatacenter(tgtSig)) || (isDatacenter(srcSig) && isGateway(target))) {
    return { type: 'Ethernet', bandwidth: '10 Gbps', description: 'Cross-connect to datacenter' };
  }

  // SD-WAN <-> IPE: MPLS underlay
  if ((isSDWAN(srcSig) && isIPE(tgtSig)) || (isIPE(srcSig) && isSDWAN(tgtSig))) {
    return { type: 'MPLS', bandwidth: '1 Gbps', description: 'SD-WAN MPLS underlay' };
  }

  // SD-WAN <-> Gateway: overlay tunnel
  if ((isSDWAN(srcSig) && isGateway(target)) || (isGateway(source) && isSDWAN(tgtSig))) {
    return { type: 'VPN', bandwidth: '1 Gbps', description: 'SD-WAN overlay tunnel' };
  }

  // Firewall <-> Gateway: Ethernet
  if ((isFirewall(srcSig) && isGateway(target)) || (isGateway(source) && isFirewall(tgtSig))) {
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

  // FlexWare <-> Gateway
  if ((isFlexWare(srcSig) && isGateway(target)) || (isGateway(source) && isFlexWare(tgtSig))) {
    return { type: 'Ethernet', bandwidth: '1 Gbps', description: 'FlexWare to Gateway' };
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

  // Cloud destination added -> connect to Gateway
  if (isCloudDestination(newSig)) {
    const gateway = existingNodes.find(n => isGateway(n));
    if (gateway) {
      const defaults = getEdgeDefaults(gateway, newNode);
      const provider = newNode.cloudProvider || newNode.config?.provider || 'Cloud';
      return {
        targetNode: gateway,
        edgeDefaults: defaults,
        message: `Connect ${provider} to ${gateway.name} via ${defaults.type}?`
      };
    }
  }

  // Function node added -> connect to IPE
  if (newSig.type === 'function' && newSig.functionType !== 'Router' && newSig.functionType !== 'Gateway') {
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

  // Datacenter added -> connect to Gateway
  if (isDatacenter(newSig)) {
    const gateway = existingNodes.find(n => isGateway(n));
    if (gateway) {
      const defaults = getEdgeDefaults(gateway, newNode);
      return {
        targetNode: gateway,
        edgeDefaults: defaults,
        message: `Connect ${newNode.name} to ${gateway.name} via ${defaults.type}?`
      };
    }
  }

  return null;
}
