// Hero demo topology for AT&T Leadership demo
// Dallas HQ + Chicago DR, dual-diverse AVPN, NetBond to AWS + Azure,
// FlexWare with SD-WAN + Firewall at each site, all configured and geo-tagged

import { NetworkNode, NetworkEdge } from '../types';
import { Globe, Router, Cloud, Shield, Network, PanelRight, Server } from 'lucide-react';

export const demoNodes: NetworkNode[] = [
  // Dallas HQ - IPE
  {
    id: 'demo-ipe-dallas',
    type: 'network',
    x: 60,
    y: 200,
    name: 'AT&T Core - Dallas',
    icon: Globe,
    status: 'active',
    config: {
      networkType: 'at&t core',
      provider: 'AT&T',
      city: 'Dallas',
      state: 'TX',
      country: 'US',
      latitude: 32.7767,
      longitude: -96.7970,
      facilityCode: 'DA1',
    },
  },
  // Chicago DR - IPE
  {
    id: 'demo-ipe-chicago',
    type: 'network',
    x: 60,
    y: 460,
    name: 'AT&T Core - Chicago',
    icon: Globe,
    status: 'active',
    config: {
      networkType: 'at&t core',
      provider: 'AT&T',
      city: 'Chicago',
      state: 'IL',
      country: 'US',
      latitude: 41.8781,
      longitude: -87.6298,
      facilityCode: 'CH1',
    },
  },
  // Dallas FlexWare (SD-WAN + Firewall VNFs)
  {
    id: 'demo-flexware-dallas',
    type: 'function',
    functionType: 'FlexWare',
    x: 200,
    y: 140,
    name: 'FlexWare - Dallas',
    icon: Server,
    status: 'active',
    config: {
      city: 'Dallas',
      latitude: 32.7767,
      longitude: -96.7970,
    },
  },
  // Chicago FlexWare
  {
    id: 'demo-flexware-chicago',
    type: 'function',
    functionType: 'FlexWare',
    x: 200,
    y: 520,
    name: 'FlexWare - Chicago',
    icon: Server,
    status: 'active',
    config: {
      city: 'Chicago',
      latitude: 41.8781,
      longitude: -87.6298,
    },
  },
  // Dallas Firewall
  {
    id: 'demo-fw-dallas',
    type: 'function',
    functionType: 'Firewall',
    x: 200,
    y: 260,
    name: 'Firewall - Dallas',
    icon: Shield,
    status: 'active',
    config: {
      firewallType: 'ngfw',
      inspectionLevel: 'deep',
      deploymentMode: 'inline',
      highAvailability: true,
    },
  },
  // Chicago Firewall
  {
    id: 'demo-fw-chicago',
    type: 'function',
    functionType: 'Firewall',
    x: 200,
    y: 400,
    name: 'Firewall - Chicago',
    icon: Shield,
    status: 'active',
    config: {
      firewallType: 'ngfw',
      inspectionLevel: 'deep',
      deploymentMode: 'inline',
      highAvailability: true,
    },
  },
  // Cloud Router Primary (Dallas)
  {
    id: 'demo-cr-primary',
    type: 'function',
    functionType: 'Router',
    x: 380,
    y: 240,
    name: 'Cloud Router Primary',
    icon: Router,
    status: 'active',
    config: {
      routerType: 'cloud',
      routingProtocol: 'bgp',
      asn: 7018,
      fastReroute: true,
      bfd: true,
      city: 'Dallas',
      latitude: 32.7767,
      longitude: -96.7970,
    },
  },
  // Cloud Router Secondary (Chicago)
  {
    id: 'demo-cr-secondary',
    type: 'function',
    functionType: 'Router',
    x: 380,
    y: 420,
    name: 'Cloud Router Secondary',
    icon: Router,
    status: 'active',
    config: {
      routerType: 'cloud',
      routingProtocol: 'bgp',
      asn: 7018,
      fastReroute: true,
      bfd: true,
      city: 'Chicago',
      latitude: 41.8781,
      longitude: -87.6298,
    },
  },
  // AWS us-east-1
  {
    id: 'demo-aws',
    type: 'destination',
    cloudProvider: 'AWS',
    x: 560,
    y: 220,
    name: 'AWS us-east-1',
    icon: Cloud,
    status: 'active',
    config: {
      provider: 'AWS',
      region: 'us-east-1',
      complianceLevel: 'hipaa',
      accessControl: 'private',
      latitude: 39.0438,
      longitude: -77.4874,
      city: 'Ashburn',
      state: 'VA',
    },
  },
  // Azure East US
  {
    id: 'demo-azure',
    type: 'destination',
    cloudProvider: 'Azure',
    x: 560,
    y: 440,
    name: 'Azure East US',
    icon: Cloud,
    status: 'active',
    config: {
      provider: 'Azure',
      region: 'East US',
      complianceLevel: 'pci',
      accessControl: 'private',
      latitude: 37.3719,
      longitude: -79.8164,
      city: 'Boydton',
      state: 'VA',
    },
  },
  // Equinix DA1 Datacenter
  {
    id: 'demo-dc-equinix',
    type: 'datacenter',
    x: 560,
    y: 330,
    name: 'Equinix DA1',
    icon: Server,
    status: 'active',
    config: {
      provider: 'Equinix',
      physicalSecurity: true,
      dcCompliance: 'soc2',
      city: 'Dallas',
      state: 'TX',
      latitude: 32.7767,
      longitude: -96.7970,
      facilityCode: 'DA1',
    },
  },
];

