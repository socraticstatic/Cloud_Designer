import { supabase } from '../lib/supabase';
import { NetworkNode, NetworkEdge } from '../types';

export async function seedSampleTopologies() {
  const topology1Nodes: NetworkNode[] = [
    {
      id: 'att-core-1',
      type: 'network',
      x: 200,
      y: 350,
      name: 'AT&T Core',
      icon: 'Globe' as any,
      status: 'active',
      config: {
        networkType: 'at&t core',
        provider: 'AT&T'
      }
    },
    {
      id: 'cloud-router-1',
      type: 'function',
      functionType: 'Router',
      x: 400,
      y: 350,
      name: 'Primary Gateway',
      icon: 'Cloud' as any,
      status: 'active',
      config: {
        routerType: 'cloud',
        provider: 'Cloud Provider',
        asn: 65000
      }
    },
    {
      id: 'aws-cloud-1',
      type: 'destination',
      x: 600,
      y: 350,
      name: 'AWS us-east-1',
      icon: 'Cloud' as any,
      status: 'active',
      config: {
        provider: 'AWS',
        region: 'us-east-1'
      }
    }
  ];

  const topology1Edges: NetworkEdge[] = [
    {
      id: 'edge-1-1',
      source: 'att-core-1',
      target: 'cloud-router-1',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'active',
      metrics: {
        latency: '2.1ms',
        throughput: '9.8 Gbps',
        packetLoss: '0.01%',
        bandwidthUtilization: 45
      }
    },
    {
      id: 'edge-1-2',
      source: 'cloud-router-1',
      target: 'aws-cloud-1',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'active',
      metrics: {
        latency: '1.5ms',
        throughput: '9.9 Gbps',
        packetLoss: '0.00%',
        bandwidthUtilization: 35
      }
    }
  ];

  const topology2Nodes: NetworkNode[] = [
    {
      id: 'att-core-2',
      type: 'network',
      x: 150,
      y: 350,
      name: 'AT&T Core',
      icon: 'Globe' as any,
      status: 'active',
      config: {
        networkType: 'at&t core',
        provider: 'AT&T'
      }
    },
    {
      id: 'cloud-router-2',
      type: 'function',
      functionType: 'Router',
      x: 350,
      y: 350,
      name: 'Multi-Cloud Router',
      icon: 'Cloud' as any,
      status: 'active',
      config: {
        routerType: 'cloud',
        asn: 65001
      }
    },
    {
      id: 'aws-cloud-2',
      type: 'destination',
      x: 550,
      y: 250,
      name: 'AWS Production',
      icon: 'Cloud' as any,
      status: 'active',
      config: {
        provider: 'AWS',
        region: 'us-east-1'
      }
    },
    {
      id: 'azure-cloud-2',
      type: 'destination',
      x: 550,
      y: 450,
      name: 'Azure Production',
      icon: 'Cloud' as any,
      status: 'active',
      config: {
        provider: 'Azure',
        region: 'eastus'
      }
    }
  ];

  const topology2Edges: NetworkEdge[] = [
    {
      id: 'edge-2-1',
      source: 'att-core-2',
      target: 'cloud-router-2',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'active',
      metrics: {
        latency: '2.3ms',
        throughput: '9.7 Gbps',
        packetLoss: '0.01%',
        bandwidthUtilization: 52
      }
    },
    {
      id: 'edge-2-2',
      source: 'cloud-router-2',
      target: 'aws-cloud-2',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'active',
      metrics: {
        latency: '1.8ms',
        throughput: '9.8 Gbps',
        packetLoss: '0.00%',
        bandwidthUtilization: 41
      }
    },
    {
      id: 'edge-2-3',
      source: 'cloud-router-2',
      target: 'azure-cloud-2',
      type: 'ExpressRoute',
      bandwidth: '10 Gbps',
      status: 'active',
      metrics: {
        latency: '2.0ms',
        throughput: '9.9 Gbps',
        packetLoss: '0.00%',
        bandwidthUtilization: 38
      }
    }
  ];

  const topology3Nodes: NetworkNode[] = [
    {
      id: 'att-core-3',
      type: 'network',
      x: 150,
      y: 350,
      name: 'AT&T Core',
      icon: 'Globe' as any,
      status: 'active',
      config: {
        networkType: 'at&t core',
        provider: 'AT&T'
      }
    },
    {
      id: 'primary-router-3',
      type: 'function',
      functionType: 'Router',
      x: 350,
      y: 250,
      name: 'Primary Router',
      icon: 'Cloud' as any,
      status: 'active',
      config: {
        routerType: 'cloud',
        asn: 65100,
        fastReroute: true,
        bfd: true
      }
    },
    {
      id: 'secondary-router-3',
      type: 'function',
      functionType: 'Router',
      x: 350,
      y: 450,
      name: 'Backup Router',
      icon: 'Cloud' as any,
      status: 'active',
      config: {
        routerType: 'cloud',
        asn: 65101,
        fastReroute: true,
        bfd: true
      }
    },
    {
      id: 'aws-cloud-3',
      type: 'destination',
      x: 550,
      y: 350,
      name: 'AWS Production',
      icon: 'Cloud' as any,
      status: 'active',
      config: {
        provider: 'AWS',
        region: 'us-east-1'
      }
    },
    {
      id: 'firewall-3',
      type: 'function',
      functionType: 'Firewall',
      x: 450,
      y: 350,
      name: 'Security Gateway',
      icon: 'Shield' as any,
      status: 'active',
      config: {
        firewallType: 'ngfw',
        deploymentMode: 'inline',
        dpi: true
      }
    }
  ];

  const topology3Edges: NetworkEdge[] = [
    {
      id: 'edge-3-1',
      source: 'att-core-3',
      target: 'primary-router-3',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'active',
      config: {
        resilience: 'ha',
        bfd: true
      },
      metrics: {
        latency: '2.0ms',
        throughput: '9.8 Gbps',
        packetLoss: '0.00%',
        bandwidthUtilization: 48
      }
    },
    {
      id: 'edge-3-2',
      source: 'att-core-3',
      target: 'secondary-router-3',
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'active',
      config: {
        resilience: 'ha',
        bfd: true
      },
      metrics: {
        latency: '2.1ms',
        throughput: '9.7 Gbps',
        packetLoss: '0.00%',
        bandwidthUtilization: 15
      }
    },
    {
      id: 'edge-3-3',
      source: 'primary-router-3',
      target: 'firewall-3',
      type: 'Ethernet',
      bandwidth: '10 Gbps',
      status: 'active',
      config: {
        resilience: 'ha'
      },
      metrics: {
        latency: '0.5ms',
        throughput: '9.9 Gbps',
        packetLoss: '0.00%',
        bandwidthUtilization: 42
      }
    },
    {
      id: 'edge-3-4',
      source: 'secondary-router-3',
      target: 'firewall-3',
      type: 'Ethernet',
      bandwidth: '10 Gbps',
      status: 'active',
      config: {
        resilience: 'ha'
      },
      metrics: {
        latency: '0.5ms',
        throughput: '0.2 Gbps',
        packetLoss: '0.00%',
        bandwidthUtilization: 2
      }
    },
    {
      id: 'edge-3-5',
      source: 'firewall-3',
      target: 'aws-cloud-3',
      type: 'Direct Connect',
      bandwidth: '10 Gbps',
      status: 'active',
      config: {
        resilience: 'ha',
        encrypted: true
      },
      metrics: {
        latency: '1.2ms',
        throughput: '9.8 Gbps',
        packetLoss: '0.00%',
        bandwidthUtilization: 40
      }
    }
  ];

  try {
    const now = new Date().toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const topologies = [
      {
        name: 'Basic Cloud Connection',
        description: 'Simple setup connecting AT&T Core to AWS cloud through a gateway router',
        nodes: topology1Nodes,
        edges: topology1Edges,
        is_template: false,
        created_at: fiveDaysAgo,
        updated_at: twoDaysAgo,
        last_opened_at: twoDaysAgo
      },
      {
        name: 'Multi-Cloud Architecture',
        description: 'Production environment spanning AWS and Azure with centralized routing',
        nodes: topology2Nodes,
        edges: topology2Edges,
        is_template: false,
        created_at: oneWeekAgo,
        updated_at: fiveDaysAgo,
        last_opened_at: now
      },
      {
        name: 'High-Availability Enterprise',
        description: 'Mission-critical setup with redundant routers and security gateway for maximum uptime',
        nodes: topology3Nodes,
        edges: topology3Edges,
        is_template: false,
        created_at: oneWeekAgo,
        updated_at: now,
        last_opened_at: now
      }
    ];

    for (const topology of topologies) {
      const { error } = await supabase
        .from('network_topologies')
        .insert([topology]);

      if (error) {
        console.error(`Error seeding topology "${topology.name}":`, error);
      } else {
        console.log(`Successfully seeded topology: ${topology.name}`);
      }
    }

    console.log('Sample topologies seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding topologies:', error);
    return false;
  }
}
