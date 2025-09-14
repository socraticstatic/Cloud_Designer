import { ReactNode } from 'react';
import { ViewModeTabs } from '../tabs/ViewModeTabs';

type ViewMode = 'assistant' | 'optimize' | 'advanced';

interface BottomPanelProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  children: ReactNode;
}

export function BottomPanel({ viewMode, setViewMode, children }: BottomPanelProps) {
  return (
    <div className="min-h-[300px] bg-white border-t border-gray-200 p-4">
      <ViewModeTabs 
        viewMode={viewMode} 
        onChange={setViewMode} 
      />
      
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}