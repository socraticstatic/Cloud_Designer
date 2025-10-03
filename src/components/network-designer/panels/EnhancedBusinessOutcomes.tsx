import { useState } from 'react';
import { Target, Zap, Shield, Globe, DollarSign, CheckCircle2, TrendingUp, Activity, Clock, ArrowRight } from 'lucide-react';
import { useOutcomes } from '../context/OutcomesContext';

export function EnhancedBusinessOutcomes() {
  const { outcomes, updateOutcomes, hasOutcomes } = useOutcomes();
  const [activeSection, setActiveSection] = useState<'setup' | 'summary'>('setup');

  const handleSave = () => {
    setActiveSection('summary');
  };

  const renderSetup = () => (
    <div className="space-y-8">
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
          <Target className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Your Business Outcomes</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Set your network requirements and goals. Our AI will use these to generate optimized recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-500 rounded-lg mr-3">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Target Latency</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-blue-600">{outcomes.latency}ms</span>
              <span className="text-sm text-gray-600">Maximum acceptable</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={outcomes.latency}
              onChange={(e) => updateOutcomes({ latency: parseInt(e.target.value) })}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>10ms (Ultra-fast)</span>
              <span>200ms (Standard)</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-500 rounded-lg mr-3">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Bandwidth Requirement</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">{outcomes.bandwidth}</span>
              <span className="text-sm text-gray-600">Mbps</span>
            </div>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={outcomes.bandwidth}
              onChange={(e) => updateOutcomes({ bandwidth: parseInt(e.target.value) })}
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>100 Mbps</span>
              <span>10 Gbps</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-500 rounded-lg mr-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Availability Target</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-purple-600">{outcomes.availability}%</span>
              <span className="text-sm text-gray-600">Uptime SLA</span>
            </div>
            <input
              type="range"
              min="95"
              max="99.99"
              step="0.1"
              value={outcomes.availability}
              onChange={(e) => updateOutcomes({ availability: parseFloat(e.target.value) })}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>95% (Basic)</span>
              <span>99.99% (Enterprise)</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-red-500 rounded-lg mr-3">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Security Level</h3>
          </div>
          <div className="space-y-2">
            {(['basic', 'enhanced', 'enterprise'] as const).map((level) => (
              <button
                key={level}
                onClick={() => updateOutcomes({ security: level })}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  outcomes.security === level
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-white/60 text-gray-700 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{level}</span>
                  {outcomes.security === level && <CheckCircle2 className="h-4 w-4" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Requirements</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center space-x-3 p-4 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all">
            <input
              type="checkbox"
              checked={outcomes.redundancy}
              onChange={(e) => updateOutcomes({ redundancy: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <div>
              <div className="font-medium text-gray-900">Redundancy</div>
              <div className="text-sm text-gray-600">Backup paths for failover</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-4 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all">
            <input
              type="checkbox"
              checked={outcomes.multiRegion}
              onChange={(e) => updateOutcomes({ multiRegion: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <div>
              <div className="font-medium text-gray-900">Multi-Region</div>
              <div className="text-sm text-gray-600">Geographic distribution</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-4 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all">
            <input
              type="checkbox"
              checked={outcomes.complianceRequired}
              onChange={(e) => updateOutcomes({ complianceRequired: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <div>
              <div className="font-medium text-gray-900">Compliance</div>
              <div className="text-sm text-gray-600">Regulatory requirements</div>
            </div>
          </label>

          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
            <div className="font-medium text-gray-900 mb-2 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Cost Priority
            </div>
            <select
              value={outcomes.costPriority}
              onChange={(e) => updateOutcomes({ costPriority: e.target.value as 'low' | 'medium' | 'high' })}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="low">Low - Minimize costs</option>
              <option value="medium">Medium - Balanced</option>
              <option value="high">High - Performance first</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center shadow-lg text-lg font-semibold transition-all"
        >
          Generate AI Recommendations
          <ArrowRight className="h-5 w-5 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-green-500 rounded-full mr-4">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Business Outcomes Configured</h3>
            <p className="text-green-700">Your requirements are being analyzed by AI</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Latency</div>
          <div className="text-2xl font-bold text-blue-600">{outcomes.latency}ms</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Bandwidth</div>
          <div className="text-2xl font-bold text-green-600">{outcomes.bandwidth} Mbps</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Availability</div>
          <div className="text-2xl font-bold text-purple-600">{outcomes.availability}%</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Security</div>
          <div className="text-2xl font-bold text-red-600 capitalize">{outcomes.security}</div>
        </div>
      </div>

      <div className="flex space-x-4">
        {outcomes.redundancy && (
          <div className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
            <Zap className="h-4 w-4 mr-2" />
            Redundancy Enabled
          </div>
        )}
        {outcomes.multiRegion && (
          <div className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
            <Globe className="h-4 w-4 mr-2" />
            Multi-Region
          </div>
        )}
        {outcomes.complianceRequired && (
          <div className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
            <Shield className="h-4 w-4 mr-2" />
            Compliance Required
          </div>
        )}
      </div>

      <button
        onClick={() => setActiveSection('setup')}
        className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
      >
        ← Modify Business Outcomes
      </button>
    </div>
  );

  return (
    <div className="min-h-[400px]">
      {activeSection === 'setup' ? renderSetup() : renderSummary()}
    </div>
  );
}
