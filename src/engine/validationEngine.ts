// Real-time topology validation engine
// Runs on every topology change, returns categorized issues

import { NetworkNode, NetworkEdge } from '../types';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

function isGateway(node: NetworkNode): boolean {
  return node.type === 'function' &&
    (node.functionType === 'Router' || node.functionType === 'Gateway') &&
    (node.config?.routerType === 'cloud' || /gateway|cloud router/.test(node.name?.toLowerCase() ?? ''));
}

function isIPE(node: NetworkNode): boolean {
  return node.type === 'network' &&
    (node.config?.networkType === 'at&t core' || (node.config?.networkType as string) === 'AT&T Core');
}

function getConnectedEdges(nodeId: string, edges: NetworkEdge[]): NetworkEdge[] {
  return edges.filter(e => e.source === nodeId || e.target === nodeId);
}

function getNeighborIds(nodeId: string, edges: NetworkEdge[]): string[] {
  return edges
    .filter(e => e.source === nodeId || e.target === nodeId)
    .map(e => e.source === nodeId ? e.target : e.source);
}

export function validateTopology(nodes: NetworkNode[], edges: NetworkEdge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (nodes.length === 0) return issues;

  const gateways = nodes.filter(isGateway);
  const ipeNodes = nodes.filter(isIPE);
  const destinations = nodes.filter(n => n.type === 'destination');
  const datacenters = nodes.filter(n => n.type === 'datacenter');
  const firewalls = nodes.filter(n => n.type === 'function' && n.functionType === 'Firewall');

  // --- ERRORS ---

  // Orphan nodes (no connections)
  nodes.forEach(node => {
    const connected = getConnectedEdges(node.id, edges);
    if (connected.length === 0 && nodes.length > 1) {
      issues.push({
        id: `orphan-${node.id}`,
        severity: 'error',
        message: `${node.name} has no connections`,
        nodeId: node.id,
      });
    }
  });

  // Cloud destination with no path to a Gateway
  destinations.forEach(dest => {
    const neighbors = getNeighborIds(dest.id, edges);
    const hasRouterPath = neighbors.some(nid => {
      const neighbor = nodes.find(n => n.id === nid);
      return neighbor && isGateway(neighbor);
    });
    if (!hasRouterPath && getConnectedEdges(dest.id, edges).length > 0) {
      issues.push({
        id: `dest-no-router-${dest.id}`,
        severity: 'error',
        message: `${dest.name} is not connected to a Gateway`,
        nodeId: dest.id,
      });
    }
  });

  // Gateway with no connection to AT&T Core (IPE)
  gateways.forEach(cr => {
    const neighbors = getNeighborIds(cr.id, edges);
    const hasIPE = neighbors.some(nid => {
      const neighbor = nodes.find(n => n.id === nid);
      return neighbor && isIPE(neighbor);
    });
    if (!hasIPE && getConnectedEdges(cr.id, edges).length > 0) {
      issues.push({
        id: `cr-no-ipe-${cr.id}`,
        severity: 'error',
        message: `${cr.name} is not connected to AT&T Core (IPE)`,
        nodeId: cr.id,
      });
    }
  });

  // Datacenter directly connected to cloud destination (no router in between)
  datacenters.forEach(dc => {
    const neighbors = getNeighborIds(dc.id, edges);
    neighbors.forEach(nid => {
      const neighbor = nodes.find(n => n.id === nid);
      if (neighbor && neighbor.type === 'destination') {
        issues.push({
          id: `dc-direct-cloud-${dc.id}-${nid}`,
          severity: 'error',
          message: `${dc.name} is directly connected to ${neighbor.name} - route through a Gateway`,
          nodeId: dc.id,
        });
      }
    });
  });

  // --- WARNINGS ---

  // Single point of failure: destination with only one path
  destinations.forEach(dest => {
    const connected = getConnectedEdges(dest.id, edges);
    if (connected.length === 1) {
      issues.push({
        id: `spof-dest-${dest.id}`,
        severity: 'warning',
        message: `${dest.name} has a single point of failure - only one connection`,
        nodeId: dest.id,
      });
    }
  });

  // No redundancy on critical links (Gateway to IPE)
  gateways.forEach(cr => {
    const ipeEdges = edges.filter(e => {
      const otherId = e.source === cr.id ? e.target : (e.target === cr.id ? e.source : null);
      if (!otherId) return false;
      const other = nodes.find(n => n.id === otherId);
      return other && isIPE(other);
    });
    if (ipeEdges.length === 1 && ipeEdges[0].config?.resilience !== 'redundant' && ipeEdges[0].config?.resilience !== 'ha' && ipeEdges[0].config?.resilience !== 'dualdiverse') {
      issues.push({
        id: `no-redundancy-cr-ipe-${cr.id}`,
        severity: 'warning',
        message: `${cr.name} to AT&T Core link has no redundancy configured`,
        nodeId: cr.id,
      });
    }
  });

  // Missing firewall between IPE and cloud
  if (ipeNodes.length > 0 && destinations.length > 0 && firewalls.length === 0) {
    issues.push({
      id: 'no-firewall',
      severity: 'warning',
      message: 'No firewall in topology - consider adding one for security inspection',
    });
  }

  // --- INFO ---

  // Suggest dual-diverse if multiple cloud destinations
  if (destinations.length >= 2 && gateways.length === 1) {
    issues.push({
      id: 'suggest-dual-router',
      severity: 'info',
      message: 'Multiple cloud destinations with a single Gateway - consider adding a second for resilience',
    });
  }

  // Suggest SD-WAN overlay when multiple transport types exist
  const transportTypes = new Set(edges.map(e => e.type));
  const hasSDWAN = nodes.some(n => n.type === 'function' && n.functionType === 'SDWAN');
  if (transportTypes.size >= 2 && !hasSDWAN && edges.length >= 3) {
    issues.push({
      id: 'suggest-sdwan',
      severity: 'info',
      message: 'Multiple transport types detected - SD-WAN overlay could optimize traffic steering',
    });
  }

  return issues;
}
