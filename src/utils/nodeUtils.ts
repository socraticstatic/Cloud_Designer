import { Server, Cloud, Router, Network, Shield, Activity, PanelRight, Menu, Database, Globe, Lock, Feather as Ethernet, Wifi, Share2 } from 'lucide-react';
import { NetworkNode } from '../types';

export const getFunctionIcon = (functionType: string, config?: any) => {
  switch (functionType) {
    case 'Cloud Router': return Share2;
    case 'Router': return config?.routerType === 'cloud' ? Share2 : Router;
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
      return Cloud;
    case 'datacenter':
      return Database;
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

export const getNodeColors = (node: NetworkNode) => {
  const getBackgroundColor = () => {
    return 'bg-gray-50';
  };

  const getIconColor = () => {
    return 'text-gray-700';
  };

  const getStatusColor = () => {
    if (node.status !== 'active') return 'bg-gray-400';
    return 'bg-green-500';
  };

  return {
    background: getBackgroundColor(),
    icon: getIconColor(),
    status: getStatusColor()
  };
};