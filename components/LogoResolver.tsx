import React, { useEffect, useMemo, useState } from 'react';
import {
  BrandMarkSvg,
  getInlineBrandIcon
} from './brandIcons';
import {
  getCuratedBrandMarkUrl,
  getGoogleFaviconUrl,
  getLocalBrandMarkUrl,
  getPlatformLetterAccent,
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
 * inline Simple Icons → curated CDN → local geometric SVG → Google favicon → letter avatar.
 * Clearbit omitted (API dead → empty image that never fires onError).
 */
type LoadStep = 'inline' | 'curated' | 'local' | 'favicon' | 'placeholder';

const LogoResolver: React.FC<LogoResolverProps> = ({
  id,
  name,
  domain,
  category = 'other',
  className = '',
  size = 'md'
}) => {
  const inlineIcon = useMemo(() => getInlineBrandIcon(id), [id]);
  const curatedUrl = useMemo(() => getCuratedBrandMarkUrl(id), [id]);
  const localUrl = useMemo(() => getLocalBrandMarkUrl(id), [id]);
  const faviconUrl = useMemo(
    () => (domain ? getGoogleFaviconUrl(domain) : undefined),
    [domain]
  );
  const darkGlyph = isDarkGlyphBrand(id) || Boolean(inlineIcon?.darkGlyph);

  const initialStep = useMemo((): LoadStep => {
    if (inlineIcon) return 'inline';
    if (curatedUrl) return 'curated';
    if (localUrl) return 'local';
    if (faviconUrl) return 'favicon';
    return 'placeholder';
  }, [inlineIcon, curatedUrl, localUrl, faviconUrl]);

  const [step, setStep] = useState<LoadStep>(initialStep);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  const advance = () => {
    setStep((current) => {
      const order: LoadStep[] = ['inline', 'curated', 'local', 'favicon', 'placeholder'];
      const idx = order.indexOf(current);
      for (let i = idx + 1; i < order.length; i++) {
        const next = order[i];
        if (next === 'inline' && inlineIcon) return next;
        if (next === 'curated' && curatedUrl) return next;
        if (next === 'local' && localUrl) return next;
        if (next === 'favicon' && faviconUrl) return next;
        if (next === 'placeholder') return next;
      }
      return 'placeholder';
    });
  };

  const sizeConfig = {
    sm: { w: 'w-9', h: 'h-9', p: 'p-1.5', icon: 14, text: 'text-[9px]', svg: 'h-[70%] w-[70%]' },
    md: { w: 'w-14', h: 'h-14', p: 'p-2.5', icon: 22, text: 'text-[10px]', svg: 'h-[72%] w-[72%]' },
    lg: { w: 'w-[4.5rem]', h: 'h-[4.5rem]', p: 'p-3', icon: 28, text: 'text-xs', svg: 'h-[74%] w-[74%]' },
    xl: { w: 'w-24', h: 'h-24', p: 'p-4', icon: 36, text: 'text-sm', svg: 'h-[76%] w-[76%]' },
    '2xl': { w: 'w-32', h: 'h-32', p: 'p-6', icon: 48, text: 'text-base', svg: 'h-[78%] w-[78%]' }
  };

  const s = sizeConfig[size] || sizeConfig.md;
  const accent = getPlatformLetterAccent(id, category);

  const chipBg =
    darkGlyph && (step === 'inline' || step === 'curated')
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

  if (step === 'inline' && inlineIcon) {
    return (
      <div className={`${containerClass} ${s.p}`} title={name}>
        <BrandMarkSvg icon={inlineIcon} className={s.svg} title={`${name} logo`} />
      </div>
    );
  }

  const renderRemote = (src: string) => (
    <div className={`${containerClass} ${s.p}`} title={name}>
      {/* Letter underlay — visible if remote paint fails without firing onError */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center font-bold uppercase tracking-[0.12em] ${s.text}`}
        style={{ color: `${accent.fg}55` }}
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

  if (step === 'curated' && curatedUrl) return renderRemote(curatedUrl);
  if (step === 'local' && localUrl) return renderRemote(localUrl);
  if (step === 'favicon' && faviconUrl) return renderRemote(faviconUrl);

  // Colored letter avatar — never blank white
  return (
    <div
      className={`${s.w} ${s.h} rounded-2xl flex items-center justify-center overflow-hidden relative shrink-0 ${className}`}
      style={{
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        color: accent.fg,
        boxShadow: '0 1px 2px rgba(46,90,68,0.04)'
      }}
      title={`${name}: marca no disponible`}
    >
      <span
        className={`font-bold uppercase tracking-[0.1em] ${s.text === 'text-[9px]' ? 'text-xs' : s.text === 'text-[10px]' ? 'text-sm' : 'text-base'}`}
        style={{ fontFamily: "var(--labora-font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)" }}
      >
        {letters}
      </span>
    </div>
  );
};

export default LogoResolver;
