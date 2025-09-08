import { useState } from 'react';
import { FileText, Building, User, Phone, Mail, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import { LOAData } from './CrossConnectWorkflow';

interface LOAFormProps {
  onSubmit: (data: LOAData) => void;
  onCancel: () => void;
}

export function LOAForm({ onSubmit, onCancel }: LOAFormProps) {
  const [formData, setFormData] = useState<LOAData>({
    customerName: '',
    customerContact: '',
    customerEmail: '',
    customerPhone: '',
    datacenterLocation: '',
    cabinetNumber: '',
    requestedProvider: '',
    circuitType: '',
    bandwidth: '',
    requestedDate: '',
    technicalContact: '',
    billingContact: '',
    specialInstructions: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    const requiredFields: (keyof LOAData)[] = [
      'customerName', 'customerContact', 'customerEmail', 'customerPhone',
      'datacenterLocation', 'cabinetNumber', 'requestedProvider', 
      'circuitType', 'bandwidth', 'requestedDate', 'technicalContact', 'billingContact'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Email validation
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.customerPhone && !/^\+?[\d\s\-\(\)]+$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Please enter a valid phone number';
    }

    // Date validation (must be future date)
    if (formData.requestedDate) {
      const selectedDate = new Date(formData.requestedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.requestedDate = 'Requested date must be in the future';
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

  const handleInputChange = (field: keyof LOAData, value: string) => {
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
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Letter of Authorization (LOA)</h3>
            <p className="text-blue-700 text-sm">
              An LOA is required to authorize your service provider to install circuits in the datacenter. 
              Please provide accurate information as this will be used for the official authorization document.
            </p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company/Customer Name *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.customerName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter company or customer name"
            />
            {errors.customerName && (
              <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Contact Name *
            </label>
            <input
              type="text"
              value={formData.customerContact}
              onChange={(e) => handleInputChange('customerContact', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.customerContact ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter contact person name"
            />
            {errors.customerContact && (
              <p className="mt-1 text-sm text-red-600">{errors.customerContact}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customerEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="contact@company.com"
              />
            </div>
            {errors.customerEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customerPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            {errors.customerPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <Building className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Location Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datacenter Location *
            </label>
            <select
              value={formData.datacenterLocation}
              onChange={(e) => handleInputChange('datacenterLocation', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.datacenterLocation ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select datacenter location</option>
              <option value="Equinix DC2 - Ashburn">Equinix DC2 - Ashburn, VA</option>
              <option value="Equinix NY5 - Secaucus">Equinix NY5 - Secaucus, NJ</option>
              <option value="Equinix CH1 - Chicago">Equinix CH1 - Chicago, IL</option>
              <option value="Equinix SV1 - San Jose">Equinix SV1 - San Jose, CA</option>
              <option value="Digital Realty DFW1 - Dallas">Digital Realty DFW1 - Dallas, TX</option>
              <option value="CoreSite LA1 - Los Angeles">CoreSite LA1 - Los Angeles, CA</option>
            </select>
            {errors.datacenterLocation && (
              <p className="mt-1 text-sm text-red-600">{errors.datacenterLocation}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cabinet/Rack Number *
            </label>
            <input
              type="text"
              value={formData.cabinetNumber}
              onChange={(e) => handleInputChange('cabinetNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.cabinetNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., A12-05"
            />
            {errors.cabinetNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.cabinetNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Service Information */}
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Service Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Provider *
            </label>
            <select
              value={formData.requestedProvider}
              onChange={(e) => handleInputChange('requestedProvider', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.requestedProvider ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select provider</option>
              <option value="AT&T">AT&T</option>
              <option value="Verizon">Verizon</option>
              <option value="Lumen">Lumen</option>
              <option value="Zayo">Zayo</option>
              <option value="Comcast Business">Comcast Business</option>
              <option value="Spectrum Enterprise">Spectrum Enterprise</option>
              <option value="Cox Business">Cox Business</option>
              <option value="Other">Other</option>
            </select>
            {errors.requestedProvider && (
              <p className="mt-1 text-sm text-red-600">{errors.requestedProvider}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Circuit Type *
            </label>
            <select
              value={formData.circuitType}
              onChange={(e) => handleInputChange('circuitType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.circuitType ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select circuit type</option>
              <option value="Ethernet">Ethernet</option>
              <option value="Fiber">Fiber</option>
              <option value="MPLS">MPLS</option>
              <option value="Dark Fiber">Dark Fiber</option>
              <option value="Wavelength">Wavelength</option>
              <option value="Internet">Internet</option>
              <option value="Cloud Connect">Cloud Connect</option>
            </select>
            {errors.circuitType && (
              <p className="mt-1 text-sm text-red-600">{errors.circuitType}</p>
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
              Requested Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="date"
                min={getMinDate()}
                value={formData.requestedDate}
                onChange={(e) => handleInputChange('requestedDate', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.requestedDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.requestedDate && (
              <p className="mt-1 text-sm text-red-600">{errors.requestedDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Additional Contacts</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technical Contact *
            </label>
            <input
              type="text"
              value={formData.technicalContact}
              onChange={(e) => handleInputChange('technicalContact', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.technicalContact ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Name and contact information"
            />
            {errors.technicalContact && (
              <p className="mt-1 text-sm text-red-600">{errors.technicalContact}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Billing Contact *
            </label>
            <input
              type="text"
              value={formData.billingContact}
              onChange={(e) => handleInputChange('billingContact', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.billingContact ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Name and contact information"
            />
            {errors.billingContact && (
              <p className="mt-1 text-sm text-red-600">{errors.billingContact}</p>
            )}
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Instructions (Optional)
        </label>
        <textarea
          value={formData.specialInstructions || ''}
          onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter any special instructions or requirements"
        ></textarea>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </form>
  );
}