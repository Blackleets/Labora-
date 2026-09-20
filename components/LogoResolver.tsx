import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Car, CreditCard, FileText, Landmark, Package } from 'lucide-react';
import {
  getCuratedBrandMarkUrl,
  getGoogleFaviconUrl,
  getLocalBrandMarkUrl,
  isDarkGlyphBrand
} from './brandMarks';

export interface LogoResolverProps {
  id: string;
  name: string;
  domain?: string;
  category?: 'delivery' | 'mobility' | 'banking' | 'payments' | 'accounting' | 'other';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Fallback chain (fail-closed, never blank):
 * local geometric SVG → curated Simple Icons → Google favicon → letter avatar.
 * Clearbit omitted (API dead → empty image that never fires onError).
 */
type LoadStep = 'local' | 'curated' | 'favicon' | 'placeholder';

const LogoResolver: React.FC<LogoResolverProps> = ({
  id,
  name,
  domain,
  category = 'other',
  className = '',
  size = 'md'
}) => {
  const localUrl = useMemo(() => getLocalBrandMarkUrl(id), [id]);
  const curatedUrl = useMemo(() => getCuratedBrandMarkUrl(id), [id]);
  const faviconUrl = useMemo(
    () => (domain ? getGoogleFaviconUrl(domain) : undefined),
    [domain]
  );
  const darkGlyph = isDarkGlyphBrand(id);

  const initialStep = useMemo((): LoadStep => {
    if (localUrl) return 'local';
    if (curatedUrl) return 'curated';
    if (faviconUrl) return 'favicon';
    return 'placeholder';
  }, [localUrl, curatedUrl, faviconUrl]);

  const [step, setStep] = useState<LoadStep>(initialStep);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  const advance = () => {
    setStep((current) => {
      const order: LoadStep[] = ['local', 'curated', 'favicon', 'placeholder'];
      const idx = order.indexOf(current);
      for (let i = idx + 1; i < order.length; i++) {
        const next = order[i];
        if (next === 'curated' && curatedUrl) return next;
        if (next === 'favicon' && faviconUrl) return next;
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
  const chipBg =
    darkGlyph && step === 'curated'
      ? 'border border-[#1A1A1A] bg-[#0A0A0A] shadow-[0_1px_2px_rgba(0,0,0,0.2)]'
      : 'border border-[color:var(--labora-border,#E3DCD2)] bg-[color:var(--labora-surface,#FFFEFB)] shadow-[0_1px_2px_rgba(46,90,68,0.04)]';

  const containerClass = [
    s.w,
    s.h,
    'rounded-2xl flex items-center justify-center overflow-hidden relative shrink-0',
    chipBg,
    className
  ].join(' ');

  const letters = (name || id || '?')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || '?';

  const renderRemote = (src: string) => (
    <div className={`${containerClass} ${s.p}`} title={name}>
      {/* Letter underlay — visible if remote paint fails without firing onError */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center font-bold uppercase tracking-[0.12em] text-[color:var(--labora-muted,#5C6B5F)]/35 ${s.text}`}
      >
        {letters}
      </span>
      <img
        src={src}
        alt={`${name} logo`}
        className="relative z-[1] h-full w-full object-contain"
        onError={advance}
        loading="lazy"
        referrerPolicy="no-referrer"
        decoding="async"
      />
    </div>
  );

  if (step === 'local' && localUrl) return renderRemote(localUrl);
  if (step === 'curated' && curatedUrl) return renderRemote(curatedUrl);
  if (step === 'favicon' && faviconUrl) return renderRemote(faviconUrl);

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
      className={`${containerClass} bg-[color:var(--labora-moss-soft,#F5F2ED)] text-[color:var(--labora-primary,#2E5A44)]/80`}
      title={`${name}: marca no disponible`}
    >
      <div className="flex flex-col items-center justify-center gap-0.5 px-1">
        {getCategoryIcon()}
        {size !== 'sm' && (
          <span
            className={`font-bold uppercase tracking-[0.12em] text-[color:var(--labora-muted,#5C6B5F)] ${s.text}`}
            style={{ fontFamily: "var(--labora-font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)" }}
          >
            {letters}
          </span>
        )}
      </div>
    </div>
  );
};

export default LogoResolver;
