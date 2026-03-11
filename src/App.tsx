import { useState } from 'react';
import { NetworkDesigner } from './components/NetworkDesigner';
import { ToastContainer } from './components/common/ToastContainer';
import { ConnectionConfig } from './types';

function App() {
  const [isReadOnly, setIsReadOnly] = useState(false);

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

  return (
    <div className="min-h-screen p-6 flex flex-col">
      {/* Navigation Header */}
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Cloud Designer</h1>

          <div className="flex space-x-4">
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
          </div>
        </div>
      </header>

      <div className="flex-grow">
        <NetworkDesigner
          onComplete={handleComplete}
          onCancel={handleCancel}
          isReadOnly={isReadOnly}
        />
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;