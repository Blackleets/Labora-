
import React from 'react';
import { useData } from '../contexts/DataContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast: React.FC = () => {
  const { notifications, dismissNotification } = useData();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-xs sm:max-w-sm pointer-events-none">
      {notifications.map((notif) => (
        <div 
          key={notif.id} 
          className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-xl border transform transition-all duration-300 animate-in slide-in-from-right-full ${
            notif.type === 'success' 
              ? 'bg-white border-green-100 text-gray-800' 
              : notif.type === 'error'
              ? 'bg-white border-red-100 text-gray-800'
              : 'bg-white border-blue-100 text-gray-800'
          }`}
        >
          <div className={`p-2 rounded-full flex-shrink-0 ${
             notif.type === 'success' ? 'bg-green-100 text-green-600' : 
             notif.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {notif.type === 'success' && <CheckCircle size={18} />}
            {notif.type === 'error' && <AlertCircle size={18} />}
            {notif.type === 'info' && <Info size={18} />}
          </div>
          
          <p className="text-sm font-bold flex-1">{notif.message}</p>
          
          <button 
            onClick={() => dismissNotification(notif.id)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
