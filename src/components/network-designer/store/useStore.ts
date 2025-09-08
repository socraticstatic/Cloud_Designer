import { create } from 'zustand';
import { NetworkNode, NetworkEdge } from '../../types';

interface StoreState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  abstractionLevel: 'global' | 'network' | 'circuit';
  selectedNode: string | null;
  selectedEdge: string | null;
  
  setNodes: (nodes: NetworkNode[]) => void;
  setEdges: (edges: NetworkEdge[]) => void;
  addNode: (node: NetworkNode) => void;
  updateNode: (id: string, updates: Partial<NetworkNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: NetworkEdge) => void;
  updateEdge: (id: string, updates: Partial<NetworkEdge>) => void;
  removeEdge: (id: string) => void;
  setAbstractionLevel: (level: 'global' | 'network' | 'circuit') => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
}

export const useStore = create<StoreState>((set) => ({
  nodes: [],
  edges: [],
  abstractionLevel: 'network',
  selectedNode: null,
  selectedEdge: null,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  addNode: (node) => set(state => ({ 
    nodes: [...state.nodes, node] 
  })),
  
  updateNode: (id, updates) => set(state => ({
    nodes: state.nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    )
  })),
  
  removeNode: (id) => set(state => ({
    nodes: state.nodes.filter(node => node.id !== id),
    edges: state.edges.filter(edge => edge.source !== id && edge.target !== id)
  })),
  
  addEdge: (edge) => set(state => ({ 
    edges: [...state.edges, edge] 
  })),
  
  updateEdge: (id, updates) => set(state => ({
    edges: state.edges.map(edge => 
      edge.id === id ? { ...edge, ...updates } : edge
    )
  })),
  
  removeEdge: (id) => set(state => ({
    edges: state.edges.filter(edge => edge.id !== id)
  })),
  
  setAbstractionLevel: (level) => set({ abstractionLevel: level }),
  
  setSelectedNode: (id) => set({ selectedNode: id, selectedEdge: null }),
  
  setSelectedEdge: (id) => set({ selectedEdge: id, selectedNode: null })
}));