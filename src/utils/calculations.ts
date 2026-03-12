import { NetworkNode, NetworkEdge } from '../types';

export function calculateTotalBandwidth(edges: NetworkEdge[]): string {
  const totalGbps = edges.reduce((total, edge) => {
    const bandwidthStr = edge.bandwidth;
    const match = bandwidthStr.match(/(\d+)\s*(\w+)/);
    
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      
      if (unit.toLowerCase().includes('gbps') || unit.toLowerCase().includes('g')) {
        return total + value;
      } else if (unit.toLowerCase().includes('mbps') || unit.toLowerCase().includes('m')) {
        return total + (value / 1000);
      }
    }
    
    return total;
  }, 0);
  
  if (totalGbps >= 1000) {
    return `${(totalGbps / 1000).toFixed(2)} Tbps`;
  } else {
    return `${totalGbps} Gbps`;
  }
}

export function calculateNetworkScores(nodes: NetworkNode[], edges: NetworkEdge[]) {
  // Calculate resiliency score
  let resiliencyScore = 0;
  const totalNodes = nodes.length;
  
  // Check for resiliency features in nodes
  const nodesWithResiliency = nodes.filter(node => 
    node.config?.fastReroute || 
    node.config?.bfd || 
    (node.type === 'function' && node.functionType === 'Router')
  ).length;
  
  // Check for resiliency in edges
  const edgesWithResiliency = edges.filter(edge => 
    edge.config?.resilience === 'ha' || 
    edge.config?.bfd || 
    edge.config?.fastConvergence
  ).length;
  
  // Calculate scores
  const nodeResiliencyRatio = totalNodes > 0 ? nodesWithResiliency / totalNodes : 0;
  const edgeResiliencyRatio = edges.length > 0 ? edgesWithResiliency / edges.length : 0;
  
  resiliencyScore = Math.round((nodeResiliencyRatio * 0.4 + edgeResiliencyRatio * 0.6) * 100);
  
  // Calculate redundancy score
  let redundancyScore = 0;
  
  // Check for redundant paths to destinations
  const destinationNodes = nodes.filter(node => node.type === 'destination');
  let totalRedundantPaths = 0;
  
  destinationNodes.forEach(dest => {
    const pathsToDestination = edges.filter(edge => edge.target === dest.id).length;
    totalRedundantPaths += pathsToDestination > 1 ? pathsToDestination : 0;
  });
  
  // Calculate redundancy based on paths and redundant connections
  const redundantEdges = edges.filter(edge => 
    edge.config?.resilience === 'redundant' || 
    edge.config?.resilience === 'ha' || 
    edge.config?.resilience === 'dualdiverse'
  ).length;
  
  redundancyScore = Math.round(
    (totalRedundantPaths > 0 ? Math.min(100, totalRedundantPaths * 20) : 0) * 0.7 + 
    (edges.length > 0 ? (redundantEdges / edges.length) * 100 : 0) * 0.3
  );
  
  // Calculate disaster recovery score
  let disasterScore = 0;
  
  // Check for multi-region deployment
  const uniqueRegions = new Set();
  nodes.forEach(node => {
    if (node.config?.region) {
      uniqueRegions.add(node.config.region);
    }
  });
  
  // Check for replication links
  const replicationLinks = edges.filter(edge => edge.config?.replication).length;
  
  disasterScore = Math.round(
    (uniqueRegions.size > 1 ? Math.min(100, uniqueRegions.size * 30) : 0) * 0.6 +
    (replicationLinks > 0 ? Math.min(100, replicationLinks * 25) : 0) * 0.4
  );
  
  // Security score - based on actual topology features
  let securityScore = 0;
  const hasFirewall = nodes.some(n => n.type === 'function' && n.functionType === 'Firewall');
  if (hasFirewall) securityScore += 20;

  const encryptedEdges = edges.filter(e => e.config?.encrypted);
  if (edges.length > 0 && encryptedEdges.length === edges.length) securityScore += 20;
  else if (encryptedEdges.length > 0) securityScore += 10;

  const nodesWithCompliance = nodes.filter(n => n.config?.complianceLevel && n.config.complianceLevel !== 'standard');
  if (nodesWithCompliance.length > 0) securityScore += 20;

  const nodesWithACL = nodes.filter(n => n.config?.accessControl && n.config.accessControl !== 'public');
  if (totalNodes > 0 && nodesWithACL.length === totalNodes) securityScore += 20;
  else if (nodesWithACL.length > 0) securityScore += 10;

  const hasSegmentation = nodes.some(n => n.config?.vlanId !== undefined) || edges.some(e => e.vlan !== undefined);
  if (hasSegmentation) securityScore += 20;

  // Performance score - based on bandwidth, latency, QoS
  let performanceScore = 0;

  // Weakest link bandwidth
  if (edges.length > 0) {
    const bandwidths = edges.map(e => {
      const match = e.bandwidth?.match(/(\d+)\s*(\w+)/);
      if (!match) return 0;
      const val = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit.includes('g') ? val : val / 1000;
    });
    const minBw = Math.min(...bandwidths);
    if (minBw >= 10) performanceScore += 30;
    else if (minBw >= 1) performanceScore += 20;
    else if (minBw > 0) performanceScore += 10;
  }

  // QoS coverage
  const edgesWithQoS = edges.filter(e => e.config?.qosProfile && e.config.qosProfile !== 'besteffort');
  if (edges.length > 0 && edgesWithQoS.length === edges.length) performanceScore += 35;
  else if (edgesWithQoS.length > 0) performanceScore += 15;

  // Fast convergence / BFD
  const fastEdges = edges.filter(e => e.config?.fastConvergence || e.config?.bfd);
  if (fastEdges.length > 0) performanceScore += 20;

  // Geographic diversity (more regions = better disaster but also shows performance investment)
  if (uniqueRegions.size >= 2) performanceScore += 15;
  else if (uniqueRegions.size === 1) performanceScore += 5;
  
  return {
    resiliency: resiliencyScore,
    redundancy: redundancyScore,
    disaster: disasterScore,
    security: securityScore,
    performance: performanceScore
  };
}

export function getUniqueNetworkTypes(nodes: NetworkNode[]): string[] {
  return Array.from(new Set(
    nodes
      .filter(node => node.type === 'network' || node.type === 'function')
      .map(node => {
        if (node.type === 'function') {
          return node.functionType || 'Function';
        }
        return node.config?.networkType || 'Network';
      })
  ));
}

export function getCloudProviders(nodes: NetworkNode[]): string[] {
  return Array.from(new Set(
    nodes
      .filter(node => node.type === 'destination')
      .map(node => node.config?.provider)
      .filter((provider): provider is string => provider !== undefined)
  ));
}

export function checkForRedundancy(nodes: NetworkNode[], edges: NetworkEdge[]): boolean {
  const cloudNodes = nodes.filter(node => node.type === 'destination');
  const pathsToCloud = cloudNodes.map(node => {
    return edges.filter(edge => edge.target === node.id);
  });
  
  return pathsToCloud.some(paths => paths.length > 1);
}