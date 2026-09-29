
import React from 'react';
import { useData } from '../contexts/DataContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast: React.FC = () => {
  const { notifications, dismissNotification } = useData();

  if (notifications.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-[100] flex flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-sm"
    >
      {notifications.map((notif) => (
        <div 
          key={notif.id} 
          role={notif.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3 shadow-xl backdrop-blur-md transform transition-all duration-300 animate-in slide-in-from-bottom-4 sm:items-center sm:p-4 sm:slide-in-from-right-full ${
            notif.type === 'success' 
              ? 'border-green-100 bg-white/95 text-gray-800'
              : notif.type === 'error'
              ? 'border-red-100 bg-white/95 text-gray-800'
              : 'border-blue-100 bg-white/95 text-gray-800'
          }`}
        >
          <div className={`flex-shrink-0 rounded-full p-2 ${
             notif.type === 'success' ? 'bg-green-100 text-green-600' : 
             notif.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {notif.type === 'success' && <CheckCircle size={18} />}
            {notif.type === 'error' && <AlertCircle size={18} />}
            {notif.type === 'info' && <Info size={18} />}
          </div>
          
          <p className="flex-1 text-xs font-bold leading-5 sm:text-sm">{notif.message}</p>
          
          <button 
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => dismissNotification(notif.id)}
            className="-mr-1 -mt-1 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--labora-primary)] sm:mt-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
