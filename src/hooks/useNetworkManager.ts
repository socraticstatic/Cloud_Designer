import { useState, useEffect } from 'react';
import { NetworkNode, NetworkEdge } from '../types';
import { calculateNetworkScores } from '../utils/calculations';
import { getNodeIcon, getNodeDisplayName } from '../utils/nodeUtils';

export function useNetworkManager(
  saveToHistory: (nodes: NetworkNode[], edges: NetworkEdge[]) => void
) {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  
  // Update network scores whenever nodes or edges change
  const [networkScores, setNetworkScores] = useState({
    resiliency: 0,
    redundancy: 0,
    disaster: 0,
    security: 50,
    performance: 50
  });
  
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const scores = calculateNetworkScores(nodes, edges);
      setNetworkScores(scores);
    }
  }, [nodes, edges]);

  // Create a new node
  const addNode = (type: NetworkNode['type'], functionType?: string, networkType?: string, provider?: string, canvasRef?: React.RefObject<HTMLDivElement>, viewportInfo?: { panOffset: { x: number; y: number }; zoomLevel: number }) => {
    const displayName = getNodeDisplayName(type, functionType, networkType, provider);

    let x = Math.random() * 600 + 100;
    let y = Math.min(Math.random() * 300 + 100, 800 - 64);

    if (canvasRef?.current && viewportInfo) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const centerX = canvasRect.width / 2;
      const centerY = canvasRect.height / 2;

      x = (centerX - viewportInfo.panOffset.x) / viewportInfo.zoomLevel - 32;
      y = (centerY - viewportInfo.panOffset.y) / viewportInfo.zoomLevel - 32;

      x = Math.max(50, Math.min(x, 750));
      y = Math.max(50, Math.min(y, 750));
    }

    const newNode: NetworkNode = {
      id: `node-${Date.now()}`,
      type,
      ...(type === 'function' && { functionType }),
      x,
      y,
      name: displayName,
      icon: getNodeIcon(type, functionType, networkType),
      status: 'inactive',
      config: {
        ...(type === 'network' && networkType ? { networkType: networkType.toLowerCase() } : {}),
        ...(type === 'datacenter' && provider ? { provider } : {}),
        ...(type === 'destination' && provider ? { provider } : {})
      }
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    saveToHistory(newNodes, edges);
    return newNode;
  };
  
  // Update a node
  const updateNode = (nodeId: string, updates: Partial<NetworkNode>) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedNode = {
      ...node,
      ...updates,
      config: updates.config ? { ...node.config, ...updates.config } : node.config
    };

    if (typeof updatedNode.y === 'number') {
      updatedNode.y = Math.min(updatedNode.y, 800 - 64);
    }

    const newNodes = nodes.map(n => n.id === nodeId ? updatedNode : n);
    setNodes(newNodes);
    saveToHistory(newNodes, edges);
  };
  
  // Delete a node
  const deleteNode = (nodeId: string) => {
    const newNodes = nodes.filter(n => n.id !== nodeId);
    const newEdges = edges.filter(e => 
      e.source !== nodeId && e.target !== nodeId
    );
    setNodes(newNodes);
    setEdges(newEdges);
    saveToHistory(newNodes, newEdges);
  };
  
  // Update an edge
  const updateEdge = (edgeId: string, updates: Partial<NetworkEdge>) => {
    const newEdges = edges.map(edge =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    );
    setEdges(newEdges);
    saveToHistory(nodes, newEdges);
  };
  
  // Delete an edge
  const deleteEdge = (edgeId: string) => {
    const newEdges = edges.filter(e => e.id !== edgeId);
    setEdges(newEdges);
    saveToHistory(nodes, newEdges);
  };
  
  // Clear all nodes and edges
  const clearNetwork = () => {
    setNodes([]);
    setEdges([]);
    saveToHistory([], []);
  };
  
  // Apply a template
  const applyTemplate = (templateNodes: NetworkNode[], templateEdges: NetworkEdge[]) => {
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
    
    setNodes(newNodes);
    setEdges(newEdges);
    saveToHistory(newNodes, newEdges);
  };
  
  return {
    nodes,
    edges,
    networkScores,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    deleteNode,
    updateEdge,
    deleteEdge,
    clearNetwork,
    applyTemplate
  };
}