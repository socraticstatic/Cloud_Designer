import { useState } from 'react';
import { NetworkNode, NetworkEdge } from '../types';

interface HistoryState {
  nodes: NetworkNode[][];
  edges: NetworkEdge[][];
  currentIndex: number;
}

export function useNetworkHistory() {
  const [history, setHistory] = useState<HistoryState>({
    nodes: [[]],
    edges: [[]],
    currentIndex: 0
  });

  const saveToHistory = (newNodes: NetworkNode[], newEdges: NetworkEdge[]) => {
    setHistory({
      nodes: [...history.nodes.slice(0, history.currentIndex + 1), newNodes],
      edges: [...history.edges.slice(0, history.currentIndex + 1), newEdges],
      currentIndex: history.currentIndex + 1
    });
  };

  const undo = () => {
    if (history.currentIndex > 0) {
      const newIndex = history.currentIndex - 1;
      const nodes = history.nodes[newIndex];
      const edges = history.edges[newIndex];
      setHistory({ ...history, currentIndex: newIndex });
      return { nodes, edges };
    }
    return null;
  };

  const redo = () => {
    if (history.currentIndex < history.nodes.length - 1) {
      const newIndex = history.currentIndex + 1;
      const nodes = history.nodes[newIndex];
      const edges = history.edges[newIndex];
      setHistory({ ...history, currentIndex: newIndex });
      return { nodes, edges };
    }
    return null;
  };

  const canUndo = history.currentIndex > 0;
  const canRedo = history.currentIndex < history.nodes.length - 1;

  return {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    currentNodes: history.nodes[history.currentIndex],
    currentEdges: history.edges[history.currentIndex]
  };
}