import { Server, Cloud, Router, Network, Shield, Activity, PanelRight, Menu, Database, Globe, Lock, Feather as Ethernet, Wifi } from 'lucide-react';
import { NetworkNode } from '../types';

export const getFunctionIcon = (functionType: string) => {
  switch (functionType) {
    case 'Cloud Router': return Router;
    case 'Router': return Router;
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

export const getNodeIcon = (type: NetworkNode['type'], functionType?: string, networkType?: string) => {
  switch (type) {
    case 'function':
      return functionType ? getFunctionIcon(functionType) : Server;
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
    if (node.type === 'function') {
      switch(node.functionType) {
        case 'Router': return 'bg-purple-50';
        case 'SDWAN': return 'bg-blue-50';
        case 'Firewall': return 'bg-red-50';
        case 'VNF': return 'bg-emerald-50';
        case 'VNAT': return 'bg-amber-50';
        default: return 'bg-blue-50';
      }
    }
    if (node.type === 'destination') return 'bg-blue-50';
    if (node.type === 'network') {
      switch(node.config?.networkType) {
        case 'internet': return 'bg-blue-50';
        case 'vpn': return 'bg-purple-50';
        case 'ethernet': return 'bg-emerald-50';
        case 'iot': return 'bg-amber-50';
        case 'at&t core': return 'bg-orange-50';
        default: return 'bg-white';
      }
    }
    if (node.type === 'datacenter') return 'bg-indigo-50';
    return 'bg-white';
  };

  const getIconColor = () => {
    if (node.type === 'function') {
      switch(node.functionType) {
        case 'Router': return 'text-purple-600';
        case 'SDWAN': return 'text-blue-600';
        case 'Firewall': return 'text-red-600';
        case 'VNF': return 'text-emerald-600';
        case 'VNAT': return 'text-amber-600';
        default: return 'text-blue-600';
      }
    }
    if (node.type === 'destination') return 'text-blue-600';
    if (node.type === 'network') {
      switch(node.config?.networkType) {
        case 'internet': return 'text-blue-600';
        case 'vpn': return 'text-purple-600';
        case 'ethernet': return 'text-emerald-600';
        case 'iot': return 'text-amber-600';
        case 'at&t core': return 'text-orange-600';
        default: return 'text-gray-600';
      }
    }
    if (node.type === 'datacenter') return 'text-indigo-600';
    return 'text-gray-400';
  };

  const getStatusColor = () => {
    if (node.status !== 'active') return 'bg-gray-400';
    
    switch (node.type) {
      case 'function':
        switch(node.functionType) {
          case 'Router': return 'bg-purple-500';
          case 'SDWAN': return 'bg-blue-500';
          case 'Firewall': return 'bg-red-500';
          case 'VNF': return 'bg-emerald-500';
          default: return 'bg-blue-500';
        }
      case 'destination': return 'bg-blue-500';
      case 'network': return 'bg-green-500';
      case 'datacenter': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  return {
    background: getBackgroundColor(),
    icon: getIconColor(),
    status: getStatusColor()
  };
};