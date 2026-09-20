import React, { useId } from 'react';
import { useGhibliAtmosphere, type GhibliPalette } from '../contexts/GhibliAtmosphereContext';

export type MeadowLandscapeVariant = 'panel' | 'strip' | 'hero';

interface MeadowLandscapeProps {
  variant?: MeadowLandscapeVariant;
  className?: string;
  /** Override palette (defaults to atmosphere context). */
  palette?: GhibliPalette;
}

/**
 * Original Studio-Ghibli–inspired meadow landscape.
 * Soft hills, wind-bent grass, watercolor clouds, light shafts,
 * distant birds, wildflowers, mist and vignette — no copyrighted characters.
 */
const MeadowLandscape: React.FC<MeadowLandscapeProps> = ({
  variant = 'panel',
  className = '',
  palette: paletteProp
}) => {
  const atmosphere = useGhibliAtmosphere();
  const palette = paletteProp ?? atmosphere.palette;
  const timeOfDay = atmosphere.timeOfDay;
  const isNight = timeOfDay === 'night';
  const uid = useId().replace(/:/g, '');
  const gid = (name: string) => `meadow-${name}-${uid}`;

  const viewBox =
    variant === 'strip' ? '0 0 800 220' :
    variant === 'hero' ? '0 0 900 280' :
    '0 0 800 520';

  const preserve =
    variant === 'strip' || variant === 'hero' ? 'xMidYMid slice' : 'xMidYMax meet';

  const sunCx = variant === 'hero' ? 780 : 655;
  const sunCy = variant === 'strip' ? 48 : variant === 'hero' ? 42 : 78;
  const sunR = variant === 'strip' ? 22 : variant === 'hero' ? 26 : 36;
  const glowR = sunR * 1.7;

  const fencePosts =
    variant === 'strip'
      ? [[400, 195], [430, 182], [460, 170], [490, 160]] as const
      : variant === 'hero'
        ? [[560, 255], [600, 245], [640, 238], [690, 232]] as const
        : [[350, 455], [390, 415], [440, 375], [500, 350], [560, 335], [620, 318]] as const;

  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio={preserve}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={gid('sun-glow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.sunGlow} stopOpacity="0.85" />
          <stop offset="55%" stopColor={palette.sunGlow} stopOpacity="0.28" />
          <stop offset="100%" stopColor={palette.sunGlow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={gid('sky-haze')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isNight ? '#B8D5E5' : '#FFFFFF'} stopOpacity={isNight ? 0.12 : 0.35} />
          <stop offset="100%" stopColor={palette.hillNear} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={gid('path')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4B896" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#C4A574" stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id={gid('hill-far')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hillFar} stopOpacity="0.45" />
          <stop offset="100%" stopColor={palette.hillFar} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={gid('hill-mid')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hillMid} stopOpacity="0.65" />
          <stop offset="100%" stopColor={palette.hillMid} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={gid('shaft')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.sunGlow} stopOpacity={isNight ? 0.08 : 0.22} />
          <stop offset="100%" stopColor={palette.sunGlow} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={gid('vignette')} cx="50%" cy="45%" r="70%">
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#1E2A24" stopOpacity={isNight ? 0.22 : 0.10} />
        </radialGradient>
        <filter id={gid('soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id={gid('mist')} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* Soft sky haze */}
      <rect x="0" y="0" width="100%" height="55%" fill={`url(#${gid('sky-haze')})`} />

      {/* Soft god-rays / light shafts from sun */}
      {!isNight && (
        <g opacity="0.55" style={{ mixBlendMode: 'soft-light' as any }}>
          {(variant === 'strip'
            ? [
                [sunCx - 40, sunCy, sunCx - 90, 200],
                [sunCx - 10, sunCy, sunCx - 20, 210],
                [sunCx + 18, sunCy, sunCx + 55, 205]
              ]
            : variant === 'hero'
              ? [
                  [sunCx - 50, sunCy, sunCx - 120, 260],
                  [sunCx - 12, sunCy, sunCx - 30, 270],
                  [sunCx + 22, sunCy, sunCx + 70, 265],
                  [sunCx + 48, sunCy, sunCx + 130, 255]
                ]
              : [
                  [sunCx - 70, sunCy, sunCx - 160, 420],
                  [sunCx - 28, sunCy, sunCx - 50, 440],
                  [sunCx + 8, sunCy, sunCx + 40, 450],
                  [sunCx + 42, sunCy, sunCx + 130, 430]
                ]
          ).map(([x1, y1, x2, y2], i) => (
            <polygon
              key={`shaft-${i}`}
              points={`${x1 - (6 + i)},${y1} ${x1 + (6 + i)},${y1} ${x2 + (14 + i * 4)},${y2} ${x2 - (14 + i * 4)},${y2}`}
              fill={`url(#${gid('shaft')})`}
              opacity={0.35 - i * 0.05}
            />
          ))}
        </g>
      )}

      {/* Watercolor clouds — more variety */}
      <g opacity={isNight ? 0.22 : 0.58} filter={`url(#${gid('soft')})`}>
        {/* Large left bank */}
        <ellipse cx="140" cy={variant === 'strip' ? 36 : 58} rx="58" ry="18" fill="#FFFFFF" />
        <ellipse cx="175" cy={variant === 'strip' ? 32 : 52} rx="36" ry="14" fill="#FFFFFF" />
        <ellipse cx="110" cy={variant === 'strip' ? 40 : 62} rx="28" ry="12" fill="#FFFFFF" opacity="0.85" />
        <ellipse cx="155" cy={variant === 'strip' ? 44 : 68} rx="42" ry="11" fill="#FFFFFF" opacity="0.55" />

        {/* Soft mid puff */}
        <ellipse cx="420" cy={variant === 'strip' ? 28 : 44} rx="70" ry="16" fill="#FFFFFF" opacity="0.7" />
        <ellipse cx="455" cy={variant === 'strip' ? 24 : 38} rx="40" ry="12" fill="#FFFFFF" opacity="0.75" />
        <ellipse cx="390" cy={variant === 'strip' ? 32 : 50} rx="32" ry="10" fill="#FFFFFF" opacity="0.5" />

        {/* Far thin wisps */}
        <ellipse cx="620" cy={variant === 'strip' ? 22 : 36} rx="48" ry="9" fill="#FFFFFF" opacity="0.4" />
        <ellipse cx="300" cy={variant === 'strip' ? 18 : 30} rx="55" ry="8" fill="#FFFFFF" opacity="0.32" />

        {variant !== 'strip' && (
          <>
            <ellipse cx="280" cy="95" rx="48" ry="14" fill="#FFFFFF" opacity="0.4" />
            <ellipse cx="520" cy="110" rx="55" ry="15" fill="#FFFFFF" opacity="0.35" />
            <ellipse cx="200" cy="120" rx="36" ry="10" fill="#FFFFFF" opacity="0.28" />
            {variant === 'panel' && (
              <ellipse cx="680" cy="130" rx="42" ry="12" fill="#FFFFFF" opacity="0.3" />
            )}
          </>
        )}
      </g>

      {/* Distant birds as tiny dots / V marks */}
      <g opacity={isNight ? 0.15 : 0.35} fill="none" stroke={palette.deepforest} strokeLinecap="round">
        {(variant === 'strip'
          ? [[260, 42], [275, 38], [500, 30]]
          : variant === 'hero'
            ? [[200, 55], [218, 48], [340, 40], [600, 52]]
            : [[240, 95], [258, 88], [280, 92], [480, 70], [495, 64], [560, 105]]
        ).map(([x, y], i) => (
          <path
            key={`bird-${i}`}
            d={`M${x - 3} ${y} Q${x} ${y - 2.5} ${x + 3} ${y}`}
            strokeWidth={variant === 'panel' ? 1.2 : 1}
            opacity={0.55 + (i % 3) * 0.1}
          />
        ))}
      </g>

      {/* Sun / moon */}
      <circle cx={sunCx} cy={sunCy} r={glowR} fill={`url(#${gid('sun-glow')})`} />
      <circle cx={sunCx} cy={sunCy} r={sunR} fill={palette.sunFill} opacity={isNight ? 0.92 : 1} />
      {!isNight && (
        <circle cx={sunCx - sunR * 0.25} cy={sunCy - sunR * 0.2} r={sunR * 0.35} fill="#FFF8E8" opacity="0.45" />
      )}

      {/* Distant soft hills (farthest) */}
      <path
        d={
          variant === 'hero'
            ? 'M0 145 C90 120 170 135 260 128 C360 118 440 148 540 132 C640 116 730 140 900 125 L900 280 L0 280 Z'
            : variant === 'strip'
              ? 'M0 95 C100 75 180 88 280 82 C380 76 470 98 580 85 C680 74 740 92 800 88 L800 220 L0 220 Z'
              : 'M0 210 C100 175 190 195 300 185 C420 172 510 215 620 195 C700 182 760 205 800 200 L800 520 L0 520 Z'
        }
        fill={`url(#${gid('hill-far')})`}
      />

      {/* Mid hills */}
      <path
        d={
          variant === 'hero'
            ? 'M0 175 C120 155 220 185 340 168 C460 150 560 190 680 172 C780 158 850 175 900 168 L900 280 L0 280 Z'
            : variant === 'strip'
              ? 'M0 125 C120 105 220 130 350 118 C480 105 580 138 700 122 C760 114 790 125 800 128 L800 220 L0 220 Z'
              : 'M0 275 C130 240 240 275 370 255 C500 235 600 290 720 265 C770 255 790 270 800 275 L800 520 L0 520 Z'
        }
        fill={`url(#${gid('hill-mid')})`}
      />

      {/* Distant tree silhouettes on mid ridge */}
      <g opacity="0.55">
        {(variant === 'strip'
          ? [
              [95, 118], [130, 112], [210, 120], [480, 115], [620, 118], [655, 112]
            ]
          : variant === 'hero'
            ? [
                [80, 168], [110, 162], [250, 165], [400, 158], [520, 170], [700, 165], [760, 160]
              ]
            : [
                [70, 268], [105, 258], [145, 265], [280, 250], [420, 255], [560, 268], [640, 258], [700, 270]
              ]
        ).map(([x, y], i) => (
          <g key={`tree-${i}`} transform={`translate(${x}, ${y})`}>
            <rect x="-1.5" y="0" width="3" height={variant === 'panel' ? 28 : 16} fill={palette.deepforest} opacity="0.5" rx="1" />
            <ellipse cx="0" cy={variant === 'panel' ? -8 : -5} rx={variant === 'panel' ? 14 + (i % 3) * 2 : 9 + (i % 2)} ry={variant === 'panel' ? 18 : 11} fill={palette.forest} opacity="0.65" />
            <ellipse cx="-4" cy={variant === 'panel' ? -14 : -8} rx={variant === 'panel' ? 9 : 6} ry={variant === 'panel' ? 11 : 7} fill={palette.moss} opacity="0.45" />
          </g>
        ))}
      </g>

      {/* Layered mist near horizon */}
      <g filter={`url(#${gid('mist')})`} opacity={isNight ? 0.12 : 0.28}>
        <ellipse
          cx={variant === 'hero' ? 450 : 400}
          cy={variant === 'strip' ? 118 : variant === 'hero' ? 168 : 290}
          rx={variant === 'hero' ? 380 : 320}
          ry={variant === 'strip' ? 18 : 36}
          fill="#FFFFFF"
        />
        {variant === 'panel' && (
          <ellipse cx="220" cy="320" rx="180" ry="28" fill="#FFFFFF" opacity="0.7" />
        )}
      </g>

      {/* Near meadow */}
      <path
        d={
          variant === 'hero'
            ? 'M0 210 C150 190 280 225 420 208 C560 190 700 230 900 215 L900 280 L0 280 Z'
            : variant === 'strip'
              ? 'M0 155 C140 140 260 168 400 155 C540 142 660 172 800 158 L800 220 L0 220 Z'
              : 'M0 340 C150 310 280 355 430 340 C560 328 680 370 800 350 L800 520 L0 520 Z'
        }
        fill={palette.hillNear}
      />

      {/* Foreground meadow wash (richer green) */}
      <path
        d={
          variant === 'hero'
            ? 'M0 235 C180 220 320 250 500 235 C680 220 800 255 900 242 L900 280 L0 280 Z'
            : variant === 'strip'
              ? 'M0 175 C160 165 300 190 480 175 C640 162 740 195 800 182 L800 220 L0 220 Z'
              : 'M0 400 C180 375 320 420 500 400 C660 385 740 430 800 415 L800 520 L0 520 Z'
        }
        fill={palette.moss}
        opacity="0.35"
      />

      {/* Dirt path winding through meadow */}
      {variant !== 'hero' && (
        <path
          d={
            variant === 'strip'
              ? 'M380 220 C400 200 420 185 445 172 C470 160 500 155 530 148'
              : 'M310 520 C340 470 360 430 390 400 C430 360 480 345 540 330 C600 315 650 305 700 295'
          }
          fill="none"
          stroke={`url(#${gid('path')})`}
          strokeWidth={variant === 'strip' ? 14 : 22}
          strokeLinecap="round"
          opacity="0.7"
        />
      )}
      {variant === 'hero' && (
        <path
          d="M520 280 C540 265 560 255 590 248 C630 238 680 235 740 230"
          fill="none"
          stroke={`url(#${gid('path')})`}
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.45"
        />
      )}

      {/* Fence posts along path */}
      <g opacity="0.55">
        {fencePosts.map(([x, y], i) => (
          <g key={`fence-${i}`}>
            <rect
              x={x}
              y={y - (variant === 'panel' ? 28 : 16)}
              width={variant === 'panel' ? 4 : 3}
              height={variant === 'panel' ? 32 : 18}
              rx="1"
              fill={palette.clay}
              opacity="0.55"
            />
            {i < fencePosts.length - 1 && (
              <line
                x1={x + 2}
                y1={y - (variant === 'panel' ? 18 : 10)}
                x2={fencePosts[i + 1][0] + 2}
                y2={fencePosts[i + 1][1] - (variant === 'panel' ? 18 : 10)}
                stroke={palette.clay}
                strokeWidth="1.5"
                opacity="0.4"
              />
            )}
          </g>
        ))}
      </g>

      {/* Wind-bent grass tufts in foreground */}
      <g stroke={palette.deepforest} strokeLinecap="round" fill="none" opacity="0.42">
        {(variant === 'strip'
          ? [[40, 200], [70, 198], [100, 204], [160, 205], [240, 198], [700, 200], [730, 196], [760, 202], [780, 205]]
          : variant === 'hero'
            ? [[30, 265], [55, 262], [90, 268], [140, 268], [220, 262], [800, 265], [830, 260], [860, 266], [880, 268]]
            : [
                [30, 480], [48, 472], [70, 488], [95, 468], [120, 490],
                [150, 475], [180, 495], [210, 478], [245, 488],
                [650, 470], [680, 482], [710, 468], [740, 485], [770, 475], [790, 490]
              ]
        ).map(([x, y], i) => {
          const h = variant === 'panel' ? 14 + (i % 4) * 3 : 8 + (i % 3) * 2;
          // Gentle lean to the right (wind from left)
          const lean = 3 + (i % 3);
          return (
            <g key={`grass-${i}`} strokeWidth={variant === 'panel' ? 1.8 : 1.4}>
              <path d={`M${x} ${y} Q${x - 2 + lean * 0.3} ${y - h / 2} ${x - 4 + lean} ${y - h}`} />
              <path d={`M${x} ${y} Q${x + lean * 0.4} ${y - h / 2} ${x + 2 + lean * 0.6} ${y - h - 2}`} />
              <path d={`M${x} ${y} Q${x + 3 + lean * 0.5} ${y - h / 2} ${x + 7 + lean} ${y - h + 1}`} />
            </g>
          );
        })}
      </g>

      {/* Dense wildflower dots — denser near path */}
      <g opacity="0.6">
        {(variant === 'strip'
          ? [
              [60, 185, palette.terracotta], [90, 190, palette.amber], [200, 190, palette.amber],
              [390, 210, '#E8A0B0'], [420, 200, palette.terracotta], [450, 188, palette.gold],
              [720, 188, '#E8A0B0'], [745, 194, palette.amber], [770, 186, palette.terracotta]
            ]
          : variant === 'hero'
            ? [
                [50, 250, palette.terracotta], [90, 255, palette.amber], [180, 255, palette.amber],
                [540, 268, '#E8A0B0'], [570, 258, palette.terracotta], [610, 250, palette.gold],
                [820, 252, '#E8A0B0'], [845, 246, palette.amber], [870, 254, palette.terracotta]
              ]
            : [
                [45, 460, palette.terracotta], [70, 470, palette.amber], [100, 455, palette.amber],
                [130, 478, '#E8A0B0'], [160, 470, '#E8A0B0'], [190, 458, palette.gold],
                [220, 480, palette.terracotta], [250, 465, palette.gold],
                [340, 450, palette.terracotta], [370, 430, '#E8A0B0'], [410, 400, palette.amber],
                [450, 375, palette.gold], [490, 360, '#E8A0B0'], [530, 348, palette.terracotta],
                [680, 455, palette.amber], [710, 470, palette.gold], [740, 465, '#E8A0B0'],
                [760, 480, palette.amber], [780, 450, palette.terracotta], [795, 475, '#E8A0B0']
              ]
        ).map(([x, y, c], i) => (
          <g key={`flower-${i}`}>
            <circle cx={x as number} cy={y as number} r={variant === 'panel' ? 2.4 : 1.7} fill={c as string} />
            {variant === 'panel' && i % 3 === 0 && (
              <circle cx={(x as number) + 0.3} cy={(y as number) - 0.3} r="0.7" fill="#FFF8E8" opacity="0.55" />
            )}
          </g>
        ))}
      </g>

      {/* Soft mist wash over near meadow edge */}
      {variant === 'panel' && (
        <ellipse cx="400" cy="380" rx="340" ry="28" fill="#FFFFFF" opacity="0.12" filter={`url(#${gid('soft')})`} />
      )}

      {/* Soft vignette for painterly focus */}
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid('vignette')})`} style={{ pointerEvents: 'none' }} />
    </svg>
  );
};

export default MeadowLandscape;
