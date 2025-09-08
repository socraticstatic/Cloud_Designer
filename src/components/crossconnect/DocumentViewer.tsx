import { LOAData, CrossConnectData } from './CrossConnectWorkflow';
import { Calendar, Network, Building, User, Phone, Mail, Clock } from 'lucide-react';

interface DocumentViewerProps {
  data: LOAData | CrossConnectData;
  type: 'loa' | 'crossconnect';
}

export function DocumentViewer({ data, type }: DocumentViewerProps) {
  if (type === 'loa') {
    const loaData = data as LOAData;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5 border-b border-gray-100 pb-2">Letter of Authorization</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <User className="h-4 w-4 text-gray-500 mr-1.5" />
              Customer Information
            </h4>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Company/Customer Name</p>
                <p className="text-sm font-medium text-gray-900">{loaData.customerName}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Primary Contact</p>
                <p className="text-sm font-medium text-gray-900">{loaData.customerContact}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Mail className="h-3.5 w-3.5 text-gray-400 mr-1" />
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900">{loaData.customerEmail}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Phone className="h-3.5 w-3.5 text-gray-400 mr-1" />
                    Phone
                  </p>
                  <p className="text-sm font-medium text-gray-900">{loaData.customerPhone}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Location Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Building className="h-4 w-4 text-gray-500 mr-1.5" />
              Location Information
            </h4>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Datacenter Location</p>
                <p className="text-sm font-medium text-gray-900">{loaData.datacenterLocation}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Cabinet/Rack Number</p>
                <p className="text-sm font-medium text-gray-900">{loaData.cabinetNumber}</p>
              </div>
            </div>
          </div>
          
          {/* Service Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Network className="h-4 w-4 text-gray-500 mr-1.5" />
              Service Information
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Requested Provider</p>
                <p className="text-sm font-medium text-gray-900">{loaData.requestedProvider}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Circuit Type</p>
                <p className="text-sm font-medium text-gray-900">{loaData.circuitType}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Bandwidth</p>
                <p className="text-sm font-medium text-gray-900">{loaData.bandwidth}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 flex items-center">
                  <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1" />
                  Requested Date
                </p>
                <p className="text-sm font-medium text-gray-900">{loaData.requestedDate}</p>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <User className="h-4 w-4 text-gray-500 mr-1.5" />
              Additional Contacts
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-xs text-gray-500">Technical Contact</p>
                <p className="text-sm font-medium text-gray-900">{loaData.technicalContact}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Billing Contact</p>
                <p className="text-sm font-medium text-gray-900">{loaData.billingContact}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Special Instructions */}
        {loaData.specialInstructions && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Special Instructions</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {loaData.specialInstructions}
            </p>
          </div>
        )}
      </div>
    );
  } 
  else {
    const ccData = data as CrossConnectData;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5 border-b border-gray-100 pb-2">Cross-Connect Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connection Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Network className="h-4 w-4 text-gray-500 mr-1.5" />
              Connection Details
            </h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Source Location</p>
                  <p className="text-sm font-medium text-gray-900">{ccData.sourceLocation}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Target Location</p>
                  <p className="text-sm font-medium text-gray-900">{ccData.targetLocation}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Connection Type</p>
                  <p className="text-sm font-medium text-gray-900">{ccData.connectionType === 'fiber' ? 'Fiber Optic' : 'Copper'}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Redundancy</p>
                  <p className="text-sm font-medium text-gray-900">{ccData.redundancy === 'single' ? 'Single Connection' : 'Dual (Redundant)'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Bandwidth</p>
                  <p className="text-sm font-medium text-gray-900">{ccData.bandwidth}</p>
                </div>
                
                {ccData.vlanId && (
                  <div>
                    <p className="text-xs text-gray-500">VLAN ID</p>
                    <p className="text-sm font-medium text-gray-900">{ccData.vlanId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Schedule Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-1.5" />
              Schedule Information
            </h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1" />
                    Installation Date
                  </p>
                  <p className="text-sm font-medium text-gray-900">{ccData.installationDate}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3.5 w-3.5 text-gray-400 mr-1" />
                    Maintenance Window
                  </p>
                  <p className="text-sm font-medium text-gray-900">{ccData.maintenanceWindow}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 flex items-center">
                  <User className="h-3.5 w-3.5 text-gray-400 mr-1" />
                  Emergency Contact
                </p>
                <p className="text-sm font-medium text-gray-900">{ccData.emergencyContact}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Testing Requirements */}
        {ccData.testingRequirements && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Testing Requirements</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {ccData.testingRequirements}
            </p>
          </div>
        )}
        
        {/* Reference Number */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Cross-Connect Reference</p>
            <p className="text-sm font-medium text-gray-900">{ccData.loaReference}</p>
          </div>
          
          <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
            Installation Scheduled
          </div>
        </div>
      </div>
    );
  }
}