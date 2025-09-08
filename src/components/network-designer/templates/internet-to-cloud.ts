import { Network, Router, Cloud, Globe } from 'lucide-react';
import { Template } from './types';

export const internetToCloudTemplate: Template = {
  name: 'Internet to Cloud',
  description: 'AT&T Core through Cloud Router to cloud services',
  preview: {
    icons: [
      { type: 'col', icons: [
        { icon: Globe, color: 'text-orange-400' }
      ]},
      { type: 'col', icons: [
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
      x: 300,
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
      x: 500,
      y: 200,
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
      id: 'router-to-cloud',
      source: 'cloud-router-1',
      target: 'aws-cloud-1',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'standard'
      }
    }
  ]
};