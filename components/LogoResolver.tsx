import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Car, CreditCard, FileText, Landmark, Package } from 'lucide-react';
import { getCuratedBrandMarkUrl } from './brandMarks';

export interface LogoResolverProps {
  id: string;
  name: string;
  domain?: string;
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
  const curatedUrl = useMemo(() => getCuratedBrandMarkUrl(id), [id]);
  const initialState = curatedUrl ? 0 : domain ? 1 : 2;
  const [loadState, setLoadState] = useState<0 | 1 | 2>(initialState);

  useEffect(() => {
    setLoadState(curatedUrl ? 0 : domain ? 1 : 2);
  }, [curatedUrl, domain]);

  const sizeConfig = {
    sm: { w: 'w-8', h: 'h-8', p: 'p-1.5', icon: 14, text: 'text-[10px]' },
    md: { w: 'w-12', h: 'h-12', p: 'p-2.5', icon: 20, text: 'text-xs' },
    lg: { w: 'w-16', h: 'h-16', p: 'p-3', icon: 28, text: 'text-sm' },
    xl: { w: 'w-24', h: 'h-24', p: 'p-4', icon: 36, text: 'text-lg' },
    '2xl': { w: 'w-32', h: 'h-32', p: 'p-6', icon: 48, text: 'text-xl' }
  };

  const s = sizeConfig[size] || sizeConfig.md;
  const containerClass = `${s.w} ${s.h} rounded-2xl flex items-center justify-center overflow-hidden bg-white relative border border-slate-100 ${className}`;

  if (loadState === 0 && curatedUrl) {
    return (
      <div className={`${containerClass} ${s.p}`}>
        <img
          src={curatedUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain"
          onError={() => setLoadState(domain ? 1 : 2)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (loadState === 1 && domain) {
    return (
      <div className={`${containerClass} ${s.p}`}>
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={`${name} logo`}
          className="h-full w-full object-contain"
          onError={() => setLoadState(2)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const getCategoryIcon = () => {
    switch (category) {
      case 'delivery': return <Package size={s.icon} />;
      case 'mobility': return <Car size={s.icon} />;
      case 'banking': return <Landmark size={s.icon} />;
      case 'payments': return <CreditCard size={s.icon} />;
      case 'accounting': return <FileText size={s.icon} />;
      default: return <Briefcase size={s.icon} />;
    }
  };

  return (
    <div className={`${containerClass} bg-[#F5F2ED] text-stone-500`} title={`${name}: marca no disponible`}>
      <div className="flex flex-col items-center justify-center gap-0.5">
        {getCategoryIcon()}
        {size !== 'sm' && <span className={`font-bold uppercase tracking-wider ${s.text}`}>{name.slice(0, 2)}</span>}
      </div>
    </div>
  );
};

export default LogoResolver;
