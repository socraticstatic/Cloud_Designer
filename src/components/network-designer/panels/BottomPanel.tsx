import { ReactNode } from 'react';
import { ViewModeTabs } from '../tabs/ViewModeTabs';

type ViewMode = 'outcomes' | 'ai-recommendations' | 'sustainability' | 'cross-connects';

interface BottomPanelProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  children: ReactNode;
}

export function BottomPanel({ viewMode, setViewMode, children }: BottomPanelProps) {
  return (
    <div className="min-h-[300px] bg-white border-t border-gray-200">
      <ViewModeTabs
        viewMode={viewMode}
        onChange={setViewMode}
      />

      <div className="p-4">
        {children}
      </div>
    </div>
  );
}