import { Server, Router, Cloud, Network, Globe } from 'lucide-react';
import { Template } from './types';

export const highAvailabilityTemplate: Template = {
  name: 'High Availability',
  description: 'AT&T Core with redundant Gateway connectivity for high availability',
  preview: {
    icons: [
      { type: 'col', icons: [
        { icon: Globe, color: 'text-orange-400' }
      ]},
      { type: 'col', icons: [
        { icon: Router, color: 'text-purple-400' },
        { icon: Router, color: 'text-purple-400' }
      ]},
      { type: 'col', icons: [
        { icon: Cloud, color: 'text-blue-400' }
      ]}
    ]
  },
  nodes: [
    {
      id: 'att-core-1',
      type: 'network',
      x: 100,
      y: 225,
      name: 'AT&T Core',
      icon: Globe,
      status: 'inactive',
      config: {
        networkType: 'at&t core',
        provider: 'AT&T',
        city: 'Dallas'
      }
    },
    {
      id: 'primary-gateway',
      type: 'function',
      functionType: 'Router',
      x: 250,
      y: 150,
      name: 'Primary Gateway',
      icon: Router,
      status: 'inactive',
      config: {
        routerType: 'cloud',
        asn: 65000,
        fastReroute: true,
        bfd: true,
        city: 'Ashburn'
      }
    },
    {
      id: 'secondary-gateway',
      type: 'function',
      functionType: 'Router',
      x: 250,
      y: 300,
      name: 'Secondary Gateway',
      icon: Router,
      status: 'inactive',
      config: {
        routerType: 'cloud',
        asn: 65001,
        fastReroute: true,
        bfd: true,
        city: 'Ashburn'
      }
    },
    {
      id: 'aws-cloud-1',
      type: 'destination',
      x: 400,
      y: 225,
      name: 'AWS Cloud',
      icon: Cloud,
      status: 'inactive',
      config: {
        provider: 'AWS',
        region: 'us-east-1'
      }
    }
  ],
  edges: [
    {
      id: 'att-to-primary',
      source: 'att-core-1',
      target: 'primary-gateway',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'ha',
        bfd: true
      }
    },
    {
      id: 'att-to-secondary',
      source: 'att-core-1',
      target: 'secondary-gateway',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'ha',
        bfd: true
      }
    },
    {
      id: 'primary-to-cloud',
      source: 'primary-gateway',
      target: 'aws-cloud-1',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'ha',
        bfd: true
      }
    },
    {
      id: 'secondary-to-cloud',
      source: 'secondary-gateway',
      target: 'aws-cloud-1',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'ha',
        bfd: true
      }
    },
    {
      id: 'router-interconnect',
      source: 'primary-gateway',
      target: 'secondary-gateway',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'ha',
        bfd: true,
        fastConvergence: true
      }
    }
  ]
};