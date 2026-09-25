import React, { useId } from 'react';
import { useGhibliAtmosphere } from '../contexts/GhibliAtmosphereContext';

type Scene = 'hero' | 'panel' | 'strip' | 'mobile';

interface SeasonalEffectsProps {
  variant?: Scene;
  className?: string;
}

// Fixed positions avoid timers and keep the movement gentle on every visit.
const flakes = [
  [0.08, 0.10, 2.2], [0.19, 0.42, 1.5], [0.31, 0.20, 2.7],
  [0.43, 0.55, 1.7], [0.54, 0.08, 2.1], [0.64, 0.39, 1.3],
  [0.72, 0.15, 2.5], [0.79, 0.63, 1.8], [0.88, 0.30, 2.2],
  [0.95, 0.48, 1.4]
] as const;

const drifting = [
  [0.12, 0.16], [0.27, 0.56], [0.44, 0.28], [0.59, 0.08],
  [0.74, 0.42], [0.91, 0.18], [0.83, 0.68]
] as const;

/** Decorative weather only; never intercepts input or carries content. */
const SeasonalEffects: React.FC<SeasonalEffectsProps> = ({ variant = 'hero', className = '' }) => {
  const { season, timeOfDay, palette } = useGhibliAtmosphere();
  const id = useId().replace(/:/g, '');
  const mobile = variant === 'mobile';
  const width = mobile ? 420 : variant === 'hero' ? 900 : 800;
  const height = mobile ? 345 : variant === 'panel' ? 520 : variant === 'strip' ? 220 : 280;
  const night = timeOfDay === 'night';
  const sunX = mobile ? 348 : variant === 'hero' ? 750 : 650;
  const sunY = mobile ? 55 : variant === 'panel' ? 85 : 48;
  const particles: ReadonlyArray<readonly [number, number, number?]> = season === 'winter' ? flakes : drifting;

  return (
    <svg
      className={`pointer-events-none ${className}`}
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`season-light-${id}`}>
          <stop offset="0%" stopColor={night ? '#F1F4EF' : palette.sunGlow} stopOpacity={night ? '0.25' : '0.55'} />
          <stop offset="100%" stopColor={palette.sunGlow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(${sunX} ${sunY})`}>
        <circle
          className={season === 'summer' && !night ? 'labora-summer-glow' : undefined}
          r={season === 'summer' && !night ? 76 : 52}
          fill={`url(#season-light-${id})`}
        />
        {night ? (
          <path d="M8 -22 A24 24 0 1 0 23 7 A19 19 0 0 1 8 -22Z" fill="#F1F4EF" stroke="#BBCFD1" strokeWidth="1" opacity="0.9" />
        ) : (
          <>
            {season === 'summer' && (
              <g className="labora-sun-rays" stroke="#DAB86C" strokeWidth="1.5" strokeLinecap="round" opacity="0.64">
                {Array.from({ length: 8 }, (_, index) => (
                  <path key={index} d="M0 -35 V-42" transform={`rotate(${index * 45})`} />
                ))}
              </g>
            )}
            <circle r={season === 'summer' ? 23 : 17} fill={timeOfDay === 'golden_hour' ? '#E4A260' : palette.sunFill} opacity="0.9" />
          </>
        )}
      </g>
      {season !== 'summer' && (
        <g opacity={season === 'winter' ? 0.88 : 0.76}>
          {particles.map(([fractionX, fractionY], index) => {
            // Weather gathers at the edges of the mobile headline.
            const x = mobile && fractionX < 0.62 ? fractionX * width * 0.52 : fractionX * width;
            const y = fractionY * height;
            const style = {
              animationDelay: `${-(index * 2.3 + (index % 3) * 0.9)}s`,
              animationDuration: `${season === 'winter' ? 15 + index % 5 : 19 + index % 7}s`,
              '--season-travel': `${height + 55}px`,
              '--season-sway': `${(index % 2 ? -1 : 1) * (12 + index * 2)}px`
            } as React.CSSProperties;
            return (
              <g key={`${season}-${index}`} className={`labora-season-particle labora-season-${season}`} style={style}>
                {season === 'winter' ? (
                  <circle cx={x} cy={y} r={particles[index][2] ?? 2} fill="#FFFFFF" stroke="#B7D0D5" strokeWidth="0.65" />
                ) : season === 'autumn' ? (
                  <g transform={`translate(${x} ${y}) rotate(${index * 29})`}>
                    <path d="M0 -7 C5 -6 8 -2 7 2 C5 6 0 8 -5 5 C-8 2 -5 -4 0 -7Z" fill={index % 3 === 0 ? '#B76B45' : index % 3 === 1 ? '#D9A054' : '#A97C4B'} />
                    <path d="M-3 4 Q2 1 5 -3" fill="none" stroke="#815A40" strokeWidth="0.8" opacity="0.65" />
                  </g>
                ) : (
                  <g transform={`translate(${x} ${y}) rotate(${index * 31})`}>
                    <path d="M0 -6 Q7 -4 5 1 Q1 8 -3 5 Q-7 1 0 -6Z" fill={index % 2 ? '#F5C7C8' : '#E9AEB6'} />
                    <path d="M0 -4 Q2 1 -2 4" fill="none" stroke="#C98693" strokeWidth="0.7" opacity="0.6" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

export default SeasonalEffects;
