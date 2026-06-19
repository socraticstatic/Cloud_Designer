import { useState, useEffect } from 'react';
import { NetworkNode, NetworkEdge } from '../types';
import { calculateNetworkScores } from '../utils/calculations';
import { getNodeIcon, getNodeDisplayName } from '../utils/nodeUtils';
import { ensureNodesHaveGeoData } from '../utils/sampleGeoData';
import { getSafeBounds, getSafeCenter, CANVAS_BOUNDS } from '../constants';

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

  // Collision avoidance: nudge a desired position to the nearest free
  // grid spot (no overlap with existing nodes, always inside the safe
  // area so nodes never land under the toolbar or status pill).
  const findFreeSpot = (x: number, y: number) => {
    const safe = getSafeBounds(1100, CANVAS_BOUNDS.MAX_Y);
    const SIZE = CANVAS_BOUNDS.NODE_SIZE;
    const CLEAR = SIZE + 40; // node + label breathing room
    const clamp = (px: number, py: number) => ({
      x: Math.min(Math.max(px, safe.minX), safe.maxX - SIZE),
      y: Math.min(Math.max(py, safe.minY + 20), safe.maxY - SIZE - 20)
    });
    const collides = (px: number, py: number) =>
      nodes.some(n => Math.abs(n.x - px) < CLEAR && Math.abs(n.y - py) < CLEAR);

    let spot = clamp(x, y);
    if (!collides(spot.x, spot.y)) return spot;
    // spiral outward on the grid until a free spot appears
    for (let ring = 1; ring <= 12; ring++) {
      for (const [dx, dy] of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) {
        const candidate = clamp(x + dx * ring * 90, y + dy * ring * 90);
        if (!collides(candidate.x, candidate.y)) return candidate;
      }
    }
    return spot;
  };

  // Smart positioning: place nodes relative to existing topology
  const getSmartPosition = (type: NetworkNode['type'], functionType?: string) => {
    const safe = getSafeBounds(800, CANVAS_BOUNDS.MAX_Y);
    const center = getSafeCenter(800, CANVAS_BOUNDS.MAX_Y);

    if (nodes.length === 0) {
      return { x: center.x, y: center.y };
    }

    // Find existing node positions by role
    const gateways = nodes.filter(n => n.type === 'function' && (n.functionType === 'Router' || n.functionType === 'Gateway'));
    const ipeNodes = nodes.filter(n => n.type === 'network' && n.config?.networkType === 'at&t core');
    const allX = nodes.map(n => n.x);
    const allY = nodes.map(n => n.y);
    const avgX = allX.reduce((s, x) => s + x, 0) / allX.length;
    const avgY = allY.reduce((s, y) => s + y, 0) / allY.length;
    const maxX = Math.max(...allX);
    const minX = Math.min(...allX);

    // Cloud destinations: place to the right of Gateways
    if (type === 'destination') {
      const rightX = Math.min(maxX + 150, safe.maxX - 64);
      const yOffset = nodes.filter(n => n.type === 'destination').length * 100;
      return { x: rightX, y: Math.min(center.y - 50 + yOffset, safe.maxY - 64) };
    }

    // Network/IPE nodes: place to the left
    if (type === 'network') {
      const leftX = Math.max(minX - 150, safe.minX);
      return { x: leftX, y: avgY };
    }

    // Datacenter: place below and right
    if (type === 'datacenter') {
      const rightX = Math.min(maxX + 120, safe.maxX - 64);
      const yOffset = nodes.filter(n => n.type === 'datacenter').length * 100;
      return { x: rightX, y: Math.min(center.y + 50 + yOffset, safe.maxY - 64) };
    }

    // Function nodes: place between existing nodes
    if (type === 'function') {
      return { x: avgX, y: Math.min(avgY + 80, safe.maxY - 64) };
    }

    // Fallback: near center with offset
    return {
      x: Math.min(avgX + 80, safe.maxX - 64),
      y: Math.min(avgY + 40, safe.maxY - 64)
    };
  };

  // Create a new node with smart positioning
  const addNode = (type: NetworkNode['type'], functionType?: NetworkNode['functionType'], networkType?: string, provider?: string) => {
    const displayName = getNodeDisplayName(type, functionType, networkType, provider);
    const desired = getSmartPosition(type, functionType);
    const pos = findFreeSpot(desired.x, desired.y);

    const newNode: NetworkNode = {
      id: `node-${Date.now()}`,
      type,
      ...(type === 'function' && { functionType }),
      ...(type === 'destination' && provider ? { cloudProvider: provider } : {}),
      x: pos.x,
      y: pos.y,
      name: displayName,
      icon: getNodeIcon(type, functionType, networkType, provider ? { provider } : undefined),
      status: 'inactive',
      config: {
        ...(type === 'network' && networkType ? { networkType: networkType.toLowerCase() as NetworkNode['config'] extends { networkType?: infer T } ? T : never } : {}),
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
      // touching configuration marks the node configured (Figma state machine)
      config: updates.config ? { ...node.config, ...updates.config, configured: true } : node.config
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
    console.log(`[applyTemplate] Loading template with ${templateNodes.length} nodes`);
    const timestamp = Date.now();
    const idMap = new Map<string, string>();

    // Compute template centroid and shift to safe center
    const safeCenter = getSafeCenter(800, CANVAS_BOUNDS.MAX_Y);
    const avgX = templateNodes.reduce((sum, n) => sum + n.x, 0) / templateNodes.length;
    const avgY = templateNodes.reduce((sum, n) => sum + n.y, 0) / templateNodes.length;
    const shiftX = safeCenter.x - avgX;
    const shiftY = safeCenter.y - avgY;

    // Create new nodes with unique IDs, centered in safe area
    const newNodes = templateNodes.map(node => {
      const newId = `${node.id}-${timestamp}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        x: node.x + shiftX,
        y: node.y + shiftY
      };
    });

    // Enrich nodes with geo data BEFORE setting them into state
    // This ensures nodes have coordinates from the moment they're loaded
    console.log(`[applyTemplate] Enriching ${newNodes.length} nodes with geo data...`);
    const enrichedNodes = ensureNodesHaveGeoData(newNodes);

    // Log enrichment results
    const enrichedCount = enrichedNodes.filter(
      node => node.config?.latitude !== undefined && node.config?.longitude !== undefined
    ).length;
    console.log(`[applyTemplate] Successfully enriched ${enrichedCount}/${enrichedNodes.length} nodes`);
    enrichedNodes.forEach(node => {
      if (node.config?.latitude && node.config?.longitude) {
        console.log(`  ✓ ${node.name}: ${node.config.latitude}, ${node.config.longitude} (${node.config.city || 'unknown city'})`);
      } else {
        console.log(`  ✗ ${node.name}: No geo data`);
      }
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

    setNodes(enrichedNodes);
    setEdges(newEdges);
    saveToHistory(enrichedNodes, newEdges);
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