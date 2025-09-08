import { NetworkNode, NetworkEdge } from '../../../types';

export interface Location {
  id: string;
  name: string;
  location: string;
  coordinates: { x: number; y: number };
  connections: string[];
  type: 'primary' | 'secondary' | 'cloud' | 'network';
  nodeType: string;
  provider?: string;
}

export function extractLocations(nodes: NetworkNode[], edges: NetworkEdge[]): Location[] {
  return nodes
    .filter(node => 
      node.type === 'datacenter' || 
      node.type === 'destination' || 
      node.type === 'function' ||
      node.type === 'network'
    )
    .map(node => {
      // Extract the connections to this node
      const connections = edges
        .filter(edge => edge.source === node.id || edge.target === node.id)
        .map(edge => edge.source === node.id ? edge.target : edge.source);
      
      // Generate positions based on node type for a more organized layout
      let x, y;
      
      if (node.config?.globalX && node.config?.globalY) {
        // Use saved coordinates if available
        x = node.config.globalX;
        y = node.config.globalY;
      } else {
        // Calculate position based on node type
        const centerX = 400;
        const centerY = 300;
        const radius = 250;
        
        if (node.type === 'destination') {
          // Place clouds in the top region
          const angle = (nodes.indexOf(node) * 30) * (Math.PI / 180);
          x = centerX + Math.cos(angle) * (radius * 0.8);
          y = centerY - 100 + Math.sin(angle) * (radius * 0.5);
        } else if (node.type === 'datacenter') {
          // Place datacenters in the bottom region
          const angle = (180 + nodes.indexOf(node) * 40) * (Math.PI / 180);
          x = centerX + Math.cos(angle) * (radius * 0.7);
          y = centerY + 100 + Math.sin(angle) * (radius * 0.5);
        } else if (node.type === 'network') {
          // Place networks on the left
          const angle = (270 + nodes.indexOf(node) * 45) * (Math.PI / 180);
          x = centerX - 150 + Math.cos(angle) * (radius * 0.6);
          y = centerY + Math.sin(angle) * (radius * 0.6);
        } else {
          // Functions (routers, etc.) on the right
          const angle = (90 + nodes.indexOf(node) * 45) * (Math.PI / 180);
          x = centerX + 150 + Math.cos(angle) * (radius * 0.6);
          y = centerY + Math.sin(angle) * (radius * 0.6);
        }
      }
      
      // Determine type for visual styling
      let locationType: Location['type'] = 'secondary';
      if (node.type === 'destination') {
        locationType = 'cloud';
      } else if (node.type === 'network') {
        locationType = 'network';
      } else if (node.status === 'active') {
        locationType = 'primary';
      }
      
      return {
        id: node.id,
        name: node.name,
        location: node.config?.location || node.config?.region || 
                 (node.type === 'function' && node.functionType) || 
                 node.type,
        coordinates: { x, y },
        connections,
        type: locationType,
        nodeType: node.type,
        provider: node.config?.provider
      };
    });
}