import React from 'react';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';
type LogoVariant = 'dark' | 'light';

interface SharedLogoProps {
  size?: LogoSize;
  className?: string;
  variant?: LogoVariant;
  animated?: boolean;
}

const SIZE = {
  sm: { mark: 28, text: 'text-[0.95rem]', gap: 'gap-2', rx: 7 },
  md: { mark: 36, text: 'text-lg', gap: 'gap-2.5', rx: 9 },
  lg: { mark: 48, text: 'text-2xl', gap: 'gap-3', rx: 12 },
  xl: { mark: 64, text: 'text-[2.15rem]', gap: 'gap-3.5', rx: 16 },
  hero: { mark: 80, text: 'text-[2.75rem]', gap: 'gap-4', rx: 20 }
} as const;

const uid = () => `labora-${Math.random().toString(36).slice(2, 9)}`;

/** App icon — soft squircle, deep forest, refined L+ monogram */
export const LogoMark: React.FC<SharedLogoProps & { title?: string }> = ({
  size = 'md',
  className = '',
  animated = false,
  title
}) => {
  const config = SIZE[size];
  const gid = React.useId().replace(/:/g, '') || uid();

  return (
    <div
      className={`relative shrink-0 overflow-hidden shadow-[0_10px_28px_rgba(15,61,46,0.22)] ring-1 ring-black/[0.04] ${animated ? 'transition-transform duration-500 hover:-rotate-1 hover:scale-[1.03]' : ''} ${className}`}
      style={{
        width: config.mark,
        height: config.mark,
        borderRadius: config.rx
      }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      <svg
        width={config.mark}
        height={config.mark}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-full w-full"
      >
        <defs>
          <linearGradient id={`markFill-${gid}`} x1="8" y1="2" x2="56" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0C3226" />
            <stop offset="0.45" stopColor="#0F3D2E" />
            <stop offset="1" stopColor="#1A5240" />
          </linearGradient>
          <linearGradient id={`markSheen-${gid}`} x1="12" y1="4" x2="28" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.14" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Soft squircle */}
        <rect width="64" height="64" rx="16" fill={`url(#markFill-${gid})`} />
        <rect width="64" height="64" rx="16" fill={`url(#markSheen-${gid})`} />
        {/* Geometric L — vertical stem + base */}
        <path
          d="M20 16.5V47.5H44.5"
          stroke="#FFFEFB"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Plus — clay accent, balanced in upper-right of L field */}
        <path
          d="M40.5 18.5V28.5M35.5 23.5H45.5"
          stroke="#C9A574"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

/** Wordmark — Labora in ExtraBold + clay/champagne + */
export const LogoWordmark: React.FC<SharedLogoProps> = ({
  size = 'md',
  className = '',
  variant = 'light'
}) => {
  const config = SIZE[size];
  const textColor = variant === 'dark' ? 'text-[#FFFEFB]' : 'text-[#0A1210]';
  const plusColor = variant === 'dark' ? 'text-[#C9A574]' : 'text-[#C96846]';

  return (
    <span
      className={`font-sans font-extrabold tracking-[-0.045em] ${config.text} ${textColor} ${className}`}
      style={{ fontFamily: "var(--labora-font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)" }}
    >
      Labora<span className={plusColor}>+</span>
    </span>
  );
};

/** Horizontal lockup — mark + wordmark (corporate product presence) */
export const LogoLockup: React.FC<SharedLogoProps & { showText?: boolean }> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'light',
  animated = false
}) => {
  const config = SIZE[size];

  return (
    <div className={`flex items-center ${config.gap} ${className}`} aria-label="Labora+">
      <LogoMark size={size} animated={animated} />
      {showText && <LogoWordmark size={size} variant={variant} />}
    </div>
  );
};

/** Backward-compatible default export used across Login / Sidebar / App */
interface LogoProps extends SharedLogoProps {
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'light',
  animated = false
}) => (
  <LogoLockup
    size={size}
    showText={showText}
    className={className}
    variant={variant}
    animated={animated}
  />
);

export default Logo;
