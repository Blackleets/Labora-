
import React, { useState, useEffect } from 'react';
import { Package, Car, Building2, CreditCard, FileText, Briefcase, Zap, AlertTriangle, Landmark } from 'lucide-react';

export interface LogoResolverProps {
  id: string; // Used for local lookup: /brands/{id}.svg
  name: string; // Used for initials and seed
  domain?: string; // Used for remote lookup (clearbit)
  category?: 'delivery' | 'mobility' | 'banking' | 'payments' | 'accounting' | 'other';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const LogoResolver: React.FC<LogoResolverProps> = ({ 
  id, 
  name, 
  domain, 
  category = 'other', 
  className = '', 
  size = 'md' 
}) => {
  // 0: Init, 1: Local Failed/Try Remote, 2: Remote Failed/Show Placeholder
  const [loadState, setLoadState] = useState<0 | 1 | 2>(0);

  // Reset state if props change drastically
  useEffect(() => {
    setLoadState(0);
  }, [id, domain]);

  const handleLocalError = () => {
    if (domain) {
      setLoadState(1); // Try remote
    } else {
      setLoadState(2); // Give up, show placeholder
    }
  };

  const handleRemoteError = () => {
    setLoadState(2); // Show placeholder
  };

  // Dimensions based on size
  const sizeConfig = {
    sm: { w: 'w-8', h: 'h-8', p: 'p-1', icon: 14, text: 'text-[10px]' },
    md: { w: 'w-12', h: 'h-12', p: 'p-2', icon: 20, text: 'text-xs' },
    lg: { w: 'w-16', h: 'h-16', p: 'p-3', icon: 28, text: 'text-sm' },
    xl: { w: 'w-24', h: 'h-24', p: 'p-4', icon: 36, text: 'text-lg' },
    '2xl': { w: 'w-32', h: 'h-32', p: 'p-6', icon: 48, text: 'text-xl' }
  };

  const s = sizeConfig[size] || sizeConfig.md;
  const containerClass = `${s.w} ${s.h} rounded-2xl flex items-center justify-center overflow-hidden shadow-sm transition-all bg-white relative ${className}`;

  // --- RENDERERS ---

  // 1. Local File
  if (loadState === 0) {
    return (
      <div className={`${containerClass} border border-slate-100`}>
        <img 
          src={`/brands/${id}.svg`} 
          alt={name} 
          className="w-full h-full object-contain"
          onError={handleLocalError}
          loading="lazy"
        />
      </div>
    );
  }

  // 2. Remote API (Clearbit)
  if (loadState === 1 && domain) {
    return (
      <div className={`${containerClass} border border-slate-100`}>
        <img 
          src={`https://logo.clearbit.com/${domain}`} 
          alt={name} 
          className="w-full h-full object-contain"
          onError={handleRemoteError}
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Premium Placeholder (Fallback)
  const getGradient = (str: string) => {
    const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-400 to-green-600',
      'from-orange-400 to-red-500',
      'from-purple-500 to-pink-600',
      'from-cyan-400 to-blue-500',
      'from-slate-600 to-slate-800'
    ];
    return gradients[hash % gradients.length];
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'delivery': return <Package size={s.icon} className="text-white drop-shadow-md" />;
      case 'mobility': return <Car size={s.icon} className="text-white drop-shadow-md" />;
      case 'banking': return <Landmark size={s.icon} className="text-white drop-shadow-md" />;
      case 'payments': return <CreditCard size={s.icon} className="text-white drop-shadow-md" />;
      case 'accounting': return <FileText size={s.icon} className="text-white drop-shadow-md" />;
      default: return <Briefcase size={s.icon} className="text-white drop-shadow-md" />;
    }
  };

  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className={`${containerClass} bg-gradient-to-br ${getGradient(name)} border border-transparent`}>
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      
      {/* Icon Watermark */}
      <div className="absolute -bottom-2 -right-2 opacity-20 transform rotate-12 scale-150 text-white">
        {getCategoryIcon()}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Only show icon on larger sizes, initials on smaller */}
        {size === 'sm' ? (
           <span className={`font-black text-white leading-none ${s.text}`}>{initials}</span>
        ) : (
           <>
             <div className="mb-0.5">{getCategoryIcon()}</div>
             {size !== 'md' && <span className={`font-bold text-white uppercase tracking-widest opacity-90 ${s.text} scale-75`}>{initials}</span>}
           </>
        )}
      </div>
    </div>
  );
};

export default LogoResolver;
