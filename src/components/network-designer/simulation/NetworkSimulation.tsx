import { useState, useEffect } from 'react';
import { Activity, Shield, Clock, Pause, Play, BarChart2, X, ChevronRight, Network, Zap, AlertTriangle, ArrowRight, BarChart as ChartBar, Sliders, Leaf, TrendingDown } from 'lucide-react';

interface SimulationData {
  progress: number;
  metrics: {
    bandwidth: { current: number; max: number };
    latency: { current: number; max: number };
    packets: { sent: number; received: number; errors: number };
  };
  phase: 'idle' | 'initializing' | 'running' | 'completed' | 'error' | 'paused';
  networkScores: {
    resiliency: number;
    redundancy: number;
    disaster: number;
    security: number;
    performance: number;
  };
}

interface NetworkSimulationProps {
  isRunning: boolean;
  simulationData: SimulationData;
  onPause: () => void;
  onResume: () => void;
  onInjectLatency: (amount: number) => void;
  onInjectPacketLoss: (amount: number) => void;
  onInjectBandwidthLimit: (amount: number) => void;
}

export function NetworkSimulation({ 
  isRunning, 
  simulationData, 
  onPause, 
  onResume,
  onInjectLatency,
  onInjectPacketLoss,
  onInjectBandwidthLimit
}: NetworkSimulationProps) {
  // Use a single state to track which panel is active
  const [activePanel, setActivePanel] = useState<'none' | 'comparison' | 'sustainability' | 'testControls'>('testControls');
  const [showDetails, setShowDetails] = useState(false);
  const [latencyAmount, setLatencyAmount] = useState(50);
  const [packetLossAmount, setPacketLossAmount] = useState(5);
  const [bandwidthLimit, setBandwidthLimit] = useState(70);
  
  // Define helper variables for cleaner code
  const showComparison = activePanel === 'comparison';
  const showSustainability = activePanel === 'sustainability';
  const showTestControls = activePanel === 'testControls';
  
  // Function to toggle panels - ensures only one is open at a time
  const togglePanel = (panel: 'comparison' | 'sustainability' | 'testControls') => {
    if (activePanel === panel) {
      setActivePanel('none');
    } else {
      setActivePanel(panel);
    }
  };
  
  // Generate baseline "shared internet" performance data
  const sharedInternetData = {
    latency: Math.min(85, simulationData.metrics.latency.current * 3.5), // 3.5x worse latency
    packetLoss: Math.min(15, simulationData.metrics.packets.errors / simulationData.metrics.packets.sent * 100 * 4), // 4x worse packet loss
    bandwidth: Math.max(15, simulationData.metrics.bandwidth.current / 3), // 1/3 the bandwidth
    availability: 99.5, // Lower availability
    security: Math.max(20, simulationData.networkScores.security / 2) // Lower security
  };

  // Calculate improvement percentages
  const improvements = {
    latency: Math.round(((sharedInternetData.latency - (simulationData.metrics.latency.current / 10)) / sharedInternetData.latency) * 100),
    bandwidth: Math.round(((simulationData.metrics.bandwidth.current - sharedInternetData.bandwidth) / sharedInternetData.bandwidth) * 100),
    packetLoss: Math.round(((sharedInternetData.packetLoss - (simulationData.metrics.packets.errors / simulationData.metrics.packets.sent * 100)) / sharedInternetData.packetLoss) * 100),
    availability: Number(((simulationData.networkScores.redundancy / 100 * 99.99) - sharedInternetData.availability).toFixed(2)),
    security: Math.round(((simulationData.networkScores.security - sharedInternetData.security) / sharedInternetData.security) * 100)
  };
  
  if (!isRunning) return null;
  
  const isPaused = simulationData.phase === 'paused';

  // Get animation class based on simulation phase
  const getAnimationClass = () => {
    if (isPaused) return '';
    return simulationData.phase === 'running' ? 'animate-pulse' : '';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-3xl mx-6 bg-white rounded-2xl shadow-2xl transition-all duration-300 ease-in-out overflow-hidden">
        {/* Header card */}
        <div className="bg-white border-b border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Network className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Network Performance Simulation</h3>
                <div className="flex items-center mt-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    simulationData.phase === 'initializing' ? 'bg-yellow-500 animate-pulse' : 
                    simulationData.phase === 'running' ? 'bg-blue-500 animate-pulse' :
                    simulationData.phase === 'paused' ? 'bg-amber-500' :
                    simulationData.phase === 'completed' ? 'bg-green-500' :
                    simulationData.phase === 'error' ? 'bg-red-500' : 'bg-gray-500'
                  } mr-2`}></div>
                  <p className="text-sm text-gray-600 capitalize">{simulationData.phase} {simulationData.phase === 'running' ? 'simulation' : ''}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => togglePanel('comparison')}
                className={`p-2 rounded-full transition-colors ${
                  showComparison ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={showComparison ? "Hide Comparison" : "Show Comparison"}
                type="button"
              >
                <ChartBar className="h-5 w-5" />
              </button>

              <button
                onClick={() => togglePanel('sustainability')}
                className={`p-2 rounded-full transition-colors ${
                  showSustainability ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={showSustainability ? "Hide Sustainability" : "Show Sustainability"}
                type="button"
              >
                <Leaf className="h-5 w-5" />
              </button>

              <button
                onClick={() => togglePanel('testControls')}
                className={`p-2 rounded-full transition-colors ${
                  showTestControls ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={showTestControls ? "Hide Test Controls" : "Show Test Controls"}
                type="button"
              >
                <Sliders className="h-5 w-5" />
              </button>
              
              <button
                onClick={isPaused ? onResume : onPause}
                className={`p-2 rounded-full transition-colors ${
                  isPaused ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                }`}
                title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
                type="button"
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  setActivePanel('none');
                  setShowDetails(false);
                  onPause();
                  window.addToast({
                    type: 'info',
                    title: 'Simulation Paused',
                    message: 'Network simulation has been paused',
                    duration: 2000
                  });
                }}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                simulationData.phase === 'completed' ? 'bg-green-500' :
                simulationData.phase === 'paused' ? 'bg-amber-500' :
                simulationData.phase === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${simulationData.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Content Area */}
        <div>

        {/* Test Controls */}
        {showTestControls && (
          <div className="bg-purple-50 p-5 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-medium text-purple-900 flex items-center">
                <Sliders className="h-4 w-4 mr-2 text-purple-700" />
                Network Test Controls
              </h4>
              <span className="text-sm text-purple-700">Inject network conditions</span>
            </div>
            
            <div className="grid grid-cols-3 gap-5 mb-4">
              {/* Latency Injection */}
              <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-800 flex items-center">
                    <Activity className="h-4 w-4 text-purple-600 mr-1.5" />
                    Inject Latency
                  </h5>
                  <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    {latencyAmount} ms
                  </span>
                </div>
                <div className="mb-3">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={latencyAmount}
                    onChange={(e) => setLatencyAmount(parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => onInjectLatency(latencyAmount)}
                  className="w-full py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                  type="button"
                >
                  Apply
                </button>
              </div>
              
              {/* Packet Loss Injection */}
              <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-800 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-purple-600 mr-1.5" />
                    Packet Loss
                  </h5>
                  <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    {packetLossAmount}%
                  </span>
                </div>
                <div className="mb-3">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={packetLossAmount}
                    onChange={(e) => setPacketLossAmount(parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => onInjectPacketLoss(packetLossAmount)}
                  className="w-full py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                  type="button"
                >
                  Apply
                </button>
              </div>
              
              {/* Bandwidth Limit */}
              <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-800 flex items-center">
                    <Network className="h-4 w-4 text-purple-600 mr-1.5" />
                    Bandwidth Limit
                  </h5>
                  <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    {bandwidthLimit}%
                  </span>
                </div>
                <div className="mb-3">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={bandwidthLimit}
                    onChange={(e) => setBandwidthLimit(parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => onInjectBandwidthLimit(bandwidthLimit)}
                  className="w-full py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                  type="button"
                >
                  Apply
                </button>
              </div>
            </div>
            
            <div className="bg-purple-100 rounded-lg p-3 flex items-start">
              <AlertTriangle className="h-4 w-4 text-purple-700 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-purple-700 ml-2">
                These controls simulate real-world network conditions to test how your network design handles various performance challenges.
                Use them to verify the resilience of your architecture under different conditions.
              </p>
            </div>
          </div>
        )}

        {/* Sustainability Card */}
        {showSustainability && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-medium text-gray-900 flex items-center">
                <Leaf className="h-4 w-4 mr-2 text-green-600" />
                Sustainability Impact Assessment
              </h4>
              <span className="text-sm text-green-600 font-medium">Environmental Performance</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left column: Key metrics */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 text-green-600 mr-1.5" />
                      <h5 className="text-sm font-medium text-gray-800">Carbon Footprint</h5>
                    </div>
                    <div className="flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                      <span className="text-xs font-semibold">Grade A</span>
                    </div>
                  </div>
                  <div className="mt-1.5 space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Your Network</span>
                        <span className="font-medium text-green-600">{(85 - (simulationData.networkScores.performance / 10)).toFixed(1)} tons CO₂e/yr</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-400 rounded-full" style={{ width: '32%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Industry Average</span>
                        <span className="font-medium text-gray-600">125 tons CO₂e/yr</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 text-amber-600 mr-1.5" />
                      <h5 className="text-sm font-medium text-gray-800">Energy Efficiency</h5>
                    </div>
                    <div className="flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                      <span className="text-xs font-semibold">Efficient</span>
                    </div>
                  </div>
                  <div className="mt-1.5 space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Your PUE</span>
                        <span className="font-medium text-green-600">{(1.2 + (simulationData.networkScores.performance / 1000)).toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-400 rounded-full" style={{ width: '76%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Industry Average</span>
                        <span className="font-medium text-gray-600">1.58</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: Renewable energy and compliance */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-blue-600 mr-1.5" />
                      <h5 className="text-sm font-medium text-gray-800">Renewable Energy</h5>
                    </div>
                    <div className="flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      <span className="text-xs font-semibold">{Math.min(95, 65 + (simulationData.networkScores.security / 3)).toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="mt-1.5 space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Your Network</span>
                        <span className="font-medium text-green-600">{Math.min(95, 65 + (simulationData.networkScores.security / 3)).toFixed(2)}% clean</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-400 rounded-full" style={{ width: `${Math.min(95, 65 + (simulationData.networkScores.security / 3))}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Shared Internet</span>
                        <span className="font-medium text-gray-600">35% clean</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-purple-600 mr-1.5" />
                      <h5 className="text-sm font-medium text-gray-800">Compliance</h5>
                    </div>
                  </div>
                  <div className="mt-1.5 space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-xs font-medium text-gray-900">ISO 14001 Ready</span>
                      <Shield className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-xs font-medium text-gray-900">EU Energy Directive</span>
                      <Shield className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                      <span className="text-xs font-medium text-gray-900">B Corp Standards</span>
                      <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Card */}
        {showComparison && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-medium text-gray-900 flex items-center">
                <BarChart2 className="h-4 w-4 mr-2 text-blue-600" />
                Business Performance Comparison
              </h4>
              <span className="text-sm text-blue-600 font-medium">Your Network vs. Shared Internet</span>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Left column: Core metrics */}
              <div className="space-y-6">
                {/* Latency comparison */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-blue-600 mr-1.5" />
                      <h5 className="text-sm font-medium text-gray-800">Latency</h5>
                    </div>
                    <div className="flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      <span className="text-xs font-semibold">{improvements.latency}% better</span>
                    </div>
                  </div>
                  
                  <div className="mt-1.5 space-y-2">
                    {/* Your network latency */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Your Network</span>
                        <span className="font-medium text-green-600">{(simulationData.metrics.latency.current / 10).toFixed(1)} ms</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-400 rounded-full" style={{ width: `${(simulationData.metrics.latency.current / 200) * 100}%` }}></div>
                      </div>
                    </div>
                    
                    {/* Shared internet latency */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Shared Internet</span>
                        <span className="font-medium text-gray-600">{sharedInternetData.latency.toFixed(1)} ms</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${(sharedInternetData.latency / 200) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Packet Loss comparison */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mr-1.5" />
                      <h5 className="text-sm font-medium text-gray-800">Packet Loss</h5>
                    </div>
                    <div className="flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      <span className="text-xs font-semibold">{improvements.packetLoss}% better</span>
                    </div>
                  </div>
                  
                  <div className="mt-1.5 space-y-2">
                    {/* Your network packet loss */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Your Network</span>
                        <span className="font-medium text-green-600">{
                          simulationData.metrics.packets.sent ? 
                            ((simulationData.metrics.packets.errors / simulationData.metrics.packets.sent) * 100).toFixed(2) : 
                            '0.00'
                        }%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-400 rounded-full" style={{ 
                          width: `${Math.min(100, simulationData.metrics.packets.sent ? 
                            (simulationData.metrics.packets.errors / simulationData.metrics.packets.sent) * 100 * 5 : 
                            0)}%` 
                        }}></div>
                      </div>
                    </div>
                    
                    {/* Shared internet packet loss */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Shared Internet</span>
                        <span className="font-medium text-gray-600">{sharedInternetData.packetLoss.toFixed(2)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${Math.min(100, sharedInternetData.packetLoss * 5)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column: Additional metrics */}
              <div className="space-y-6">
                {/* Bandwidth comparison */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Network className="h-4 w-4 text-indigo-600 mr-1.5" />
                      <h5 className="text-sm font-medium text-gray-800">Bandwidth</h5>
                    </div>
                    <div className="flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      <span className="text-xs font-semibold">{improvements.bandwidth}% better</span>
                    </div>
                  </div>
                  
                  <div className="mt-1.5 space-y-2">
                    {/* Your network bandwidth */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Your Network</span>
                        <span className="font-medium text-green-600">{simulationData.metrics.bandwidth.current.toFixed(0)}% utilized</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-400 rounded-full" style={{ width: `${simulationData.metrics.bandwidth.current}%` }}></div>
                      </div>
                    </div>
                    
                    {/* Shared internet bandwidth */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Shared Internet</span>
                        <span className="font-medium text-gray-600">{sharedInternetData.bandwidth.toFixed(0)}% utilized</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${sharedInternetData.bandwidth}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Security comparison */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-purple-600 mr-1.5" />
                      <h5 className="text-sm font-medium text-gray-800">Security</h5>
                    </div>
                    <div className="flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      <span className="text-xs font-semibold">{improvements.security}% better</span>
                    </div>
                  </div>
                  
                  <div className="mt-1.5 space-y-2">
                    {/* Your network security */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Your Network</span>
                        <span className="font-medium text-green-600">{simulationData.networkScores.security}% protected</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-400 rounded-full" style={{ width: `${simulationData.networkScores.security}%` }}></div>
                      </div>
                    </div>
                    
                    {/* Shared internet security */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500">Shared Internet</span>
                        <span className="font-medium text-gray-600">{sharedInternetData.security.toFixed(0)}% protected</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${sharedInternetData.security}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics card */}
        <div className="bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-medium text-gray-900">
              Network Metrics
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              type="button"
            >
              {showDetails ? "Show less" : "Show details"}
              <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-5">
            {/* Latency */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div className={`text-sm font-semibold ${getAnimationClass()}`}>
                  {(simulationData.metrics.latency.current / 10).toFixed(1)}
                  <span className="text-xs font-normal text-blue-700 ml-0.5">ms</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800">Latency</p>
              <p className="text-xs text-blue-700 mt-1 opacity-75">Network response time</p>
            </div>
            
            {/* Packet Success */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex justify-between items-center mb-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <div className={`text-sm font-semibold ${getAnimationClass()}`}>
                  {simulationData.metrics.packets.sent 
                    ? (100 - ((simulationData.metrics.packets.errors / simulationData.metrics.packets.sent) * 100)).toFixed(2)
                    : '100.00'}
                  <span className="text-xs font-normal text-green-700 ml-0.5">%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800">Packet Success</p>
              <p className="text-xs text-green-700 mt-1 opacity-75">Transmission reliability</p>
            </div>
            
            {/* Bandwidth */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
              <div className="flex justify-between items-center mb-2">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Network className="h-4 w-4 text-purple-600" />
                </div>
                <div className={`text-sm font-semibold ${getAnimationClass()}`}>
                  {simulationData.metrics.bandwidth.current.toFixed(0)}
                  <span className="text-xs font-normal text-purple-700 ml-0.5">%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800">Bandwidth</p>
              <p className="text-xs text-purple-700 mt-1 opacity-75">Available capacity</p>
            </div>
          </div>
          
          {/* Extended metrics */}
          {showDetails && (
            <div className="grid grid-cols-5 gap-3 mt-5">
              {Object.entries(simulationData.networkScores).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-500 capitalize">{key}</span>
                      <span className={`text-xs font-medium ${
                        value >= 80 ? 'text-green-600' :
                        value >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>{value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                      <div 
                        className={`h-1.5 rounded-full ${
                          value >= 80 ? 'bg-green-500' :
                          value >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Network data flow */}
          <div className={`flex items-center justify-center mt-5 h-10 relative ${isPaused ? '' : 'overflow-hidden'}`}>
            {!isPaused && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-1 bg-gray-100 relative">
                  {/* Animated data packets */}
                  <div className="absolute h-2 w-2 bg-blue-500 rounded-full animate-[dataFlow_3s_linear_infinite]" style={{left: '10%', top: '-2px'}}></div>
                  <div className="absolute h-2 w-2 bg-green-500 rounded-full animate-[dataFlow_2.5s_linear_infinite_0.5s]" style={{left: '20%', top: '-2px'}}></div>
                  <div className="absolute h-2 w-2 bg-purple-500 rounded-full animate-[dataFlow_4s_linear_infinite_1s]" style={{left: '30%', top: '-2px'}}></div>
                  <div className="absolute h-2 w-2 bg-amber-500 rounded-full animate-[dataFlow_3.5s_linear_infinite_1.5s]" style={{left: '50%', top: '-2px'}}></div>
                  <div className="absolute h-2 w-2 bg-indigo-500 rounded-full animate-[dataFlow_2.8s_linear_infinite_2s]" style={{left: '70%', top: '-2px'}}></div>
                  
                  <style jsx>{`
                    @keyframes dataFlow {
                      0% { transform: translateX(0); opacity: 0; }
                      10% { opacity: 1; }
                      90% { opacity: 1; }
                      100% { transform: translateX(800px); opacity: 0; }
                    }
                  `}</style>
                </div>
              </div>
            )}
            
            {isPaused && (
              <p className="text-sm text-blue-600 flex items-center">
                <Pause className="h-4 w-4 mr-1.5" />
                Simulation paused. Press play to resume data flow.
              </p>
            )}
          </div>
        </div>

        </div>

        {/* Status bar */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex-shrink-0">
          {simulationData.phase === 'initializing' && (
            <p className="text-sm text-amber-600 animate-pulse flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              Initializing network devices and establishing connections...
            </p>
          )}
          
          {simulationData.phase === 'running' && (
            <p className="text-sm text-blue-600 flex items-center">
              <Activity className="h-4 w-4 mr-1.5" />
              Simulating traffic flow across your network design. Observe performance in real-time.
            </p>
          )}
          
          {simulationData.phase === 'paused' && (
            <p className="text-sm text-amber-600 flex items-center">
              <Pause className="h-4 w-4 mr-1.5" />
              Simulation paused. Press play to continue.
            </p>
          )}
          
          {simulationData.phase === 'completed' && (
            <p className="text-sm text-green-600 flex items-center">
              <Shield className="h-4 w-4 mr-1.5" />
              Simulation completed successfully. Your network design shows excellent performance characteristics.
            </p>
          )}
          
          {simulationData.phase === 'error' && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              Simulation encountered an error. Please check your network design for issues.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}