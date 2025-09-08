import { useState, useCallback, useEffect, useRef } from 'react';
import { Toast as ToastComponent, ToastType } from './Toast'; // Import the Toast component

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

// Declare the global window interface to add the toast function
declare global {
  interface Window {
    addToast: (toast: Omit<Toast, 'id'>) => void;
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToastRef = useRef<(toast: Omit<Toast, 'id'>) => void>();

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Initialize the addToast function only once
  useEffect(() => {
    addToastRef.current = (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { ...toast, id }]);
    };

    // Attach to window object
    window.addToast = (toast: Omit<Toast, 'id'>) => {
      addToastRef.current?.(toast);
    };

    // Cleanup on unmount
    return () => {
      // Optional: remove the function from window when component unmounts
      // delete window.addToast;
    };
  }, []);

  return (
    <div 
      className="fixed bottom-0 right-0 p-6 space-y-4 pointer-events-none" 
      style={{ zIndex: 9999 }} // Highest z-index in the application
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent 
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)} 
          />
        </div>
      ))}
    </div>
  );
}