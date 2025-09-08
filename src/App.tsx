import { useState, useEffect } from 'react';
import { NetworkDesigner } from './components/NetworkDesigner';
import { ToastContainer } from './components/common/ToastContainer';
import { ConnectionConfig } from './types';
import { CrossConnectWorkflow, LOAData, CrossConnectData } from './components/crossconnect/CrossConnectWorkflow';
import { CrossConnectsPanel } from './components/network-designer/panels/CrossConnectsPanel';
import { Network } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState<'designer' | 'crossconnect'>('designer');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [crossConnects, setCrossConnects] = useState<{
    id: string; 
    loa: LOAData; 
    connection: CrossConnectData;
    showInTopology?: boolean;
  }[]>([]);
  const [selectedCrossConnect, setSelectedCrossConnect] = useState<string | null>(null);
  const [showCrossConnectsPanel, setShowCrossConnectsPanel] = useState(false);

  // Load cross-connects from localStorage on mount
  useEffect(() => {
    const savedCrossConnects = localStorage.getItem('crossConnects');
    if (savedCrossConnects) {
      setCrossConnects(JSON.parse(savedCrossConnects));
    }
  }, []);

  // Save cross-connects to localStorage when they change
  useEffect(() => {
    if (crossConnects.length > 0) {
      localStorage.setItem('crossConnects', JSON.stringify(crossConnects));
    }
  }, [crossConnects]);
  
  const handleComplete = (config: ConnectionConfig) => {
    console.log('Network design completed:', config);
    window.addToast({
      type: 'success',
      title: 'Design Completed',
      message: 'Network design has been completed successfully',
      duration: 3000
    });
  };

  const handleCancel = () => {
    console.log('Design cancelled');
    window.addToast({
      type: 'info',
      title: 'Design Cancelled',
      message: 'Network design has been cancelled',
      duration: 3000
    });
  };
  
  const handleCrossConnectComplete = (loaData: LOAData, crossConnectData: CrossConnectData) => {
    console.log('Cross-connect completed:', { loaData, crossConnectData });
    
    // Add the new cross-connect to our state
    const newCrossConnect = {
      id: `cc-${Date.now()}`,
      loa: loaData,
      connection: crossConnectData
    };
    
    setCrossConnects(prev => [...prev, newCrossConnect]);
    
    window.addToast({
      type: 'success',
      title: 'Cross-Connect Completed',
      message: 'Your cross-connect has been added to your network',
      duration: 3000
    });
    
    // Return to network designer after completion
    setActiveView('designer');
    
    // Automatically show the cross-connects panel
    setShowCrossConnectsPanel(true);
  };
  
  const handleShowInTopology = (crossConnectId: string) => {
    setCrossConnects(prev => 
      prev.map(cc => 
        cc.id === crossConnectId 
          ? { ...cc, showInTopology: true } 
          : cc
      )
    );
    
    setSelectedCrossConnect(crossConnectId);
    
    window.addToast({
      type: 'info',
      title: 'Cross-Connect Added',
      message: 'Cross-connect has been added to your network topology',
      duration: 3000
    });
  };
  
  const handleCrossConnectCancel = () => {
    console.log('Cross-connect cancelled');
    window.addToast({
      type: 'info',
      title: 'Cross-Connect Cancelled',
      message: 'Cross-connect setup has been cancelled',
      duration: 3000
    });
    
    // Return to network designer after cancellation
    setActiveView('designer');
  };

  return (
    <div className="min-h-screen p-6 flex flex-col">
      {/* Navigation Header */}
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Cloud Designer</h1>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveView('designer')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === 'designer' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Network Design
            </button>
            
            <button
              onClick={() => setActiveView('crossconnect')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === 'crossconnect' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cross-Connect Setup
            </button>
            
            <button
              onClick={() => setIsReadOnly(!isReadOnly)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isReadOnly 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isReadOnly ? 'Edit Mode' : 'Read Only'}
            </button>
            
            {activeView === 'designer' && crossConnects.length > 0 && (
              <button
                onClick={() => setShowCrossConnectsPanel(!showCrossConnectsPanel)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showCrossConnectsPanel
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Network className="h-4 w-4 mr-2" />
                Your Cross-Connects
                <span className="ml-2 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                  {crossConnects.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>
      
      <div className="flex-grow">
        {activeView === 'designer' ? (
          <div className="flex flex-col h-full">
            <NetworkDesigner 
              onComplete={handleComplete} 
              onCancel={handleCancel}
              isReadOnly={isReadOnly}
              crossConnects={crossConnects.filter(cc => cc.showInTopology)}
              selectedCrossConnectId={selectedCrossConnect}
              onSelectCrossConnect={setSelectedCrossConnect} 
            />
            
            {/* Cross-Connects Panel */}
            {showCrossConnectsPanel && (
              <div className="mt-6 bg-white rounded-lg border-2 border-gray-200 p-6">
                <div className="max-w-4xl mx-auto">
                  <CrossConnectsPanel
                    crossConnects={crossConnects}
                    onShowInTopology={handleShowInTopology}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <CrossConnectWorkflow 
            onComplete={handleCrossConnectComplete}
            onCancel={handleCrossConnectCancel}
          />
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;