import { Server, Cloud, Router, Network, Shield, Activity, PanelRight, Menu, Database, Globe, Lock, Feather as Ethernet, Wifi } from 'lucide-react';
import { CloudRouterIcon } from '../components/icons/CloudRouterIcon';
import { getProviderIcon, getDatacenterIcon } from '../components/icons/ProviderIcons';
import { NetworkNode } from '../types';

export const getFunctionIcon = (functionType: string, config?: any) => {
  switch (functionType) {
    case 'Cloud Router': return CloudRouterIcon;
    case 'Router': return config?.routerType === 'cloud' ? CloudRouterIcon : Router;
    case 'SDWAN': return PanelRight;
    case 'Firewall': return Shield;
    case 'VNF': return Activity;
    case 'VNAT': return Menu;
    default: return Server;
  }
};

export const getNetworkTypeIcon = (networkType: string) => {
  switch (networkType?.toLowerCase()) {
    case 'internet': return Network;
    case 'vpn': return Lock;
    case 'ethernet': return Ethernet;
    case 'iot': return Wifi;
    case 'at&t core': return Globe;
    default: return Network;
  }
};

export const getNodeIcon = (type: NetworkNode['type'], functionType?: string, networkType?: string, config?: any) => {
  switch (type) {
    case 'function':
      return functionType ? getFunctionIcon(functionType, config) : Server;
    case 'destination':
      return getProviderIcon(config?.provider ?? config?.cloudProvider) ?? Cloud;
    case 'datacenter':
      return getDatacenterIcon(config?.provider) ?? Database;
    case 'network':
      return networkType ? getNetworkTypeIcon(networkType) : Network;
    default:
      return Server;
  }
};

export const getNodeDisplayName = (type: NetworkNode['type'], functionType?: string, networkType?: string, provider?: string): string => {
  if (type === 'function') {
    return functionType === 'Cloud Router' ? 'Cloud Router' : functionType || 'Function';
  } else if (type === 'destination' && provider) {
    return provider === 'Google' ? 'Google Cloud' : provider;
  } else if (networkType) {
    return networkType === 'AT&T Core' ? 'AT&T Core' : `${networkType.charAt(0).toUpperCase() + networkType.slice(1)}`;
  } else {
    return `${type.charAt(0).toUpperCase() + type.slice(1)}`;
  }
};

// Node colors per the SDCI Figma "Network Designer | Nodes" spec:
// white cards, type-tinted icons; AT&T Core globe in functional blue,
// Cloud Router in magenta, clouds in functional blue.
export const getNodeColors = (node: NetworkNode) => {
  const isCloudRouter =
    node.type === 'function' &&
    (node.functionType === 'Cloud Router' || (node.functionType === 'Router' && node.config?.routerType === 'cloud'));

  const getBackgroundColor = () => {
    if (isCloudRouter) return 'bg-fuchsia-50';
    if (node.type === 'network') return 'bg-cobalt-100';
    if (node.type === 'destination') return 'bg-cobalt-100';
    return 'bg-white';
  };

  const getIconColor = () => {
    if (isCloudRouter) return 'text-fuchsia-600';
    if (node.type === 'network') return 'text-cobalt-700';
    if (node.type === 'destination') {
      const p = (node.config?.provider || node.cloudProvider || '').toLowerCase();
      if (p.includes('aws') || p.includes('amazon')) return 'text-[#FF9900]';
      if (p.includes('azure') || p.includes('microsoft')) return 'text-[#0078D4]';
      if (p.includes('google') || p.includes('gcp')) return 'text-[#4285F4]';
      if (p.includes('oracle')) return 'text-[#C74634]';
      return 'text-functional-blue';
    }
    if (node.type === 'datacenter') return 'text-cobalt-600';
    return 'text-gray-700';
  };

  const getStatusColor = () => {
    if (node.config?.health === 'down' || node.config?.health === 'error') return 'bg-red-600';
    if (node.status !== 'active') return 'bg-gray-400';
    return 'bg-green-600';
  };

  return {
    background: getBackgroundColor(),
    icon: getIconColor(),
    status: getStatusColor()
  };
};