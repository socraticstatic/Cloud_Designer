import { useState } from 'react';
import { Plus, Settings, BarChart3, SlidersHorizontal, Search, HelpCircle, Bell, User } from 'lucide-react';
import { NetworkDesigner } from './components/NetworkDesigner';
import { ToastContainer } from './components/common/ToastContainer';
import { ConnectionConfig } from './types';

const NAV_ITEMS = [
  { label: 'Create', icon: Plus, active: true },
  { label: 'Manage', icon: Settings, active: false },
  { label: 'Monitor', icon: BarChart3, active: false },
  { label: 'Configure', icon: SlidersHorizontal, active: false }
];

function App() {
  const [isReadOnly, setIsReadOnly] = useState(false);

  const handleComplete = (config: ConnectionConfig) => {
    console.log('Network design completed:', config);
    window.addToast({
      type: 'success',
      title: 'Design Saved',
      message: 'Network design updates have been saved',
      duration: 3000
    });
  };

  const handleCancel = () => {
    window.addToast({
      type: 'info',
      title: 'Design Cancelled',
      message: 'Network design has been cancelled',
      duration: 3000
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* AT&T NetBond Advanced header - per SDCI Figma */}
      <header className="h-16 flex items-center px-8 bg-white">
        <div className="flex-1 flex items-center">
          <span className="text-xl font-bold whitespace-nowrap">
            <span className="text-att-blue">AT&amp;T</span>{' '}
            <span className="text-fw-heading">
              NetBond<sup className="text-[9px] align-super">®</sup> Advanced
            </span>
          </span>
        </div>

        <nav className="flex items-center gap-2" aria-label="Primary">
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'text-fw-link'
                  : 'text-fw-body hover:bg-fw-wash'
              }`}
              type="button"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 flex items-center justify-end gap-1">
          <button className="p-2 rounded-lg text-fw-body hover:bg-fw-wash transition-colors" title="Search" type="button">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg text-fw-body hover:bg-fw-wash transition-colors" title="Help" type="button">
            <HelpCircle className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg text-fw-body hover:bg-fw-wash transition-colors" title="Notifications" type="button">
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-5 w-px bg-fw-border-secondary mx-1" />
          <button className="p-2 rounded-lg text-fw-body hover:bg-fw-wash transition-colors" title="Profile" type="button">
            <User className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex-grow px-6 pb-6">
        <NetworkDesigner
          onComplete={handleComplete}
          onCancel={handleCancel}
          isReadOnly={isReadOnly}
          onToggleReadOnly={() => setIsReadOnly(!isReadOnly)}
        />
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;
