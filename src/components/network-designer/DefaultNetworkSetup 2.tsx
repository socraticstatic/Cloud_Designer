import { useState } from 'react';
import { Router, Network, ArrowRight, Sparkles, Globe } from 'lucide-react';
import { getNodeIcon } from '../../utils/nodeUtils';
import { DEFAULT_NETWORK_CONFIG } from '../../constants';

interface DefaultNetworkSetupProps {
  isOpen: boolean;
  onComplete: (cloudRouterName: string) => void;
}

export function DefaultNetworkSetup({ isOpen, onComplete }: DefaultNetworkSetupProps) {
  const [cloudRouterName, setCloudRouterName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cloudRouterName.trim()) {
      setError('Cloud router name is required');
      return;
    }
    
    onComplete(cloudRouterName.trim());
    
    // Reset form
    setCloudRouterName('');
    setError('');
  };

  const handleInputChange = (value: string) => {
    setCloudRouterName(value);
    if (error) {
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[200]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Network Designer</h2>
          <p className="text-gray-600 text-sm">
            Let's start by setting up your default network configuration
          </p>
        </div>

        {/* Network Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Your starting network will include:</h3>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                <Globe className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-xs text-gray-600 text-center">AT&T Core</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-300 relative">
              <ArrowRight className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                {(() => {
                  const RouterIcon = getNodeIcon('function', 'Router');
                  return <RouterIcon className="h-6 w-6 text-purple-600" />;
                })()}
              </div>
              <span className="text-xs text-gray-600 text-center">Cloud Router</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="cloudRouterName" className="block text-sm font-medium text-gray-700 mb-2">
              Cloud Router Name *
            </label>
            <input
              type="text"
              id="cloudRouterName"
              value={cloudRouterName}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="e.g., Main Gateway Router, HQ Router"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Give your cloud router a descriptive name that identifies its role in your network
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            >
              Create Network
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}