import { useState, useEffect } from 'react';
import { Cable, Calendar, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { CrossConnectData, LOAData } from '../../crossconnect/CrossConnectWorkflow';
import { CrossConnectVisualizer } from '../../crossconnect/CrossConnectVisualizer';

interface CrossConnectsPanelProps {
  crossConnects: {id: string, loa: LOAData, connection: CrossConnectData}[];
  onShowInTopology: (crossConnectId: string) => void;
}

export function CrossConnectsPanel({ 
  crossConnects,
  onShowInTopology
}: CrossConnectsPanelProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  if (crossConnects.length === 0) {
    return (
      <div className="text-center py-8">
        <Cable className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Cross-Connects Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          You haven't set up any cross-connects yet. Click the "Cross-Connect Setup" button 
          in the header to create a new connection.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Your Cross-Connects</h3>
        <span className="text-sm text-gray-500">{crossConnects.length} connections</span>
      </div>
      
      <div className="space-y-4">
        {crossConnects.map((crossConnect) => (
          <div 
            key={crossConnect.id} 
            className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                 onClick={() => setExpandedItem(
                   expandedItem === crossConnect.id ? null : crossConnect.id
                 )}
            >
              <div className="flex items-center">
                <div className={`p-2 mr-3 rounded-lg ${
                  crossConnect.connection.connectionType === 'fiber' 
                  ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  <Cable className={`h-5 w-5 ${
                    crossConnect.connection.connectionType === 'fiber' 
                    ? 'text-blue-600' : 'text-orange-600'
                  }`} />
                </div>
                
                <div>
                  <h4 className="text-base font-medium text-gray-900">
                    {crossConnect.connection.sourceLocation} to {crossConnect.connection.targetLocation}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {crossConnect.connection.connectionType === 'fiber' ? 'Fiber Optic' : 'Copper'} • 
                    {crossConnect.connection.bandwidth} • 
                    Ref: {crossConnect.connection.loaReference}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <button
                  className="mr-4 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 
                             hover:bg-blue-100 rounded-lg font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowInTopology(crossConnect.id);
                  }}
                >
                  Show in Topology
                </button>
                
                <div className="flex items-center justify-center w-8 h-8 rounded-full">
                  {expandedItem === crossConnect.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Expanded Content */}
            {expandedItem === crossConnect.id && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                {/* Visual connection */}
                <div className="mb-6">
                  <CrossConnectVisualizer 
                    sourceLocation={crossConnect.connection.sourceLocation}
                    targetLocation={crossConnect.connection.targetLocation}
                    connectionType={crossConnect.connection.connectionType}
                    bandwidth={crossConnect.connection.bandwidth}
                    status="completed"
                    animated={true}
                  />
                </div>
                
                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Installation Date</p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">
                        {crossConnect.connection.installationDate}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Connection Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {crossConnect.connection.connectionType === 'fiber' 
                      ? 'Fiber Optic' : 'Copper'} / {crossConnect.connection.redundancy === 'dual' 
                      ? 'Redundant' : 'Single'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Provider</p>
                    <p className="text-sm font-medium text-gray-900">
                      {crossConnect.loa.requestedProvider}
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      This cross-connect is active and operational. You can incorporate it into your 
                      network topology by clicking "Show in Topology" to add it as network elements.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}