import { useState } from 'react';
import { NetworkNode, NetworkEdge } from '../types';
import { getEdgeDefaults } from '../data/connectionDefaults';

export function useEdgeCreator(
  edges: NetworkEdge[],
  setEdges: React.Dispatch<React.SetStateAction<NetworkEdge[]>>,
  onEdgeCreated: (edge: NetworkEdge) => void,
  getNodeById?: (id: string) => NetworkNode | undefined
) {
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeStart, setEdgeStart] = useState<string | null>(null);

  // Toggle edge creation mode
  const toggleEdgeCreation = () => {
    setIsCreatingEdge(!isCreatingEdge);
    if (isCreatingEdge) {
      setEdgeStart(null);
    }
  };

  // Handle node click during edge creation
  const handleNodeClickForEdge = (sourceId: string, targetId: string) => {
    if (!isCreatingEdge) return false;

    if (edgeStart) {
      if (edgeStart !== targetId) {
        // Resolve service-aware defaults if we have node lookup
        let edgeType = 'Ethernet';
        let bandwidth = '1 Gbps';
        let resilience: string | undefined;
        let description: string | undefined;

        if (getNodeById) {
          const sourceNode = getNodeById(edgeStart);
          const targetNode = getNodeById(targetId);
          if (sourceNode && targetNode) {
            const defaults = getEdgeDefaults(sourceNode, targetNode);
            edgeType = defaults.type;
            bandwidth = defaults.bandwidth;
            resilience = defaults.resilience;
            description = defaults.description;
          }
        }

        const newEdge: NetworkEdge = {
          id: `edge-${Date.now()}`,
          source: edgeStart,
          target: targetId,
          type: edgeType,
          bandwidth,
          status: 'inactive',
          config: {
            ...(resilience ? { resilience } : {}),
          }
        };
        const newEdges = [...edges, newEdge];
        setEdges(newEdges);
        onEdgeCreated(newEdge);

        // Show toast with edge info
        if (description && typeof window !== 'undefined' && window.addToast) {
          window.addToast({
            type: 'info',
            title: `${edgeType} Connection`,
            message: `${description} - ${bandwidth}`,
            duration: 3000
          });
        }
      }
      setIsCreatingEdge(false);
      setEdgeStart(null);
      return true;
    } else {
      setEdgeStart(sourceId);
      return true;
    }
  };

  // Cancel edge creation
  const cancelEdgeCreation = () => {
    setIsCreatingEdge(false);
    setEdgeStart(null);
  };

  return {
    isCreatingEdge,
    edgeStart,
    toggleEdgeCreation,
    handleNodeClickForEdge,
    cancelEdgeCreation
  };
}
