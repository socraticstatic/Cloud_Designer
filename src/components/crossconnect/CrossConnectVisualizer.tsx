import { useState, useEffect } from 'react';
import { Cable, Server, Database, Activity, CheckCircle, CloudLightning } from 'lucide-react';

interface CrossConnectVisualizerProps {
  sourceLocation: string;
  targetLocation: string;
  connectionType: 'fiber' | 'copper';
  bandwidth: string;
  status: 'planning' | 'pending' | 'active' | 'completed' | 'failed';
  animated?: boolean;
}

export function CrossConnectVisualizer({
  sourceLocation,
  targetLocation,
  connectionType,
  bandwidth,
  status,
  animated = true
}: CrossConnectVisualizerProps) {
  const [isConnected, setIsConnected] = useState(status === 'active' || status === 'completed');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPackets, setShowPackets] = useState(false);
  
  useEffect(() => {
    if (status === 'active' || status === 'completed') {
      setIsConnected(true);
    }
    
    // Start animation when status changes to active
    if (status === 'active' && animated) {
      setIsAnimating(true);
      
      // Show data packets flowing after connection established
      setTimeout(() => {
        setShowPackets(true);
      }, 1000);
    }
    
    return () => {
      setIsAnimating(false);
      setShowPackets(false);
    };
  }, [status, animated]);
  
  // Get connection color based on type and status
  const getConnectionColor = () => {
    if (status === 'failed') return '#ef4444'; // Red for failed
    if (!isConnected) return '#9ca3af'; // Gray for planning/pending
    
    // Connected status
    return connectionType === 'fiber' 
      ? '#3b82f6' // Blue for fiber
      : '#f97316'; // Orange for copper
  };
  
  // Get connection style based on type
  const getConnectionStyle = () => {
    if (connectionType === 'fiber') {
      return {
        backgroundImage: isConnected 
          ? 'linear-gradient(90deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.7) 50%, rgba(59,130,246,0.2) 100%)' 
          : 'none',
        border: `2px solid ${getConnectionColor()}`,
        borderStyle: isConnected ? 'solid' : 'dashed'
      };
    } else {
      return {
        backgroundImage: isConnected 
          ? 'linear-gradient(90deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.7) 50%, rgba(249,115,22,0.2) 100%)' 
          : 'none',
        border: `2px solid ${getConnectionColor()}`,
        borderStyle: isConnected ? 'solid' : 'dashed'
      };
    }
  };
  
  return (
    <div className="my-8 relative" style={{ height: '180px' }}>
      {/* Source Location */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-40">
        <div className={`
          p-4 bg-gradient-to-b from-gray-50 to-gray-100 
          border border-gray-200 rounded-lg shadow-sm 
          flex flex-col items-center justify-center
          ${status === 'active' || status === 'completed' ? 'animate-pulse' : ''}
        `}>
          <Database className="h-8 w-8 text-indigo-600 mb-2" />
          <div className="text-sm font-medium text-center text-gray-800 mb-1">Source</div>
          <div className="text-xs text-center text-gray-500 max-w-full truncate">{sourceLocation}</div>
          <div className={`mt-2 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </div>
        
        {/* Source Port */}
        <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 z-30">
          <div className={`
            h-6 w-6 rounded-full border-2 
            flex items-center justify-center
            ${isConnected 
              ? connectionType === 'fiber' ? 'border-blue-500 bg-blue-100' : 'border-orange-500 bg-orange-100'
              : 'border-gray-300 bg-gray-50'}
          `}>
            <Cable className={`h-3 w-3 ${
              isConnected 
                ? connectionType === 'fiber' ? 'text-blue-600' : 'text-orange-600'
                : 'text-gray-400'
            }`} />
          </div>
        </div>
      </div>
      
      {/* Target Location */}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-40">
        <div className={`
          p-4 bg-gradient-to-b from-gray-50 to-gray-100
          border border-gray-200 rounded-lg shadow-sm
          flex flex-col items-center justify-center
          ${status === 'active' || status === 'completed' ? 'animate-pulse' : ''}
        `}>
          <Server className="h-8 w-8 text-blue-600 mb-2" />
          <div className="text-sm font-medium text-center text-gray-800 mb-1">Target</div>
          <div className="text-xs text-center text-gray-500 max-w-full truncate">{targetLocation}</div>
          <div className={`mt-2 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </div>
        
        {/* Target Port */}
        <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className={`
            h-6 w-6 rounded-full border-2
            flex items-center justify-center
            ${isConnected 
              ? connectionType === 'fiber' ? 'border-blue-500 bg-blue-100' : 'border-orange-500 bg-orange-100'
              : 'border-gray-300 bg-gray-50'}
          `}>
            <Cable className={`h-3 w-3 ${
              isConnected 
                ? connectionType === 'fiber' ? 'text-blue-600' : 'text-orange-600'
                : 'text-gray-400'
            }`} />
          </div>
        </div>
      </div>
      
      {/* Connection Line */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[calc(100%-160px)] h-4 rounded-full" 
        style={getConnectionStyle()}>
        
        {/* Data Packets - Only shown when connection is active and showPackets is true */}
        {showPackets && isConnected && (
          <>
            <div className={`absolute h-2 w-2 top-1 rounded-full ${connectionType === 'fiber' ? 'bg-blue-600' : 'bg-orange-600'}`}
              style={{ animation: 'dataPacketLeftToRight 3s linear infinite', left: '10%' }}></div>
            <div className={`absolute h-2 w-2 top-1 rounded-full ${connectionType === 'fiber' ? 'bg-blue-600' : 'bg-orange-600'}`}
              style={{ animation: 'dataPacketLeftToRight 3s linear infinite 1s', left: '10%' }}></div>
            <div className={`absolute h-2 w-2 top-1 rounded-full ${connectionType === 'fiber' ? 'bg-blue-600' : 'bg-orange-600'}`}
              style={{ animation: 'dataPacketLeftToRight 3s linear infinite 2s', left: '10%' }}></div>
            
            <div className={`absolute h-2 w-2 bottom-1 rounded-full ${connectionType === 'fiber' ? 'bg-blue-400' : 'bg-orange-400'}`}
              style={{ animation: 'dataPacketRightToLeft 3.5s linear infinite 0.5s', right: '10%' }}></div>
            <div className={`absolute h-2 w-2 bottom-1 rounded-full ${connectionType === 'fiber' ? 'bg-blue-400' : 'bg-orange-400'}`}
              style={{ animation: 'dataPacketRightToLeft 3.5s linear infinite 1.5s', right: '10%' }}></div>
            <div className={`absolute h-2 w-2 bottom-1 rounded-full ${connectionType === 'fiber' ? 'bg-blue-400' : 'bg-orange-400'}`}
              style={{ animation: 'dataPacketRightToLeft 3.5s linear infinite 2.5s', right: '10%' }}></div>
          </>
        )}
      </div>
      
      {/* Connection Info */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 translate-y-12 z-20">
        <div className={`
          text-center px-3 py-1.5 rounded-full 
          ${isConnected 
            ? connectionType === 'fiber' 
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-orange-100 text-orange-800 border border-orange-200' 
            : 'bg-gray-100 text-gray-800 border border-gray-200'}
        `}>
          <div className="flex items-center space-x-2">
            <Cable className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">
              {connectionType === 'fiber' ? 'Fiber Optic' : 'Copper'} • {bandwidth}
            </span>
          </div>
        </div>
      </div>
      
      {/* Status Indicator */}
      <div className="absolute left-1/2 top-1/4 transform -translate-x-1/2 -translate-y-1/2 z-20">
        {status === 'planning' && (
          <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
            Planning
          </div>
        )}
        
        {status === 'pending' && (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200 flex items-center">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Pending Installation
          </div>
        )}
        
        {status === 'active' && (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200 flex items-center">
            <Activity className="h-3.5 w-3.5 mr-1 animate-pulse" />
            Connection Active
          </div>
        )}
        
        {status === 'completed' && (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200 flex items-center">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Installation Complete
          </div>
        )}
        
        {status === 'failed' && (
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium border border-red-200 flex items-center">
            <CloudLightning className="h-3.5 w-3.5 mr-1" />
            Installation Failed
          </div>
        )}
      </div>
    </div>
  );
}