import type { ComponentType } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { NetworkNode, NetworkEdge } from '../../../types';

interface PreviewIcon {
  icon: ComponentType<{ className?: string }>;
  color: string;
}

interface PreviewColumn {
  type: 'col';
  icons: PreviewIcon[];
}

export interface Template {
  name: string;
  description: string;
  preview: {
    icons: PreviewColumn[];
  };
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}