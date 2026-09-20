import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Car, CreditCard, FileText, Landmark, Package } from 'lucide-react';
import {
  getClearbitLogoUrl,
  getCuratedBrandMarkUrl,
  getGoogleFaviconUrl,
  getLocalBrandMarkUrl
} from './brandMarks';

export interface LogoResolverProps {
  id: string;
  name: string;
  domain?: string;
  category?: 'delivery' | 'mobility' | 'banking' | 'payments' | 'accounting' | 'other';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/** Fallback chain: curated Simple Icons → local geometric SVG → Google favicon → Clearbit → Lucide. */
type LoadStep = 'curated' | 'local' | 'favicon' | 'clearbit' | 'placeholder';

const LogoResolver: React.FC<LogoResolverProps> = ({
  id,
  name,
  domain,
  category = 'other',
  className = '',
  size = 'md'
}) => {
  const curatedUrl = useMemo(() => getCuratedBrandMarkUrl(id), [id]);
  const localUrl = useMemo(() => getLocalBrandMarkUrl(id), [id]);
  const faviconUrl = useMemo(
    () => (domain ? getGoogleFaviconUrl(domain) : undefined),
    [domain]
  );
  const clearbitUrl = useMemo(
    () => (domain ? getClearbitLogoUrl(domain) : undefined),
    [domain]
  );

  const initialStep = useMemo((): LoadStep => {
    if (curatedUrl) return 'curated';
    if (localUrl) return 'local';
    if (faviconUrl) return 'favicon';
    if (clearbitUrl) return 'clearbit';
    return 'placeholder';
  }, [curatedUrl, localUrl, faviconUrl, clearbitUrl]);

  const [step, setStep] = useState<LoadStep>(initialStep);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  const advance = () => {
    setStep((current) => {
      const order: LoadStep[] = ['curated', 'local', 'favicon', 'clearbit', 'placeholder'];
      const idx = order.indexOf(current);
      for (let i = idx + 1; i < order.length; i++) {
        const next = order[i];
        if (next === 'local' && localUrl) return next;
        if (next === 'favicon' && faviconUrl) return next;
        if (next === 'clearbit' && clearbitUrl) return next;
        if (next === 'placeholder') return next;
      }
      return 'placeholder';
    });
  };

  const sizeConfig = {
    sm: { w: 'w-9', h: 'h-9', p: 'p-1.5', icon: 14, text: 'text-[9px]' },
    md: { w: 'w-14', h: 'h-14', p: 'p-2.5', icon: 22, text: 'text-[10px]' },
    lg: { w: 'w-[4.5rem]', h: 'h-[4.5rem]', p: 'p-3', icon: 28, text: 'text-xs' },
    xl: { w: 'w-24', h: 'h-24', p: 'p-4', icon: 36, text: 'text-sm' },
    '2xl': { w: 'w-32', h: 'h-32', p: 'p-6', icon: 48, text: 'text-base' }
  };

  const s = sizeConfig[size] || sizeConfig.md;
  const containerClass = [
    s.w,
    s.h,
    'rounded-2xl flex items-center justify-center overflow-hidden relative shrink-0',
    'border border-[#E3DCD2] bg-[#FFFEFB] shadow-[0_1px_2px_rgba(46,90,68,0.04)]',
    className
  ].join(' ');

  const renderRemote = (src: string) => (
    <div className={`${containerClass} ${s.p}`}>
      <img
        src={src}
        alt={`${name} logo`}
        className="h-full w-full object-contain"
        onError={advance}
        loading="lazy"
        referrerPolicy="no-referrer"
        decoding="async"
      />
    </div>
  );

  if (step === 'curated' && curatedUrl) return renderRemote(curatedUrl);
  if (step === 'local' && localUrl) return renderRemote(localUrl);
  if (step === 'favicon' && faviconUrl) return renderRemote(faviconUrl);
  if (step === 'clearbit' && clearbitUrl) return renderRemote(clearbitUrl);

  const getCategoryIcon = () => {
    switch (category) {
      case 'delivery':
        return <Package size={s.icon} strokeWidth={1.75} />;
      case 'mobility':
        return <Car size={s.icon} strokeWidth={1.75} />;
      case 'banking':
        return <Landmark size={s.icon} strokeWidth={1.75} />;
      case 'payments':
        return <CreditCard size={s.icon} strokeWidth={1.75} />;
      case 'accounting':
        return <FileText size={s.icon} strokeWidth={1.75} />;
      default:
        return <Briefcase size={s.icon} strokeWidth={1.75} />;
    }
  };

  return (
    <div
      className={`${containerClass} bg-[#F5F2ED] text-[#2E5A44]/70`}
      title={`${name}: marca no disponible`}
    >
      <div className="flex flex-col items-center justify-center gap-0.5 px-1">
        {getCategoryIcon()}
        {size !== 'sm' && (
          <span
            className={`font-bold uppercase tracking-[0.12em] text-[#5C6B5F] ${s.text}`}
            style={{ fontFamily: "var(--labora-font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)" }}
          >
            {name.slice(0, 2)}
          </span>
        )}
      </div>
    </div>
  );
};

export default LogoResolver;
