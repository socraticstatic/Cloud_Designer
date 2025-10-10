import { Target, Sparkles, Leaf, Cable, Settings } from 'lucide-react';

type PanelMode = 'assistant' | 'optimize' | 'advanced' | 'sustainability' | 'cross-connects';

interface PanelToggleProps {
  onToggle: (mode: PanelMode) => void;
  activeMode: PanelMode | null;
}

export function PanelToggle({ onToggle, activeMode }: PanelToggleProps) {
  const buttons = [
    { id: 'assistant' as const, icon: Target, label: 'Outcomes', color: 'blue' },
    { id: 'optimize' as const, icon: Sparkles, label: 'AI', color: 'blue' },
    { id: 'sustainability' as const, icon: Leaf, label: 'Sustainability', color: 'green' },
    { id: 'advanced' as const, icon: Settings, label: 'Parameters', color: 'gray' },
    { id: 'cross-connects' as const, icon: Cable, label: 'Cross-Connects', color: 'blue' }
  ];

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-2"
      style={{ zIndex: 80 }}
    >
      {buttons.map((button) => {
        const Icon = button.icon;
        const isActive = activeMode === button.id;

        let bgColor = 'bg-white';
        let textColor = 'text-gray-700';
        let hoverBg = 'hover:bg-gray-50';
        let activeBorder = '';

        if (isActive) {
          if (button.color === 'green') {
            bgColor = 'bg-green-50';
            textColor = 'text-green-700';
            activeBorder = 'ring-2 ring-green-500';
          } else if (button.color === 'gray') {
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-800';
            activeBorder = 'ring-2 ring-gray-500';
          } else {
            bgColor = 'bg-blue-50';
            textColor = 'text-blue-700';
            activeBorder = 'ring-2 ring-blue-500';
          }
        }

        return (
          <button
            key={button.id}
            onClick={() => onToggle(button.id)}
            className={`${bgColor} ${textColor} ${hoverBg} ${activeBorder} rounded-lg shadow-lg border border-gray-200 p-3 transition-all hover:shadow-xl group relative`}
            title={button.label}
          >
            <Icon className="h-5 w-5" />
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {button.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
