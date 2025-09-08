import { Router, Cloud, Network, Globe } from 'lucide-react';
import { Template } from './types';

export const cloudToCloudLocalTemplate: Template = {
  name: 'Cloud to Cloud - Local',
  description: 'AT&T Core through Cloud Router to multiple cloud providers',
  preview: {
    icons: [
      { type: 'col', icons: [
        { icon: Globe, color: 'text-orange-400' }
      ]},
      { type: 'col', icons: [
        { icon: Router, color: 'text-purple-400' }
      ]},
      { type: 'col', icons: [
        { icon: Cloud, color: 'text-blue-400' },
        { icon: Cloud, color: 'text-blue-400' }
      ]}
    ]
  },
  nodes: [
    {
      id: 'att-core-1',
      type: 'network',
      x: 100,
      y: 200,
      name: 'AT&T Core',
      icon: Globe,
      status: 'inactive',
      config: {
        networkType: 'at&t core',
        provider: 'AT&T'
      }
    },
    {
      id: 'cloud-router-1',
      type: 'function',
      functionType: 'Router',
      x: 250,
      y: 200,
      name: 'Cloud Router',
      icon: Router,
      status: 'inactive',
      config: {
        routerType: 'cloud',
        asn: 65000,
        capacity: '10Gbps'
      }
    },
    {
      id: 'aws-cloud-1',
      type: 'destination',
      x: 400,
      y: 150,
      name: 'AWS Cloud',
      icon: Cloud,
      status: 'inactive',
      config: {
        provider: 'AWS',
        region: 'us-east-1'
      }
    },
    {
      id: 'azure-cloud-1',
      type: 'destination',
      x: 400,
      y: 250,
      name: 'Azure Cloud',
      icon: Cloud,
      status: 'inactive',
      config: {
        provider: 'Azure',
        region: 'eastus'
      }
    }
  ],
  edges: [
    {
      id: 'att-to-router',
      source: 'att-core-1',
      target: 'cloud-router-1',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'standard'
      }
    },
    {
      id: 'router-to-aws',
      source: 'cloud-router-1',
      target: 'aws-cloud-1',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'standard'
      }
    },
    {
      id: 'router-to-azure',
      source: 'cloud-router-1',
      target: 'azure-cloud-1',
      type: 'ExpressRoute',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'standard'
      }
    }
  ]
};