import React, { useId } from 'react';
import { useGhibliAtmosphere, type GhibliPalette } from '../contexts/GhibliAtmosphereContext';

export type AtmosphericPanelVariant = 'panel' | 'strip' | 'hero';

interface AtmosphericPanelProps {
  variant?: AtmosphericPanelVariant;
  className?: string;
  palette?: GhibliPalette;
}

/**
 * Editorial atmospheric panel — soft gradients, film grain, distant
 * abstract landforms and light orbs. Adult / private-banking calm.
 * No cartoon paths, fences, flowers, birds, or clipart meadow.
 */
const AtmosphericPanel: React.FC<AtmosphericPanelProps> = ({
  variant = 'panel',
  className = '',
  palette: paletteProp
}) => {
  const atmosphere = useGhibliAtmosphere();
  const palette = paletteProp ?? atmosphere.palette;
  const timeOfDay = atmosphere.timeOfDay;
  const isNight = timeOfDay === 'night';
  const isGolden = timeOfDay === 'golden_hour';
  const isDawn = timeOfDay === 'dawn';
  const uid = useId().replace(/:/g, '');
  const gid = (name: string) => `atm-${name}-${uid}`;

  const viewBox =
    variant === 'strip' ? '0 0 800 220' :
    variant === 'hero' ? '0 0 900 280' :
    '0 0 800 520';

  const preserve =
    variant === 'strip' || variant === 'hero' ? 'xMidYMid slice' : 'xMidYMax meet';

  const orbCx = variant === 'hero' ? 760 : 640;
  const orbCy = variant === 'strip' ? 42 : variant === 'hero' ? 38 : 72;
  const orbR = variant === 'strip' ? 48 : variant === 'hero' ? 56 : 78;
  const celestialX = variant === 'hero' ? 550 : variant === 'strip' ? 640 : 620;
  const celestialY = variant === 'panel' ? 88 : 42;
  const particles = [
    [48, 12], [142, 72], [235, 25], [318, 102], [410, 43],
    [505, 90], [602, 18], [685, 118], [772, 48], [842, 96]
  ];

  const skyTop = isNight
    ? '#D4E2EA'
    : isGolden
      ? '#E8D4B8'
      : isDawn
        ? '#E4D8C8'
        : '#C9D8E6';
  const skyMid = isNight
    ? '#E2EBE8'
    : isGolden
      ? '#EFE3D0'
      : isDawn
        ? '#EBE6DC'
        : '#D8E4DC';
  const earth = isNight
    ? palette.hillNear
    : isGolden
      ? '#D9CDB0'
      : palette.parchment;

  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio={preserve}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gid('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} stopOpacity="0.95" />
          <stop offset="42%" stopColor={skyMid} stopOpacity="0.85" />
          <stop offset="78%" stopColor={earth} stopOpacity="0.55" />
          <stop offset="100%" stopColor={palette.warmearth} stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={gid('orb')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.sunGlow} stopOpacity={isNight ? 0.55 : 0.75} />
          <stop offset="45%" stopColor={palette.sunGlow} stopOpacity={isNight ? 0.18 : 0.28} />
          <stop offset="100%" stopColor={palette.sunGlow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gid('soft-a')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.moss} stopOpacity="0.18" />
          <stop offset="100%" stopColor={palette.moss} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gid('soft-b')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.clay} stopOpacity="0.10" />
          <stop offset="100%" stopColor={palette.clay} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={gid('land-far')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hillFar} stopOpacity="0.22" />
          <stop offset="100%" stopColor={palette.hillFar} stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={gid('land-mid')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hillMid} stopOpacity="0.20" />
          <stop offset="100%" stopColor={palette.hillMid} stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id={gid('land-near')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.deepforest} stopOpacity="0.08" />
          <stop offset="100%" stopColor={palette.deepforest} stopOpacity="0.16" />
        </linearGradient>
        <filter id={gid('blur-soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id={gid('blur-land')} x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
        <filter id={gid('grain')}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="n" />
          <feColorMatrix type="saturate" values="0" in="n" result="g" />
          <feComponentTransfer in="g" result="g2">
            <feFuncA type="linear" slope="0.045" />
          </feComponentTransfer>
        </filter>
      </defs>

      {/* Base sky → earth wash */}
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid('sky')})`} />

      {/* Soft light orb (sun/moon abstraction — no hard disc cartoon) */}
      <circle
        cx={orbCx}
        cy={orbCy}
        r={orbR * 2.2}
        fill={`url(#${gid('orb')})`}
        filter={`url(#${gid('blur-soft')})`}
        opacity={isNight ? 0.7 : 0.9}
      />
      <circle
        cx={orbCx}
        cy={orbCy}
        r={orbR * 0.55}
        fill={palette.sunFill}
        opacity={isNight ? 0.35 : 0.28}
        filter={`url(#${gid('blur-soft')})`}
      />

      {/* The time and season are visible without covering the content. */}
      <g transform={`translate(${celestialX} ${celestialY})`} opacity="0.76">
        {isNight ? (
          <path d="M9 -24A26 26 0 1 0 25 9 22 22 0 0 1 9 -24Z" fill="#E9F4F5" stroke="#B5D5DD" strokeWidth="1.5" />
        ) : (
          <>
            <circle r={isGolden ? 24 : 21} fill={isGolden ? '#E6A05B' : palette.sunFill} />
            <circle r="31" fill="none" stroke={palette.sunGlow} strokeWidth="2" opacity="0.6" />
          </>
        )}
      </g>

      {(atmosphere.season === 'winter' || atmosphere.season === 'autumn' || atmosphere.season === 'spring') && (
        <g opacity={atmosphere.season === 'winter' ? 0.8 : 0.55}>
          {particles.map(([x, y], index) => (
            <g
              key={index}
              className="labora-season-particle"
              style={{ animationDelay: `${-index * 0.85}s`, animationDuration: `${7 + index % 4}s` }}
            >
              {atmosphere.season === 'winter' ? (
                <circle cx={x} cy={y} r={index % 3 === 0 ? 3 : 2} fill="#FFFFFF" stroke="#BDD5DC" strokeWidth="0.7" />
              ) : (
                <path
                  d={`M${x} ${y - 7} Q${x + 9} ${y - 2} ${x} ${y + 7} Q${x - 8} ${y + 1} ${x} ${y - 7}Z`}
                  fill={atmosphere.season === 'autumn' ? (index % 2 ? '#BD7850' : '#D9A359') : '#F1C1BB'}
                />
              )}
            </g>
          ))}
        </g>
      )}

      {/* Soft color-field orbs */}
      <ellipse
        cx={variant === 'hero' ? 120 : 90}
        cy={variant === 'strip' ? 160 : variant === 'hero' ? 220 : 380}
        rx={variant === 'panel' ? 220 : 160}
        ry={variant === 'panel' ? 140 : 90}
        fill={`url(#${gid('soft-a')})`}
        filter={`url(#${gid('blur-soft')})`}
      />
      <ellipse
        cx={variant === 'hero' ? 780 : 700}
        cy={variant === 'strip' ? 180 : variant === 'hero' ? 240 : 420}
        rx={180}
        ry={110}
        fill={`url(#${gid('soft-b')})`}
        filter={`url(#${gid('blur-soft')})`}
        opacity="0.85"
      />

      {/* Distant abstract landforms — soft color fields, not cartoon hills with trees */}
      <g filter={`url(#${gid('blur-land')})`} opacity="0.85">
        <path
          d={
            variant === 'hero'
              ? 'M0 155 C140 128 260 148 400 138 C540 128 680 155 900 142 L900 280 L0 280 Z'
              : variant === 'strip'
                ? 'M0 100 C140 78 280 95 420 88 C560 80 700 100 800 92 L800 220 L0 220 Z'
                : 'M0 230 C160 190 300 220 460 205 C620 190 720 230 800 218 L800 520 L0 520 Z'
          }
          fill={`url(#${gid('land-far')})`}
        />
        <path
          d={
            variant === 'hero'
              ? 'M0 185 C160 165 300 195 460 178 C620 162 760 190 900 180 L900 280 L0 280 Z'
              : variant === 'strip'
                ? 'M0 130 C160 112 300 138 460 125 C620 112 720 140 800 132 L800 220 L0 220 Z'
                : 'M0 300 C180 265 320 305 500 285 C660 268 740 310 800 298 L800 520 L0 520 Z'
          }
          fill={`url(#${gid('land-mid')})`}
        />
        <path
          d={
            variant === 'hero'
              ? 'M0 225 C200 210 380 245 560 228 C720 214 820 240 900 232 L900 280 L0 280 Z'
              : variant === 'strip'
                ? 'M0 165 C200 152 380 180 560 165 C700 154 760 175 800 170 L800 220 L0 220 Z'
                : 'M0 380 C220 350 400 400 580 375 C700 360 760 395 800 385 L800 520 L0 520 Z'
          }
          fill={`url(#${gid('land-near')})`}
        />
      </g>

      {/* Quiet horizon mist band */}
      <ellipse
        cx={variant === 'hero' ? 450 : 400}
        cy={variant === 'strip' ? 145 : variant === 'hero' ? 200 : 340}
        rx={variant === 'hero' ? 420 : 360}
        ry={variant === 'strip' ? 22 : 40}
        fill="#FFFFFF"
        opacity={isNight ? 0.08 : 0.14}
        filter={`url(#${gid('blur-soft')})`}
      />

      {/* Film grain overlay */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="#FFFFFF"
        filter={`url(#${gid('grain')})`}
        opacity="0.55"
        style={{ mixBlendMode: 'multiply' as any }}
      />
    </svg>
  );
};

export default AtmosphericPanel;

/** @deprecated Use AtmosphericPanel — kept for any lingering imports */
export { AtmosphericPanel as MeadowLandscape };
