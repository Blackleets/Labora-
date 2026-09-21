import React from 'react';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';
type LogoTone = 'dark' | 'light';
export type MarkVariant = 'ascent' | 'fold' | 'signal';

interface SharedLogoProps {
  size?: LogoSize;
  className?: string;
  variant?: LogoTone;
  markVariant?: MarkVariant;
  animated?: boolean;
  entrance?: boolean;
}

const SIZE = {
  sm: { mark: 30, text: 'text-[0.98rem]', gap: 'gap-2' },
  md: { mark: 38, text: 'text-lg', gap: 'gap-2.5' },
  lg: { mark: 50, text: 'text-[1.55rem]', gap: 'gap-3' },
  xl: { mark: 64, text: 'text-[2.05rem]', gap: 'gap-3.5' },
  hero: { mark: 82, text: 'text-[2.75rem]', gap: 'gap-4' }
} as const;

const BrandMarkSvg = ({ size }: { size: number }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="block h-full w-full">
      <defs>
        <linearGradient id={`laboraGreen-${id}`} x1="7" y1="7" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#082F25" />
          <stop offset="1" stopColor="#1B6549" />
        </linearGradient>
        <linearGradient id={`laboraOrange-${id}`} x1="34" y1="25" x2="58" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C74F1F" />
          <stop offset="1" stopColor="#E57A35" />
        </linearGradient>
      </defs>
      <rect x="21" y="2" width="22" height="34" rx="11" fill={`url(#laboraGreen-${id})`} />
      <rect x="2" y="21" width="34" height="22" rx="11" fill={`url(#laboraGreen-${id})`} />
      <rect x="28" y="21" width="34" height="22" rx="11" fill={`url(#laboraOrange-${id})`} />
      <rect x="21" y="28" width="22" height="34" rx="11" fill={`url(#laboraOrange-${id})`} />
      <rect x="28" y="13" width="8" height="38" rx="4" fill="#FFFDF7" />
      <rect x="13" y="28" width="38" height="8" rx="4" fill="#FFFDF7" />
    </svg>
  );
};

export const LogoMark: React.FC<SharedLogoProps & { title?: string }> = ({
  size = 'md',
  className = '',
  animated = false,
  entrance = false,
  title
}) => {
  const config = SIZE[size];
  return (
    <div
      className={`relative shrink-0 ${entrance ? 'labora-mark-squircle' : ''} ${animated && !entrance ? 'transition-transform duration-500 hover:-rotate-1 hover:scale-[1.03]' : ''} ${className}`}
      style={{ width: config.mark, height: config.mark, filter: 'drop-shadow(0 8px 12px rgba(28, 74, 52, 0.10))' }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      <BrandMarkSvg size={config.mark} />
    </div>
  );
};

export const LogoWordmark: React.FC<SharedLogoProps> = ({
  size = 'md',
  className = '',
  variant = 'light',
  entrance = false
}) => {
  const config = SIZE[size];
  const textColor = variant === 'dark' ? 'text-[#FFFDF7]' : 'text-[#0B402F]';
  const plusColor = variant === 'dark' ? 'text-[#E99056]' : 'text-[#0B402F]';

  return (
    <span
      className={`font-sans font-extrabold lowercase tracking-[-0.055em] ${config.text} ${textColor} ${entrance ? 'labora-wordmark-entrance' : ''} ${className}`}
      style={{ fontFamily: "var(--labora-font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)" }}
    >
      labora<span className={`${plusColor} font-extrabold`}>+</span>
    </span>
  );
};

export const LogoLockup: React.FC<SharedLogoProps & { showText?: boolean }> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'light',
  markVariant = 'ascent',
  animated = false,
  entrance = false
}) => {
  const config = SIZE[size];
  void markVariant;
  return (
    <div className={`flex items-center ${config.gap} ${entrance ? 'labora-logo-entrance' : ''} ${className}`} aria-label="labora+">
      <LogoMark size={size} animated={animated} entrance={entrance} />
      {showText && <LogoWordmark size={size} variant={variant} entrance={entrance} />}
    </div>
  );
};

interface LogoProps extends SharedLogoProps {
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'light',
  markVariant = 'ascent',
  animated = false,
  entrance = false
}) => (
  <LogoLockup
    size={size}
    showText={showText}
    className={className}
    variant={variant}
    markVariant={markVariant}
    animated={animated}
    entrance={entrance}
  />
);

export default Logo;
