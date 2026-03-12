import { Router, Cloud, Globe, Shield } from 'lucide-react';
import { Template } from './types';

export const dualDiverseHATemplate: Template = {
  name: 'Dual-Diverse HA',
  description: 'Dual IPE sites, dual Cloud Routers, dual-diverse paths with BFD fast reroute',
  preview: {
    icons: [
      { type: 'col', icons: [
        { icon: Globe, color: 'text-orange-400' },
        { icon: Globe, color: 'text-orange-400' }
      ]},
      { type: 'col', icons: [
        { icon: Shield, color: 'text-red-400' },
        { icon: Shield, color: 'text-red-400' }
      ]},
      { type: 'col', icons: [
        { icon: Router, color: 'text-purple-400' },
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
      id: 'ipe-dallas',
      type: 'network',
      x: 60,
      y: 180,
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
      id: 'ipe-chicago',
      type: 'network',
      x: 60,
      y: 420,
      name: 'AT&T Core - Chicago',
      icon: Globe,
      status: 'inactive',
      config: {
        networkType: 'at&t core',
        city: 'Chicago',
        state: 'IL',
      }
    },
    {
      id: 'fw-primary',
      type: 'function',
      functionType: 'Firewall',
      x: 210,
      y: 180,
      name: 'Firewall Primary',
      icon: Shield,
      status: 'inactive',
      config: {
        firewallType: 'ngfw',
        inspectionLevel: 'deep',
        highAvailability: true,
      }
    },
    {
      id: 'fw-secondary',
      type: 'function',
      functionType: 'Firewall',
      x: 210,
      y: 420,
      name: 'Firewall Secondary',
      icon: Shield,
      status: 'inactive',
      config: {
        firewallType: 'ngfw',
        inspectionLevel: 'deep',
        highAvailability: true,
      }
    },
    {
      id: 'cr-primary',
      type: 'function',
      functionType: 'Router',
      x: 380,
      y: 220,
      name: 'Cloud Router Primary',
      icon: Router,
      status: 'inactive',
      config: {
        routerType: 'cloud',
        routingProtocol: 'bgp',
        asn: 7018,
        fastReroute: true,
        bfd: true,
      }
    },
    {
      id: 'cr-secondary',
      type: 'function',
      functionType: 'Router',
      x: 380,
      y: 380,
      name: 'Cloud Router Secondary',
      icon: Router,
      status: 'inactive',
      config: {
        routerType: 'cloud',
        routingProtocol: 'bgp',
        asn: 7018,
        fastReroute: true,
        bfd: true,
      }
    },
    {
      id: 'aws-1',
      type: 'destination',
      cloudProvider: 'AWS',
      x: 560,
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
      x: 560,
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
    // Dallas IPE to both CRs
    {
      id: 'edge-dallas-fw1',
      source: 'ipe-dallas',
      target: 'fw-primary',
      type: 'Ethernet',
      bandwidth: '10 Gbps',
      status: 'inactive',
    },
    {
      id: 'edge-fw1-cr1',
      source: 'fw-primary',
      target: 'cr-primary',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'dualdiverse', bfd: true }
    },
    {
      id: 'edge-dallas-cr2',
      source: 'ipe-dallas',
      target: 'cr-secondary',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'dualdiverse', bfd: true }
    },
    // Chicago IPE to both CRs
    {
      id: 'edge-chicago-fw2',
      source: 'ipe-chicago',
      target: 'fw-secondary',
      type: 'Ethernet',
      bandwidth: '10 Gbps',
      status: 'inactive',
    },
    {
      id: 'edge-fw2-cr2',
      source: 'fw-secondary',
      target: 'cr-secondary',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'dualdiverse', bfd: true }
    },
    {
      id: 'edge-chicago-cr1',
      source: 'ipe-chicago',
      target: 'cr-primary',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'dualdiverse', bfd: true }
    },
    // Cross-connect between Cloud Routers
    {
      id: 'edge-cr-cross',
      source: 'cr-primary',
      target: 'cr-secondary',
      type: 'Ethernet',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'ha', bfd: true }
    },
    // Both CRs to AWS
    {
      id: 'edge-cr1-aws',
      source: 'cr-primary',
      target: 'aws-1',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'redundant' }
    },
    {
      id: 'edge-cr2-aws',
      source: 'cr-secondary',
      target: 'aws-1',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'redundant' }
    },
    // Both CRs to Azure
    {
      id: 'edge-cr1-azure',
      source: 'cr-primary',
      target: 'azure-1',
      type: 'ExpressRoute',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'redundant' }
    },
    {
      id: 'edge-cr2-azure',
      source: 'cr-secondary',
      target: 'azure-1',
      type: 'ExpressRoute',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: { resilience: 'redundant' }
    }
  ]
};
