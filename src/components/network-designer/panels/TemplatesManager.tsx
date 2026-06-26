import { useEffect } from 'react';
import { NetworkNode, NetworkEdge } from '../../types';
import { TemplatesDrawer } from '../TemplatesDrawer';

interface TemplatesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (nodes: NetworkNode[], edges: NetworkEdge[]) => void;
  customTemplates: {
    id: string;
    name: string;
    description: string;
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    isCustom?: boolean;
  }[];
  onDeleteCustomTemplate?: (id: string) => void;
}

export function TemplatesManager({ 
  isOpen, 
  onClose, 
  onApplyTemplate, 
  customTemplates = [],
  onDeleteCustomTemplate
}: TemplatesManagerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplyTemplate = (nodes: NetworkNode[], edges: NetworkEdge[]) => {
    onApplyTemplate(nodes, edges);
    onClose(); // Close the modal after applying the template
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[100]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 m-6 max-w-4xl w-full" role="dialog" aria-modal="true" aria-label="Network templates" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Network Templates</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600">
            Select a pre-built template or one of your custom templates to quickly create common network topologies.
          </p>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto">
          <TemplatesDrawer 
            onApplyTemplate={handleApplyTemplate} 
            onClose={onClose} 
            customTemplates={customTemplates}
            onDeleteCustomTemplate={onDeleteCustomTemplate}
          />
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          {/* Applying a template already closes this - a single dismiss is
              all the footer needs (the old Cancel + Close did the same thing) */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}