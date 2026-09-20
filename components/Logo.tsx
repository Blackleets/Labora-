import React from 'react';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';
type LogoTone = 'dark' | 'light';
/** Mark geometry variants — default `ascent` is the primary brand */
export type MarkVariant = 'ascent' | 'fold' | 'signal';

interface SharedLogoProps {
  size?: LogoSize;
  className?: string;
  /** Color tone for wordmark text */
  variant?: LogoTone;
  /** Mark geometry */
  markVariant?: MarkVariant;
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

/**
 * Labora+ mark — geometric dual-ascent symbol.
 * Suggests clarity + rising path + dual entities (autónomo ↔ gestoría)
 * without literal bike/briefcase or monogram-in-squircle.
 */
function MarkGlyph({
  gid,
  markVariant
}: {
  gid: string;
  markVariant: MarkVariant;
}) {
  if (markVariant === 'fold') {
    /* Twin ascending chevrons — dual entities rising into clarity */
    return (
      <>
        <path
          d="M17 47.5L32 30.5L47 47.5H39.6L32 38.2L24.4 47.5H17Z"
          fill="#C9A574"
        />
        <path
          d="M14 38L32 17L50 38H42.2L32 26.2L21.8 38H14Z"
          fill="#FFFEFB"
        />
        <circle cx="32" cy="17" r="3.25" fill="#C96846" />
      </>
    );
  }

  if (markVariant === 'signal') {
    /* Three ascending capsules on a diagonal — refined signal, not a chart */
    return (
      <>
        <path
          d="M16 46 L26 36"
          stroke="#FFFEFB"
          strokeOpacity="0.5"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <path
          d="M24 42 L38 28"
          stroke="#FFFEFB"
          strokeOpacity="0.78"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <path
          d="M32 36 L48 20"
          stroke="#FFFEFB"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <circle cx="48" cy="20" r="3.4" fill="#C96846" />
      </>
    );
  }

  /* Default: ascent — dual parallel beams rising SW→NE with clay apex */
  return (
    <>
      {/* Secondary beam — partnership / gestoría (champagne) */}
      <path
        d="M20 52 L50 22"
        stroke="#C9A574"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      {/* Primary beam — clarity path / autónomo (ivory) */}
      <path
        d="M13 47 L44 16"
        stroke="#FFFEFB"
        strokeWidth="9.5"
        strokeLinecap="round"
      />
      {/* Apex node — the + moment */}
      <circle cx="44" cy="16" r="4.6" fill="#C96846" />
      <circle cx="44" cy="16" r="1.7" fill="#FFFEFB" fillOpacity="0.95" />
    </>
  );
}

/** App icon — soft squircle + distinctive geometric glyph */
export const LogoMark: React.FC<
  SharedLogoProps & { title?: string }
> = ({
  size = 'md',
  className = '',
  animated = false,
  markVariant = 'ascent',
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
          <linearGradient
            id={`markFill-${gid}`}
            x1="6"
            y1="0"
            x2="58"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0A2E23" />
            <stop offset="0.42" stopColor="#0F3D2E" />
            <stop offset="1" stopColor="#1A5240" />
          </linearGradient>
          <linearGradient
            id={`markSheen-${gid}`}
            x1="10"
            y1="2"
            x2="32"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" stopOpacity="0.16" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <radialGradient
            id={`markGlow-${gid}`}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(40 18) rotate(90) scale(28 28)"
          >
            <stop stopColor="#C9A574" stopOpacity="0.22" />
            <stop offset="1" stopColor="#C9A574" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="15" fill={`url(#markFill-${gid})`} />
        <rect width="64" height="64" rx="15" fill={`url(#markGlow-${gid})`} />
        <rect width="64" height="64" rx="15" fill={`url(#markSheen-${gid})`} />
        <MarkGlyph gid={gid} markVariant={markVariant} />
      </svg>
    </div>
  );
};

/** Wordmark — Labora ExtraBold + refined clay/champagne + */
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
      style={{
        fontFamily:
          "var(--labora-font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)"
      }}
    >
      Labora<span className={`${plusColor} font-extrabold`}>+</span>
    </span>
  );
};

/** Horizontal lockup — mark + wordmark */
export const LogoLockup: React.FC<
  SharedLogoProps & { showText?: boolean }
> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'light',
  markVariant = 'ascent',
  animated = false
}) => {
  const config = SIZE[size];

  return (
    <div className={`flex items-center ${config.gap} ${className}`} aria-label="Labora+">
      <LogoMark size={size} animated={animated} markVariant={markVariant} />
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
  markVariant = 'ascent',
  animated = false
}) => (
  <LogoLockup
    size={size}
    showText={showText}
    className={className}
    variant={variant}
    markVariant={markVariant}
    animated={animated}
  />
);

export default Logo;
