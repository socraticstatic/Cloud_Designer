import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Network, ArrowRight, Upload, Download, Eye } from 'lucide-react';
import { LOAForm } from './LOAForm';
import { CrossConnectForm } from './CrossConnectForm';
import { StatusTracker } from './StatusTracker';
import { DocumentViewer } from './DocumentViewer';
import { CrossConnectVisualizer } from './CrossConnectVisualizer';

export type WorkflowStep = 'loa-form' | 'loa-review' | 'loa-submitted' | 'loa-approved' | 'crossconnect-form' | 'crossconnect-submitted' | 'completed';

export interface LOAData {
  customerName: string;
  customerContact: string;
  customerEmail: string;
  customerPhone: string;
  datacenterLocation: string;
  cabinetNumber: string;
  requestedProvider: string;
  circuitType: string;
  bandwidth: string;
  requestedDate: string;
  technicalContact: string;
  billingContact: string;
  specialInstructions?: string;
}

export interface CrossConnectData {
  loaReference: string;
  sourceLocation: string;
  targetLocation: string;
  connectionType: 'fiber' | 'copper';
  redundancy: 'single' | 'dual';
  bandwidth: string;
  vlanId?: number;
  installationDate: string;
  maintenanceWindow: string;
  emergencyContact: string;
  testingRequirements?: string;
}

interface CrossConnectWorkflowProps {
  onComplete: (loaData: LOAData, crossConnectData: CrossConnectData) => void;
  onCancel: () => void;
}

