import { useState } from 'react';
import { NetworkNode, NetworkEdge } from '../types';
import { Server, Router, Cloud, Globe, Network, Save, Trash2 } from 'lucide-react';

interface TemplatesDrawerProps {
  onApplyTemplate: (nodes: NetworkNode[], edges: NetworkEdge[]) => void;
  onClose?: () => void;
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

// Template definition
interface Template {
  id: string;
  name: string;
  description: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  isCustom?: boolean;
}

export function TemplatesDrawer({ 
  onApplyTemplate, 
  onClose, 
  customTemplates = [],
  onDeleteCustomTemplate
}: TemplatesDrawerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Define available templates
  const builtInTemplates: Template[] = [
    {
      id: 'internet-to-cloud',
      name: 'Internet to Cloud',
      description: 'AT&T Core through Cloud Router to cloud services',
      nodes: [
        {
          id: 'att-core-template',
          type: 'network',
          x: 200,
          y: 200,
          name: 'AT&T Core',
          icon: Globe,
          status: 'inactive',
          config: {
            networkType: 'at&t core',
            provider: 'AT&T'
          }
        },
        {
          id: 'cloud-router-template',
          type: 'function',
          functionType: 'Router',
          x: 400,
          y: 200,
          name: 'Cloud Router',
          icon: Router,
          status: 'inactive',
          config: {
            routerType: 'cloud',
            asn: 65000
          }
        },
        {
          id: 'aws-cloud-template',
          type: 'destination',
          x: 600,
          y: 200,
          name: 'AWS Cloud',
          icon: Cloud,
          status: 'inactive',
          config: {
            provider: 'AWS',
            region: 'us-east-1'
          }
        }
      ],
      edges: [
        {
          id: 'att-to-router-template',
          source: 'att-core-template',
          target: 'cloud-router-template',
          type: 'MPLS',
          bandwidth: '10 Gbps',
          status: 'inactive'
        },
        {
          id: 'router-to-cloud-template',
          source: 'cloud-router-template',
          target: 'aws-cloud-template',
          type: 'Direct Connect',
          bandwidth: '10 Gbps',
          status: 'inactive'
        }
      ]
    },
    {
      id: 'cloud-to-cloud',
      name: 'Cloud to Cloud - Local',
      description: 'AT&T Core through Cloud Router to multiple cloud providers',
      nodes: [
        {
          id: 'att-core-cc-template',
          type: 'network',
          x: 200,
          y: 200,
          name: 'AT&T Core',
          icon: Globe,
          status: 'inactive',
          config: {
            networkType: 'at&t core',
            provider: 'AT&T'
          }
        },
        {
          id: 'cloud-router-cc-template',
          type: 'function',
          functionType: 'Router',
          x: 300,
          y: 200,
          name: 'Cloud Router',
          icon: Router,
          status: 'inactive',
          config: {
            routerType: 'cloud',
            asn: 65000
          }
        },
        {
          id: 'aws-cloud-cc-template',
          type: 'destination',
          x: 500,
          y: 100,
          name: 'AWS Cloud',
          icon: Cloud,
          status: 'inactive',
          config: {
            provider: 'AWS',
            region: 'us-east-1'
          }
        },
        {
          id: 'azure-cloud-cc-template',
          type: 'destination',
          x: 500,
          y: 300,
          name: 'Azure Cloud',
          icon: Cloud,
          status: 'inactive',
          config: {
            provider: 'Azure',
            region: 'eastus'
          }
        }
      ],
      edges: [
        {
          id: 'att-to-router-cc-template',
          source: 'att-core-cc-template',
          target: 'cloud-router-cc-template',
          type: 'MPLS',
          bandwidth: '10 Gbps',
          status: 'inactive'
        },
        {
          id: 'router-to-aws-cc-template',
          source: 'cloud-router-cc-template',
          target: 'aws-cloud-cc-template',
          type: 'Direct Connect',
          bandwidth: '10 Gbps',
          status: 'inactive'
        },
        {
          id: 'router-to-azure-cc-template',
          source: 'cloud-router-cc-template',
          target: 'azure-cloud-cc-template',
          type: 'ExpressRoute',
          bandwidth: '10 Gbps',
          status: 'inactive'
        }
      ]
    },
    {
      id: 'high-availability',
      name: 'High Availability',
      description: 'AT&T Core with redundant Cloud Router connectivity for high availability',
      nodes: [
        {
          id: 'att-core-ha-template',
          type: 'network',
          x: 200,
          y: 200,
          name: 'AT&T Core',
          icon: Globe,
          status: 'inactive',
          config: {
            networkType: 'at&t core',
            provider: 'AT&T'
          }
        },
        {
          id: 'primary-cloud-router-ha-template',
          type: 'function',
          functionType: 'Router',
          x: 400,
          y: 100,
          name: 'Primary Cloud Router',
          icon: Router,
          status: 'inactive',
          config: {
            routerType: 'cloud',
            asn: 65000,
            fastReroute: true,
            bfd: true
          }
        },
        {
          id: 'secondary-cloud-router-ha-template',
          type: 'function',
          functionType: 'Router',
          x: 400,
          y: 300,
          name: 'Secondary Cloud Router',
          icon: Router,
          status: 'inactive',
          config: {
            routerType: 'cloud',
            asn: 65001,
            fastReroute: true,
            bfd: true
          }
        },
        {
          id: 'aws-cloud-ha-template',
          type: 'destination',
          x: 600,
          y: 200,
          name: 'AWS Cloud',
          icon: Cloud,
          status: 'inactive',
          config: {
            provider: 'AWS',
            region: 'us-east-1'
          }
        }
      ],
      edges: [
        {
          id: 'att-to-primary-ha-template',
          source: 'att-core-ha-template',
          target: 'primary-cloud-router-ha-template',
          type: 'MPLS',
          bandwidth: '10 Gbps',
          status: 'inactive',
          config: {
            resilience: 'ha',
            bfd: true
          }
        },
        {
          id: 'att-to-secondary-ha-template',
          source: 'att-core-ha-template',
          target: 'secondary-cloud-router-ha-template',
          type: 'MPLS',
          bandwidth: '10 Gbps',
          status: 'inactive',
          config: {
            resilience: 'ha',
            bfd: true
          }
        },
        {
          id: 'primary-to-cloud-ha-template',
          source: 'primary-cloud-router-ha-template',
          target: 'aws-cloud-ha-template',
          type: 'Direct Connect',
          bandwidth: '10 Gbps',
          status: 'inactive',
          config: {
            resilience: 'ha',
            bfd: true
          }
        },
        {
          id: 'secondary-to-cloud-ha-template',
          source: 'secondary-cloud-router-ha-template',
          target: 'aws-cloud-ha-template',
          type: 'Direct Connect',
          bandwidth: '10 Gbps',
          status: 'inactive',
          config: {
            resilience: 'ha',
            bfd: true
          }
        },
        {
          id: 'router-interconnect-ha-template',
          source: 'primary-cloud-router-ha-template',
          target: 'secondary-cloud-router-ha-template',
          type: 'Direct Connect',
          bandwidth: '10 Gbps',
          status: 'inactive',
          config: {
            resilience: 'ha',
            bfd: true,
            fastConvergence: true
          }
        }
      ]
    }
  ];
  
  // Combine built-in templates with custom templates
  const templates = [...builtInTemplates, ...customTemplates];

  // Apply selected template
  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Pass the original nodes and edges to the parent component
    // Let the parent component handle ID generation consistently
    onApplyTemplate(template.nodes, template.edges);
    
    // Show success message
    window.addToast({
      type: 'success',
      title: 'Template Applied',
      message: `${template.name} template has been applied successfully`,
      duration: 3000
    });
    
    // Close the modal if onClose prop is provided
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="flex flex-col p-5 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left relative"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
            {template.id === 'high-availability' && !template.isCustom && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                Recommended
              </span>
            )}
            {template.isCustom && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-600 rounded-full">
                Custom
              </span>
            )}
          </div>
          
          {/* Template preview icons */}
          <div className="flex items-center space-x-4 justify-center my-4">
            {template.id === 'internet-to-cloud' && !template.isCustom && (
              <>
                <Globe className="h-8 w-8 text-orange-500" />
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <Router className="h-8 w-8 text-purple-500" />
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <Cloud className="h-8 w-8 text-blue-500" />
              </>
            )}
            
            {(template.id === 'cloud-to-cloud' || template.id === 'cloud-to-cloud-local') && !template.isCustom && (
              <>
                <Globe className="h-8 w-8 text-orange-500" />
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <Router className="h-8 w-8 text-purple-500" />
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="flex flex-col space-y-1">
                  <Cloud className="h-6 w-6 text-blue-500" />
                  <Cloud className="h-6 w-6 text-blue-500" />
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
              </>
            )}
            
            {template.id === 'high-availability' && !template.isCustom && (
              <>
                <Globe className="h-8 w-8 text-orange-500" />
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Router className="h-5 w-5 text-purple-500" />
                    <Router className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <Cloud className="h-8 w-8 text-blue-500" />
              </>
            )}
            
            {template.isCustom && (
              <div className="bg-gray-100 rounded-full p-3">
                <Save className="h-8 w-8 text-green-500" />
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mb-3">{template.description}</p>
          
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                <span className="font-medium">{template.nodes.length}</span> nodes, 
                <span className="font-medium ml-1">{template.edges.length}</span> connections
              </div>
              
              {template.isCustom && onDeleteCustomTemplate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCustomTemplate(template.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                  title="Delete template"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={() => handleApplyTemplate(template.id)}
            className="absolute inset-0 w-full h-full opacity-0"
            aria-label={`Apply ${template.name} template`}
          ></button>
        </div>
      ))}
    </div>
  );
}