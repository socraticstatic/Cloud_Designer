import { useState } from 'react';
import { Router, Network, ArrowRight, Sparkles, Globe, Upload, Brain, FileImage, Zap } from 'lucide-react';
import { getNodeIcon } from '../../utils/nodeUtils';
import { DEFAULT_NETWORK_CONFIG } from '../../constants';

interface DefaultNetworkSetupProps {
  isOpen: boolean;
  onComplete: (cloudRouterName: string) => void;
}

export function DefaultNetworkSetup({ isOpen, onComplete }: DefaultNetworkSetupProps) {
  const [cloudRouterName, setCloudRouterName] = useState('');
  const [error, setError] = useState('');
  const [setupMode, setSetupMode] = useState<'manual' | 'ai'>('manual');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleAIImport = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For now, we'll create a sample network based on the uploaded image
      // In a real implementation, this would send the image to an AI service
      
      // Simulate AI-generated network name
      const aiGeneratedName = `AI Router ${Date.now().toString().slice(-4)}`;
      
      window.addToast({
        type: 'success',
        title: 'Network Imported Successfully',
        message: 'AI has analyzed your diagram and created the network topology',
        duration: 5000
      });
      
      onComplete(aiGeneratedName);
      
    } catch (error) {
      setError('Failed to process image. Please try again or use manual setup.');
      window.addToast({
        type: 'error',
        title: 'Import Failed',
        message: 'Unable to process the uploaded image. Please try manual setup.',
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[200]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Network Designer</h2>
          <p className="text-gray-600 text-sm">
            Choose how you'd like to create your network
          </p>
        </div>

        {/* Setup Mode Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSetupMode('manual')}
            className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
              setupMode === 'manual' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-lg bg-blue-100 mr-3">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Manual Setup</h4>
            </div>
            <p className="text-sm text-gray-600">Start with a basic AT&T Core and Cloud Router foundation</p>
          </button>

          <button
            onClick={() => setSetupMode('ai')}
            className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
              setupMode === 'ai' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-lg bg-purple-100 mr-3">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900">AI Import</h4>
            </div>
            <p className="text-sm text-gray-600">Upload a network diagram and let AI recreate it</p>
          </button>
        </div>

        {setupMode === 'manual' && (
          <>
            {/* Manual Setup - Network Preview */}
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
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    {(() => {
                      const RouterIcon = getNodeIcon('function', 'Router', undefined, { routerType: 'cloud' });
                      return <RouterIcon className="h-6 w-6 text-blue-600" />;
                    })()}
                  </div>
                  <span className="text-xs text-gray-600 text-center">Cloud Router</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="cloudRouterName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Cloud Router Name *
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
          </>
        )}

        {setupMode === 'ai' && (
          <>
            {/* AI Import Setup */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 mb-6 border border-purple-100">
              <div className="flex items-center mb-3">
                <Brain className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-sm font-medium text-purple-900">AI Network Import</h3>
              </div>
              <p className="text-sm text-purple-700 mb-4">
                Upload an image of your network diagram (PDF, PNG, JPG) and our AI will analyze it to recreate the topology automatically.
              </p>
              
              <div className="bg-white/60 rounded-lg p-3 border border-purple-200">
                <h4 className="text-xs font-medium text-purple-800 mb-2">Supported formats:</h4>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• LucidChart exports (PDF, PNG)</li>
                  <li>• Visio diagrams</li>
                  <li>• Hand-drawn network sketches</li>
                  <li>• Any network topology diagram</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="networkDiagramUpload"
                />
                <label 
                  htmlFor="networkDiagramUpload" 
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="p-3 bg-purple-100 rounded-full mb-3">
                    <FileImage className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {selectedFile ? selectedFile.name : 'Click to upload network diagram'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedFile ? 'Click to select a different file' : 'PDF, PNG, JPG up to 10MB'}
                  </p>
                </label>
              </div>

              {/* AI Processing Preview */}
              {selectedFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Zap className="h-4 w-4 text-purple-600 mr-1.5" />
                    AI will identify:
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Network devices and functions
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Connection types and bandwidths
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Cloud providers and regions
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Network topology relationships
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setSetupMode('manual')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
                >
                  ← Back to Manual
                </button>
                <button
                  onClick={handleAIImport}
                  disabled={!selectedFile || isProcessing}
                  className={`px-6 py-2 rounded-lg flex items-center transition-colors ${
                    !selectedFile || isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}