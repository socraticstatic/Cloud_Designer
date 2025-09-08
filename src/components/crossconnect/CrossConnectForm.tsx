import { useState } from 'react';
import { Network, Calendar, Clock, User, ArrowRight, Info } from 'lucide-react';
import { LOAData, CrossConnectData } from './CrossConnectWorkflow';
import { CrossConnectVisualizer } from './CrossConnectVisualizer';

interface CrossConnectFormProps {
  loaData: LOAData;
  onSubmit: (data: CrossConnectData) => void;
  onCancel: () => void;
}

export function CrossConnectForm({ loaData, onSubmit, onCancel }: CrossConnectFormProps) {
  const [formData, setFormData] = useState<CrossConnectData>({
    loaReference: `LOA-${Date.now().toString().slice(-6)}`,
    sourceLocation: loaData.datacenterLocation,
    targetLocation: '',
    connectionType: 'fiber',
    redundancy: 'single',
    bandwidth: loaData.bandwidth,
    installationDate: '',
    maintenanceWindow: '',
    emergencyContact: '',
    testingRequirements: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    const requiredFields: (keyof CrossConnectData)[] = [
      'sourceLocation', 'targetLocation', 'connectionType', 
      'redundancy', 'bandwidth', 'installationDate', 
      'maintenanceWindow', 'emergencyContact'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // VLAN validation (if provided)
    if (formData.vlanId !== undefined) {
      const vlanId = Number(formData.vlanId);
      if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
        newErrors.vlanId = 'VLAN ID must be between 1 and 4094';
      }
    }

    // Date validation (must be future date)
    if (formData.installationDate) {
      const selectedDate = new Date(formData.installationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.installationDate = 'Installation date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    } else {
      window.addToast({
        type: 'error',
        title: 'Form Validation Error',
        message: 'Please correct the errors in the form before submitting.',
        duration: 5000
      });
    }
  };

  const handleInputChange = (field: keyof CrossConnectData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Cross-Connect Configuration</h3>
            <p className="text-blue-700 text-sm">
              Now that your LOA has been approved, you can configure the technical details of your cross-connect.
              This information will be used to provision the physical connection in the datacenter.
            </p>
          </div>
        </div>
      </div>

      {/* LOA Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">LOA Reference</h4>
            <p className="text-lg font-semibold text-gray-900">{formData.loaReference}</p>
          </div>
          <div className="text-right">
            <h4 className="text-sm font-medium text-gray-700">Approved For</h4>
            <p className="text-lg font-semibold text-gray-900">{loaData.customerName}</p>
          </div>
        </div>
      </div>
      
      {/* Connection Visualizer */}
      <div className="py-3">
        <CrossConnectVisualizer
          sourceLocation={formData.sourceLocation}
          targetLocation={formData.targetLocation || "Please specify target location"}
          connectionType={formData.connectionType}
          bandwidth={formData.bandwidth}
          status="planning"
          animated={false}
        />
      </div>

      {/* Connection Details */}
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <Network className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Connection Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Location *
            </label>
            <input
              type="text"
              value={formData.sourceLocation}
              onChange={(e) => handleInputChange('sourceLocation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">
              This is the datacenter location from your approved LOA
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Location *
            </label>
            <input
              type="text"
              value={formData.targetLocation}
              onChange={(e) => handleInputChange('targetLocation', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.targetLocation ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Cabinet B12-03, Meet-Me Room"
            />
            {errors.targetLocation && (
              <p className="mt-1 text-sm text-red-600">{errors.targetLocation}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Type *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.connectionType === 'fiber'}
                  onChange={() => handleInputChange('connectionType', 'fiber')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Fiber</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.connectionType === 'copper'}
                  onChange={() => handleInputChange('connectionType', 'copper')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Copper</span>
              </label>
            </div>
            {errors.connectionType && (
              <p className="mt-1 text-sm text-red-600">{errors.connectionType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Redundancy *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.redundancy === 'single'}
                  onChange={() => handleInputChange('redundancy', 'single')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Single Connection</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.redundancy === 'dual'}
                  onChange={() => handleInputChange('redundancy', 'dual')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Dual (Redundant)</span>
              </label>
            </div>
            {errors.redundancy && (
              <p className="mt-1 text-sm text-red-600">{errors.redundancy}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bandwidth *
            </label>
            <select
              value={formData.bandwidth}
              onChange={(e) => handleInputChange('bandwidth', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.bandwidth ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select bandwidth</option>
              <option value="1 Gbps">1 Gbps</option>
              <option value="10 Gbps">10 Gbps</option>
              <option value="40 Gbps">40 Gbps</option>
              <option value="100 Gbps">100 Gbps</option>
              <option value="400 Gbps">400 Gbps</option>
            </select>
            {errors.bandwidth && (
              <p className="mt-1 text-sm text-red-600">{errors.bandwidth}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VLAN ID (Optional)
            </label>
            <input
              type="number"
              min="1"
              max="4094"
              value={formData.vlanId || ''}
              onChange={(e) => handleInputChange('vlanId', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.vlanId ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="1-4094"
            />
            {errors.vlanId && (
              <p className="mt-1 text-sm text-red-600">{errors.vlanId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave blank if not using VLANs or if using provider-assigned VLAN
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Information */}
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Schedule Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Installation Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="date"
                min={getMinDate()}
                value={formData.installationDate}
                onChange={(e) => handleInputChange('installationDate', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.installationDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.installationDate && (
              <p className="mt-1 text-sm text-red-600">{errors.installationDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maintenance Window *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={formData.maintenanceWindow}
                onChange={(e) => handleInputChange('maintenanceWindow', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.maintenanceWindow ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select maintenance window</option>
                <option value="Business Hours (9AM-5PM)">Business Hours (9AM-5PM)</option>
                <option value="After Hours (6PM-10PM)">After Hours (6PM-10PM)</option>
                <option value="Weekend (Sat-Sun)">Weekend (Sat-Sun)</option>
                <option value="Overnight (12AM-6AM)">Overnight (12AM-6AM)</option>
              </select>
            </div>
            {errors.maintenanceWindow && (
              <p className="mt-1 text-sm text-red-600">{errors.maintenanceWindow}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Contact *
          </label>
          <input
            type="text"
            value={formData.emergencyContact}
            onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.emergencyContact ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Name and 24/7 contact information"
          />
          {errors.emergencyContact && (
            <p className="mt-1 text-sm text-red-600">{errors.emergencyContact}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This contact will be used for any urgent issues during installation
          </p>
        </div>
      </div>

      {/* Additional Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Testing Requirements (Optional)
        </label>
        <textarea
          value={formData.testingRequirements || ''}
          onChange={(e) => handleInputChange('testingRequirements', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Specify any testing requirements or acceptance criteria"
        ></textarea>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          Submit Cross-Connect Request
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </form>
  );
}