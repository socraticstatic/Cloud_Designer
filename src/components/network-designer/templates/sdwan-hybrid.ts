import { Network, Router, Cloud, Globe, PanelRight, Shield } from 'lucide-react';
import { Template } from './types';

export const sdwanHybridTemplate: Template = {
  name: 'SD-WAN + MPLS Hybrid',
  description: 'SD-WAN overlay with MPLS underlay through AT&T Core to multi-cloud',
  preview: {
    icons: [
      { type: 'col', icons: [
        { icon: Globe, color: 'text-orange-400' },
        { icon: Network, color: 'text-blue-400' }
      ]},
      { type: 'col', icons: [
        { icon: PanelRight, color: 'text-indigo-400' },
        { icon: Shield, color: 'text-red-400' }
      ]},
      { type: 'col', icons: [
        { icon: Router, color: 'text-purple-400' }
      ]},
      { type: 'col', icons: [
        { icon: Cloud, color: 'text-orange-400' },
        { icon: Cloud, color: 'text-blue-400' }
      ]}
    ]
  },
  nodes: [
    {
      id: 'ipe-1',
      type: 'network',
      x: 80,
      y: 200,
      name: 'AT&T Core - Dallas',
      icon: Globe,
      status: 'inactive',
      config: {
        networkType: 'at&t core',
        city: 'Dallas',
        state: 'TX',
      }
    },
    {
      id: 'internet-1',
      type: 'network',
      x: 80,
      y: 400,
      name: 'Internet',
      icon: Network,
      status: 'inactive',
      config: {
        networkType: 'internet',
      }
    },
    {
      id: 'sdwan-1',
      type: 'function',
      functionType: 'SDWAN',
      x: 240,
      y: 200,
      name: 'SD-WAN Edge',
      icon: PanelRight,
      status: 'inactive',
      config: {
        sdwanRole: 'edge',
        tunnelProtocol: 'ipsec',
        appSteering: 'dynamic',
      }
    },
    {
      id: 'fw-1',
      type: 'function',
      functionType: 'Firewall',
      x: 240,
      y: 400,
      name: 'Firewall',
      icon: Shield,
      status: 'inactive',
      config: {
        firewallType: 'ngfw',
        inspectionLevel: 'deep',
        deploymentMode: 'inline',
      }
    },
    {
      id: 'cr-1',
      type: 'function',
      functionType: 'Router',
      x: 420,
      y: 300,
      name: 'Gateway',
      icon: Router,
      status: 'inactive',
      config: {
        routerType: 'cloud',
        routingProtocol: 'bgp',
        fastReroute: true,
        bfd: true,
      }
    },
    {
      id: 'aws-1',
      type: 'destination',
      cloudProvider: 'AWS',
      x: 600,
      y: 220,
      name: 'AWS',
      icon: Cloud,
      status: 'inactive',
      config: {
        provider: 'AWS',
        region: 'us-east-1',
      }
    },
    {
      id: 'azure-1',
      type: 'destination',
      cloudProvider: 'Azure',
      x: 600,
      y: 380,
      name: 'Azure',
      icon: Cloud,
      status: 'inactive',
      config: {
        provider: 'Azure',
        region: 'East US',
      }
    }
  ],
  edges: [
    {
      id: 'edge-ipe-sdwan',
      source: 'ipe-1',
      target: 'sdwan-1',
      type: 'MPLS',
      bandwidth: '1 Gbps',
      status: 'inactive',
      config: { resilience: 'redundant' }
    },
    {
      id: 'edge-internet-sdwan',
      source: 'internet-1',
      target: 'sdwan-1',
      type: 'Internet',
      bandwidth: '1 Gbps',
      status: 'inactive',
    },
    {
      id: 'edge-sdwan-cr',
      source: 'sdwan-1',
      target: 'cr-1',
      type: 'VPN',
      bandwidth: '1 Gbps',
      status: 'inactive',
    },
    {
      id: 'edge-ipe-fw',
      source: 'ipe-1',
      target: 'fw-1',
      type: 'Ethernet',
      bandwidth: '10 Gbps',
      status: 'inactive',
    },
    {
      id: 'edge-fw-cr',
      source: 'fw-1',
      target: 'cr-1',
      type: 'Ethernet',
      bandwidth: '10 Gbps',
      status: 'inactive',
    },
    {
      id: 'edge-cr-aws',
      source: 'cr-1',
      target: 'aws-1',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'redundant' }
    },
    {
      id: 'edge-cr-azure',
      source: 'cr-1',
      target: 'azure-1',
      type: 'ExpressRoute',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'redundant' }
    }
  ]
};
