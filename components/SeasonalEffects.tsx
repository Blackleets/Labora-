import React from 'react';
import { useGhibliAtmosphere } from '../contexts/GhibliAtmosphereContext';

type Scene = 'hero' | 'panel' | 'strip' | 'mobile';

interface SeasonalEffectsProps {
  variant?: Scene;
  className?: string;
}

const winter = [[38, 18], [112, 86], [191, 32], [258, 111], [333, 52], [390, 93]];
const autumn = [[34, 46], [134, 102], [214, 25], [305, 80], [380, 38]];
const spring = [[61, 25], [153, 91], [252, 58], [329, 112], [401, 17]];

/** Small, decorative scenes for the selected season. No input interception or motion when reduced motion is requested. */
const SeasonalEffects: React.FC<SeasonalEffectsProps> = ({ variant = 'hero', className = '' }) => {
  const { season, timeOfDay, palette } = useGhibliAtmosphere();
  const mobile = variant === 'mobile';
  const width = mobile ? 420 : 900;
  const moon = timeOfDay === 'night';
  const x = mobile ? 345 : variant === 'hero' ? 560 : 710;
  const y = mobile ? 54 : 46;
  const points = season === 'winter' ? winter : season === 'autumn' ? autumn : spring;

  return (
    <svg className={className} width="100%" height="100%" viewBox={`0 0 ${width} 280`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g transform={`translate(${x} ${y})`} opacity={moon ? 0.84 : 0.72}>
        {moon ? (
          <path d="M9 -24A26 26 0 1 0 25 9 22 22 0 0 1 9 -24Z" fill="#F0F5F4" stroke="#B5D5DD" strokeWidth="1.5" />
        ) : (
          <>
            {season === 'summer' && <circle className="labora-summer-glow" r="43" fill={palette.sunGlow} opacity="0.42" />}
            <circle r={season === 'summer' ? 24 : 19} fill={timeOfDay === 'golden_hour' ? '#E6A05B' : palette.sunFill} />
            <circle r="31" fill="none" stroke={palette.sunGlow} strokeWidth="2" opacity="0.65" />
          </>
        )}
      </g>

      {season !== 'summer' && (
        <g opacity={season === 'winter' ? 0.82 : 0.67}>
          {points.map(([sourceX, sourceY], index) => {
            const px = mobile ? sourceX : sourceX * 2.08;
            return (
              <g
                key={`${season}-${index}`}
                className={`labora-season-particle labora-season-${season}`}
                style={{ animationDelay: `${-index * 1.6}s`, animationDuration: `${9 + index % 3}s` }}
              >
                {season === 'winter' ? (
                  <circle cx={px} cy={sourceY} r={index % 3 === 0 ? 3.2 : 2.4} fill="#FFFFFF" stroke="#A9C9D2" strokeWidth="0.8" />
                ) : (
                  <path
                    d={`M${px} ${sourceY - 6} Q${px + 7} ${sourceY - 2} ${px} ${sourceY + 6} Q${px - 7} ${sourceY + 1} ${px} ${sourceY - 6}Z`}
                    fill={season === 'autumn' ? (index % 2 ? '#B8754F' : '#D7A056') : '#E6A8B1'}
                  />
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
