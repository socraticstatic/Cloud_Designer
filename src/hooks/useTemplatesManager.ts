import { useState } from 'react';
import { NetworkNode, NetworkEdge } from '../types';

export function useTemplatesManager() {
  const [showTemplatesDrawer, setShowTemplatesDrawer] = useState(false);
  
  const openTemplatesDrawer = () => setShowTemplatesDrawer(true);
  const closeTemplatesDrawer = () => setShowTemplatesDrawer(false);
  
  // Function to create unique IDs when applying a template
  const applyTemplateWithUniqueIds = (
    templateNodes: NetworkNode[],
    templateEdges: NetworkEdge[]
  ): { nodes: NetworkNode[], edges: NetworkEdge[] } => {
    const timestamp = Date.now();
    const idMap = new Map<string, string>();
    
    // Create new nodes with unique IDs
    const newNodes = templateNodes.map(node => {
      const newId = `${node.id}-${timestamp}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId
      };
    });
    
    // Create new edges with updated references
    const newEdges = templateEdges.map(edge => {
      return {
        ...edge,
        id: `${edge.id}-${timestamp}`,
        source: idMap.get(edge.source) || edge.source,
        target: idMap.get(edge.target) || edge.target
      };
    });
    
    return { nodes: newNodes, edges: newEdges };
  };

  return {
    showTemplatesDrawer,
    openTemplatesDrawer,
    closeTemplatesDrawer,
    applyTemplateWithUniqueIds
  };
}