export const demoEdges: NetworkEdge[] = [
  // Dallas IPE to FlexWare
  {
    id: 'demo-edge-dal-flex',
    source: 'demo-ipe-dallas',
    target: 'demo-flexware-dallas',
    type: 'MPLS',
    bandwidth: '1 Gbps',
    status: 'active',
    config: { resilience: 'redundant' },
  },
  // Dallas IPE to Firewall
  {
    id: 'demo-edge-dal-fw',
    source: 'demo-ipe-dallas',
    target: 'demo-fw-dallas',
    type: 'Ethernet',
    bandwidth: '10 Gbps',
    status: 'active',
  },
  // Chicago IPE to FlexWare
  {
    id: 'demo-edge-chi-flex',
    source: 'demo-ipe-chicago',
    target: 'demo-flexware-chicago',
    type: 'MPLS',
    bandwidth: '1 Gbps',
    status: 'active',
    config: { resilience: 'redundant' },
  },
  // Chicago IPE to Firewall
  {
    id: 'demo-edge-chi-fw',
    source: 'demo-ipe-chicago',
    target: 'demo-fw-chicago',
    type: 'Ethernet',
    bandwidth: '10 Gbps',
    status: 'active',
  },
  // Dallas Firewall to Primary CR
  {
    id: 'demo-edge-fw-dal-cr1',
    source: 'demo-fw-dallas',
    target: 'demo-cr-primary',
    type: 'Ethernet',
    bandwidth: '10 Gbps',
    status: 'active',
  },
  // Chicago Firewall to Secondary CR
  {
    id: 'demo-edge-fw-chi-cr2',
    source: 'demo-fw-chicago',
    target: 'demo-cr-secondary',
    type: 'Ethernet',
    bandwidth: '10 Gbps',
    status: 'active',
  },
  // Dual-diverse: Dallas IPE to Secondary CR
  {
    id: 'demo-edge-dal-cr2',
    source: 'demo-ipe-dallas',
    target: 'demo-cr-secondary',
    type: 'MPLS',
    bandwidth: '10 Gbps',
    status: 'active',
    config: { resilience: 'dualdiverse', bfd: true },
  },
  // Dual-diverse: Chicago IPE to Primary CR
  {
    id: 'demo-edge-chi-cr1',
    source: 'demo-ipe-chicago',
    target: 'demo-cr-primary',
    type: 'MPLS',
    bandwidth: '10 Gbps',
    status: 'active',
    config: { resilience: 'dualdiverse', bfd: true },
  },
  // CR cross-connect
  {
    id: 'demo-edge-cr-cross',
    source: 'demo-cr-primary',
    target: 'demo-cr-secondary',
    type: 'Ethernet',
    bandwidth: '10 Gbps',
    status: 'active',
    config: { resilience: 'ha', bfd: true },
  },
  // Primary CR to AWS (NetBond Direct Connect)
  {
    id: 'demo-edge-cr1-aws',
    source: 'demo-cr-primary',
    target: 'demo-aws',
    type: 'Direct Connect',
    bandwidth: '10 Gbps',
    status: 'active',
    config: { resilience: 'redundant', encrypted: true },
  },
  // Secondary CR to AWS (redundant path)
  {
    id: 'demo-edge-cr2-aws',
    source: 'demo-cr-secondary',
    target: 'demo-aws',
    type: 'Direct Connect',
    bandwidth: '10 Gbps',
    status: 'active',
    config: { resilience: 'redundant', encrypted: true },
  },
  // Primary CR to Azure (NetBond ExpressRoute)
  {
    id: 'demo-edge-cr1-azure',
    source: 'demo-cr-primary',
    target: 'demo-azure',
    type: 'ExpressRoute',
    bandwidth: '10 Gbps',
    status: 'active',
    config: { resilience: 'redundant', encrypted: true },
  },
  // Secondary CR to Azure (redundant path)
  {
    id: 'demo-edge-cr2-azure',
    source: 'demo-cr-secondary',
    target: 'demo-azure',
    type: 'ExpressRoute',
    bandwidth: '10 Gbps',
    status: 'active',
    config: { resilience: 'redundant', encrypted: true },
  },
  // Primary CR to Equinix datacenter
  {
    id: 'demo-edge-cr1-dc',
    source: 'demo-cr-primary',
    target: 'demo-dc-equinix',
    type: 'Ethernet',
    bandwidth: '10 Gbps',
    status: 'active',
  },
];