export function CrossConnectWorkflow({ onComplete, onCancel }: CrossConnectWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('loa-form');
  const [loaData, setLoaData] = useState<LOAData | null>(null);
  const [crossConnectData, setCrossConnectData] = useState<CrossConnectData | null>(null);
  const [loaDocument, setLoaDocument] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [installationProgress, setInstallationProgress] = useState(0);

  // Simulate LOA approval process
  useEffect(() => {
    if (currentStep === 'loa-submitted') {
      // Simulate approval delay
      const timer = setTimeout(() => {
        setApprovalStatus('approved');
        setCurrentStep('loa-approved');
        window.addToast({
          type: 'success',
          title: 'LOA Approved',
          message: 'Your Letter of Authorization has been approved. You can now proceed with the cross-connect setup.',
          duration: 5000
        });
      }, 3000); // 3 second simulation

      return () => clearTimeout(timer);
    }
  }, [currentStep]);
  
  // Simulate installation progress
  useEffect(() => {
    if (currentStep === 'crossconnect-submitted') {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setInstallationProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Set a small delay before showing the completed state
          setTimeout(() => {
            setCurrentStep('completed');
          }, 1000);
        }
      }, 800);
      
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const handleLOASubmit = (data: LOAData) => {
    setLoaData(data);
    setCurrentStep('loa-review');
  };

  const handleLOAConfirm = () => {
    setCurrentStep('loa-submitted');
    window.addToast({
      type: 'info',
      title: 'LOA Submitted',
      message: 'Your Letter of Authorization has been submitted for approval.',
      duration: 3000
    });
  };

  const handleCrossConnectSubmit = (data: CrossConnectData) => {
    setCrossConnectData(data);
    setCurrentStep('crossconnect-submitted');
    
    // Show a notification about the pending installation
    window.addToast({
      type: 'success',
      title: 'Cross-Connect Requested',
      message: 'Your cross-connect request has been submitted and will be installed on the scheduled date.',
      duration: 5000
    });
  };
  
  const handleCompleteProcess = () => {
    // Complete the workflow
    if (loaData && crossConnectData) {
      onComplete(loaData, crossConnectData);
    }
  };

  const generateLOADocument = () => {
    if (!loaData) return;
    
    const doc = `
LETTER OF AUTHORIZATION

Customer Information:
- Name: ${loaData.customerName}
- Contact: ${loaData.customerContact}
- Email: ${loaData.customerEmail}
- Phone: ${loaData.customerPhone}

Service Details:
- Datacenter: ${loaData.datacenterLocation}
- Cabinet: ${loaData.cabinetNumber}
- Provider: ${loaData.requestedProvider}
- Circuit Type: ${loaData.circuitType}
- Bandwidth: ${loaData.bandwidth}
- Requested Date: ${loaData.requestedDate}

Contacts:
- Technical: ${loaData.technicalContact}
- Billing: ${loaData.billingContact}

${loaData.specialInstructions ? `Special Instructions: ${loaData.specialInstructions}` : ''}

This letter authorizes the above provider to install the requested circuit at the specified location.

Generated on: ${new Date().toLocaleDateString()}
    `.trim();
    
    setLoaDocument(doc);
  };

  const downloadLOA = () => {
    if (!loaDocument) return;
    
    const blob = new Blob([loaDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LOA-${loaData?.customerName?.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step) {
      case 'loa-form':
      case 'loa-review':
        return FileText;
      case 'loa-submitted':
        return Clock;
      case 'loa-approved':
        return CheckCircle;
      case 'crossconnect-form':
      case 'crossconnect-submitted':
        return Network;
      case 'completed':
        return CheckCircle;
      default:
        return FileText;
    }
  };

  const getStepTitle = (step: WorkflowStep) => {
    switch (step) {
      case 'loa-form':
        return 'Complete LOA Form';
      case 'loa-review':
        return 'Review LOA Details';
      case 'loa-submitted':
        return 'LOA Under Review';
      case 'loa-approved':
        return 'LOA Approved';
      case 'crossconnect-form':
        return 'Configure Cross-Connect';
      case 'crossconnect-submitted':
        return 'Cross-Connect Installation';
      case 'completed':
        return 'Process Complete';
      default:
        return 'Unknown Step';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cross-Connect Setup</h1>
          <p className="text-gray-600">Complete your Letter of Authorization and configure your cross-connect</p>
        </div>

        {/* Progress Tracker */}
        <StatusTracker currentStep={currentStep} />

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            {(() => {
              const Icon = getStepIcon(currentStep);
              return <Icon className="h-6 w-6 text-blue-600 mr-3" />;
            })()}
            <h2 className="text-xl font-semibold text-gray-900">{getStepTitle(currentStep)}</h2>
          </div>

          {/* Step Content */}
          {currentStep === 'loa-form' && (
            <LOAForm onSubmit={handleLOASubmit} onCancel={onCancel} />
          )}

          {currentStep === 'loa-review' && loaData && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Eye className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-blue-900">Review Your LOA Details</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Please review the information below carefully. Once submitted, changes will require a new LOA.
                </p>
              </div>

              <DocumentViewer data={loaData} type="loa" />

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep('loa-form')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back to Edit
                </button>
                <button
                  onClick={() => {
                    generateLOADocument();
                    handleLOAConfirm();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  Submit LOA
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'loa-submitted' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">LOA Under Review</h3>
              <p className="text-gray-600 mb-4">
                Your Letter of Authorization is being reviewed. This typically takes 1-2 business days.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 text-sm">Estimated approval time: 1-2 business days</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'loa-approved' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-medium text-green-900">LOA Approved!</h3>
                </div>
                <p className="text-green-700 text-sm">
                  Your Letter of Authorization has been approved. You can now proceed with configuring your cross-connect.
                </p>
              </div>

              {loaDocument && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Approved LOA Document</h4>
                    <button
                      onClick={downloadLOA}
                      className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-700 max-h-40 overflow-y-auto">
                    {loaDocument}
                  </div>
                </div>
              )}

              <button
                onClick={() => setCurrentStep('crossconnect-form')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                Configure Cross-Connect
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          )}

          {currentStep === 'crossconnect-form' && loaData && (
            <CrossConnectForm 
              loaData={loaData} 
              onSubmit={handleCrossConnectSubmit}
              onCancel={() => setCurrentStep('loa-approved')}
            />
          )}

          {currentStep === 'crossconnect-submitted' && crossConnectData && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Network className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-blue-900">Cross-Connect Installation In Progress</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Your cross-connect installation is now being processed. You'll receive updates as the work progresses.
                </p>
              </div>
              
              {/* Installation Progress Visualizer */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Installation Progress
                </h4>
                
                <div className="mb-2 flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-700">
                    {installationProgress < 100 ? 'Installing...' : 'Installation Complete'}
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {installationProgress}%
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${installationProgress}%` }}
                  ></div>
                </div>
                
                <div className="mt-8">
                  <CrossConnectVisualizer
                    sourceLocation={crossConnectData.sourceLocation}
                    targetLocation={crossConnectData.targetLocation}
                    connectionType={crossConnectData.connectionType}
                    bandwidth={crossConnectData.bandwidth}
                    status={installationProgress < 100 ? 'pending' : 'active'}
                    animated={installationProgress >= 100}
                  />
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Installation Date</p>
                    <p className="text-sm font-medium text-gray-900">{crossConnectData.installationDate}</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Installation Window</p>
                    <p className="text-sm font-medium text-gray-900">{crossConnectData.maintenanceWindow}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-1">Configuration Summary</h4>
                    <p className="text-sm text-gray-600">
                      Review your cross-connect configuration details
                    </p>
                  </div>
                  {installationProgress >= 100 && (
                    <button
                      onClick={() => setCurrentStep('completed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>
                
                <div className="mt-4">
                  <DocumentViewer data={crossConnectData} type="crossconnect" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 'completed' && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Process Complete!</h3>
              <p className="text-gray-600 mb-6">
                Your cross-connect setup is complete. You will receive updates via email as the installation progresses.
              </p>
              
              {crossConnectData && (
                <div className="mb-8 max-w-md mx-auto">
                  <CrossConnectVisualizer
                    sourceLocation={crossConnectData.sourceLocation}
                    targetLocation={crossConnectData.targetLocation}
                    connectionType={crossConnectData.connectionType}
                    bandwidth={crossConnectData.bandwidth}
                    status="completed"
                  />
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Next Steps</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Your cross-connect is now active and ready for use</li>
                  <li>• You'll receive a confirmation email with connection details</li>
                  <li>• Technical documentation will be available in your account</li>
                  <li>• Contact support for any issues with your connection</li>
                </ul>
              </div>
              
              <button
                onClick={handleCompleteProcess}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}