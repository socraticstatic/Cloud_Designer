import { ReactNode } from 'react';
import { X, Target, Sparkles, Leaf, Cable, Settings } from 'lucide-react';

type PanelMode = 'assistant' | 'optimize' | 'advanced' | 'sustainability' | 'cross-connects' | null;

interface SidePanelProps {
  mode: PanelMode;
  onClose: () => void;
  onModeChange: (mode: PanelMode) => void;
  children: ReactNode;
}

export function SidePanel({ mode, onClose, onModeChange, children }: SidePanelProps) {
  if (!mode) return null;

  const tabs = [
    { id: 'assistant' as const, label: 'Business Outcomes', icon: Target, color: 'blue' },
    { id: 'optimize' as const, label: 'AI Recommendations', icon: Sparkles, color: 'blue' },
    { id: 'sustainability' as const, label: 'Sustainability', icon: Leaf, color: 'green' },
    { id: 'advanced' as const, label: 'Network Parameters', icon: Settings, color: 'gray' },
    { id: 'cross-connects' as const, label: 'Cross-Connects', icon: Cable, color: 'blue' }
  ];

  const currentTab = tabs.find(t => t.id === mode);

  return (
    <div
      className="fixed inset-y-0 right-0 w-[480px] bg-white border-l border-gray-200 shadow-2xl flex flex-col"
      style={{ zIndex: 120 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {currentTab && <currentTab.icon className="h-5 w-5 text-gray-700" />}
          <h3 className="text-sm font-semibold text-gray-900">
            {currentTab?.label || 'Panel'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-gray-200 bg-white overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = mode === tab.id;
          const colorClasses = isActive
            ? tab.color === 'green'
              ? 'text-green-600 border-green-600 bg-green-50'
              : 'text-blue-600 border-blue-600 bg-blue-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';

          return (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 border-transparent ${colorClasses}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}
