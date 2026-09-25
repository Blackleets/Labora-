import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { safeStorageGet, safeStorageSet } from '../services/safeStorage';

export type GhibliTimeOfDay = 'dawn' | 'midday' | 'golden_hour' | 'night';
export type GhibliSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type GhibliIntensity = 'subtle' | 'standard' | 'vivid';

export interface GhibliPalette {
  // Greens
  forest: string;        // Main primary green (e.g. #2E5A44)
  deepforest: string;    // Deep dark forest (e.g. #213B2F)
  moss: string;          // Mid-tone moss green (e.g. #3B7258)
  softgreen: string;     // Pill / badge green bg (e.g. #EBF3ED)
  bordergreen: string;   // Border green (e.g. #D0E5D7)
  
  // Earths & Terracottas
  clay: string;          // Main terracotta / gas station clay (e.g. #C96846)
  terracotta: string;    // Accent brick (e.g. #D97757)
  warmearth: string;     // Warm pill / card bg (e.g. #FAF3EE)
  borderclay: string;    // Border clay (e.g. #EAD6C9)
  
  // Ambers & Gold
  amber: string;         // IRPF 130 hucha / pending badge (e.g. #D9943B)
  gold: string;          // Accent gold (e.g. #B87A24)
  softamber: string;     // Pill amber bg (e.g. #FEF7EB)
  borderamber: string;   // Border amber (e.g. #FDE3B8)
  
  // Atmospheres & Backgrounds
  canvas: string;        // App main canvas background (e.g. #FAF7F2)
  card: string;          // Card surface (e.g. #FCFAF7)
  parchment: string;     // Welcome banner / warm card (e.g. #FAF6EE)
  border: string;        // General subtle border (e.g. #E8DFC8)
  borderSubtle: string;  // Delicate divider (e.g. #EBE4D8)
  textMain: string;      // Body text
  textMuted: string;     // Subtitle text
  
  // Scenic Celestial Light
  sunFill: string;       // Color of sun/moon in SVG
  sunGlow: string;       // Color of outer sun/moon glow
  hillFar: string;       // Far rolling hill fill
  hillMid: string;       // Mid rolling hill fill
  hillNear: string;      // Near meadow fill
  ambientGradient: string; // Soft vignette overlay
}

export interface GhibliAtmosphereState {
  timeOfDay: GhibliTimeOfDay;
  season: GhibliSeason;
  isAuto: boolean;
  isSeasonAuto: boolean;
  intensity: GhibliIntensity;
  palette: GhibliPalette;
  title: string;
  subtitle: string;
  filmInspiration: string;
  paletteDescription: string;
  setTimeOfDay: (time: GhibliTimeOfDay) => void;
  setSeason: (season: GhibliSeason) => void;
  setIsAuto: (auto: boolean) => void;
  resetToCurrentSeason: () => void;
  setIntensity: (intensity: GhibliIntensity) => void;
  resetToCurrentTime: () => void;
}

// Helper to determine time of day from hours
export function detectTimeOfDay(hour: number): GhibliTimeOfDay {
  if (hour >= 6 && hour < 10) return 'dawn';
  if (hour >= 10 && hour < 18) return 'midday';
  if (hour >= 18 && hour < 22) return 'golden_hour';
  return 'night';
}

// Helper to determine season from month (Northern Hemisphere)
export function detectSeason(month: number): GhibliSeason {
  // 0: Jan, 1: Feb, 2: Mar ...
  if (month >= 2 && month <= 4) return 'spring'; // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'summer'; // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return 'autumn'; // Sep, Oct, Nov
  return 'winter'; // Dec, Jan, Feb
}

// Base palettes for each time of day
const BASE_ATMOSPHERES: Record<GhibliTimeOfDay, {
  title: string;
  subtitle: string;
  filmInspiration: string;
  paletteDescription: string;
  base: GhibliPalette;
}> = {
  dawn: {
    title: 'Luz de mañana',
    subtitle: 'Tonos frescos y claros para el inicio de la jornada',
    filmInspiration: 'Dawn calm',
    paletteDescription: 'Verdes salvia suaves con tierras perladas y luz matinal contenida.',
    base: {
      forest: '#295C46',
      deepforest: '#1E3E2F',
      moss: '#3B795B',
      softgreen: '#EAF4EE',
      bordergreen: '#CCE3D4',
      clay: '#BD6548',
      terracotta: '#CC7357',
      warmearth: '#FBF5EF',
      borderclay: '#E7D7CB',
      amber: '#D4923C',
      gold: '#B67926',
      softamber: '#FEF8EC',
      borderamber: '#FCE6C3',
      canvas: '#F6F9F6',
      card: '#FCFDFC',
      parchment: '#F2F7F3',
      border: '#DCE7DF',
      borderSubtle: '#E5EDE7',
      textMain: '#242D28',
      textMuted: '#5C6E64',
      sunFill: '#FAD99F',
      sunGlow: '#FEEFD6',
      hillFar: '#86B595',
      hillMid: '#5A936C',
      hillNear: '#BFDEC1',
      ambientGradient: 'radial-gradient(circle at 85% 15%, rgba(254, 239, 214, 0.12) 0%, rgba(234, 244, 238, 0.05) 50%, transparent 100%)',
    }
  },
  midday: {
    title: 'Luz mediterránea',
    subtitle: 'Claridad diurna, contraste sereno y calidez contenida',
    filmInspiration: 'Midday calm',
    paletteDescription: 'Verde bosque profundo y terracota contenida con el contraste de un día claro.',
    base: {
      forest: '#2E5A44',
      deepforest: '#213B2F',
      moss: '#3B7258',
      softgreen: '#EBF3ED',
      bordergreen: '#D0E5D7',
      clay: '#C96846',
      terracotta: '#D97757',
      warmearth: '#FAF3EE',
      borderclay: '#EAD6C9',
      amber: '#D9943B',
      gold: '#B87A24',
      softamber: '#FEF7EB',
      borderamber: '#FDE3B8',
      canvas: '#FAF7F2',
      card: '#FCFAF7',
      parchment: '#FAF6EE',
      border: '#E8DFC8',
      borderSubtle: '#EBE4D8',
      textMain: '#292524',
      textMuted: '#6B645C',
      sunFill: '#F7BA55',
      sunGlow: '#FAD082',
      hillFar: '#75A47F',
      hillMid: '#4B7E58',
      hillNear: '#B3D0B2',
      ambientGradient: 'radial-gradient(circle at 80% 20%, rgba(250, 208, 130, 0.10) 0%, rgba(250, 246, 238, 0.04) 60%, transparent 100%)',
    }
  },
  golden_hour: {
    title: 'Luz ámbar',
    subtitle: 'Calidez de tarde, sombras suaves y pergamino miel',
    filmInspiration: 'Golden calm',
    paletteDescription: 'Verdes oliva y musgo con ámbar contenido y fondos de pergamino miel.',
    base: {
      forest: '#375936',
      deepforest: '#254026',
      moss: '#4A6F44',
      softgreen: '#F0F3E6',
      bordergreen: '#DFE7CF',
      clay: '#C55B33',
      terracotta: '#D36A43',
      warmearth: '#FAF0E4',
      borderclay: '#EAD1BC',
      amber: '#DF8E28',
      gold: '#BF7217',
      softamber: '#FEF5E7',
      borderamber: '#FDE1AE',
      canvas: '#FAF4EA',
      card: '#FDF8F0',
      parchment: '#F8EFE0',
      border: '#E8D7BD',
      borderSubtle: '#EBDDC7',
      textMain: '#2E2620',
      textMuted: '#706253',
      sunFill: '#EB9438',
      sunGlow: '#F5B96E',
      hillFar: '#98A46B',
      hillMid: '#637A49',
      hillNear: '#D2DBA6',
      ambientGradient: 'radial-gradient(circle at 85% 25%, rgba(245, 185, 110, 0.15) 0%, rgba(235, 148, 56, 0.06) 45%, transparent 100%)',
    }
  },
  night: {
    title: 'Luz serena',
    subtitle: 'Quietud nocturna, marfil suave y descanso visual',
    filmInspiration: 'Night calm',
    paletteDescription: 'Verdes ciprés profundo con fondos marfil que cuidan el descanso visual.',
    base: {
      forest: '#23493A',
      deepforest: '#183428',
      moss: '#31634F',
      softgreen: '#E6EFEA',
      bordergreen: '#CADAD1',
      clay: '#B5634B',
      terracotta: '#C17058',
      warmearth: '#F4F1ED',
      borderclay: '#DED1C7',
      amber: '#CB8B35',
      gold: '#A86C1F',
      softamber: '#FBF5EB',
      borderamber: '#F6DEC0',
      canvas: '#F4F6F4',
      card: '#FAFCFA',
      parchment: '#EEF3F0',
      border: '#D8E2DC',
      borderSubtle: '#E2EAE5',
      textMain: '#202824',
      textMuted: '#586660',
      sunFill: '#B8D5E5',
      sunGlow: '#D4E8F2',
      hillFar: '#5D8572',
      hillMid: '#396350',
      hillNear: '#9BBFAE',
      ambientGradient: 'radial-gradient(circle at 85% 20%, rgba(184, 213, 229, 0.14) 0%, rgba(230, 239, 234, 0.05) 50%, transparent 100%)',
    }
  }
};

// Subtle seasonal temperature modifier
function applySeasonalAdjustment(palette: GhibliPalette, season: GhibliSeason, intensity: GhibliIntensity): GhibliPalette {
  const result = { ...palette };
  
  if (season === 'spring') {
    // Primavera: Brotes frescos de colina, rocío y flores silvestres
    result.moss = '#428060';
    result.softgreen = '#EBF6EF';
    result.bordergreen = '#D4E9DC';
    result.warmearth = '#FAF4EE';
    result.canvas = '#F2F8F2';
  } else if (season === 'summer') {
    // Verano: Follaje denso y terracota horneada al sol
    result.forest = '#24523B';
    result.terracotta = '#DB7654';
    result.clay = '#CA6540';
    result.canvas = '#FBF5E9';
    result.parchment = '#FAF0DB';
  } else if (season === 'autumn') {
    // Otoño: Hojas doradas, ocre, musgo cálido y madera de arce
    result.moss = '#4F6F41';
    result.amber = '#DF8E28';
    result.border = '#E5D6BD';
    result.borderSubtle = '#E9DCC7';
    result.canvas = '#F9F1E7';
    result.parchment = '#F7EAD9';
  } else if (season === 'winter') {
    // Invierno: Pino sereno, quietud cristalina y hogar acogedor
    result.deepforest = '#193327';
    result.softgreen = '#E7EFEA';
    result.bordergreen = '#CADAD0';
    result.canvas = '#F0F5F7';
    result.parchment = '#EAF1F4';
  }

  return result;
}

const GhibliAtmosphereContext = createContext<GhibliAtmosphereState | undefined>(undefined);

export const GhibliAtmosphereProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to automatic tracking
  const [isAuto, setIsAutoState] = useState<boolean>(() => {
    const saved = safeStorageGet('labora_ghibli_auto');
    return saved !== null ? saved === 'true' : true;
  });

  const [intensity, setIntensityState] = useState<GhibliIntensity>(() => {
    const saved = safeStorageGet('labora_ghibli_intensity');
    return saved === 'subtle' || saved === 'vivid' ? saved : 'standard';
  });

  const [clock, setClock] = useState(() => new Date());
  const detectedTime = detectTimeOfDay(clock.getHours());
  const detectedSeason = detectSeason(clock.getMonth());

  const [manualTimeOfDay, setManualTimeOfDay] = useState<GhibliTimeOfDay>(() => {
    const saved = safeStorageGet('labora_ghibli_time');
    return saved === 'dawn' || saved === 'midday' || saved === 'golden_hour' || saved === 'night' ? saved : detectedTime;
  });

  const [manualSeason, setManualSeason] = useState<GhibliSeason>(() => {
    const saved = safeStorageGet('labora_ghibli_season');
    return saved === 'spring' || saved === 'summer' || saved === 'autumn' || saved === 'winter' ? saved : detectedSeason;
  });

  const [isSeasonAuto, setIsSeasonAuto] = useState<boolean>(() => {
    const saved = safeStorageGet('labora_ghibli_season_auto');
    if (saved !== null) return saved !== 'false';
    // Preserve a season explicitly selected in older versions of the app.
    return safeStorageGet('labora_ghibli_auto') !== 'false' || safeStorageGet('labora_ghibli_season') === null;
  });

  // Effective time of day & season
  const timeOfDay = isAuto ? detectedTime : manualTimeOfDay;
  const season = isSeasonAuto ? detectedSeason : manualSeason;

  // Keep automatic selections current while the page stays open.
  useEffect(() => {
    if (!isAuto && !isSeasonAuto) return;
    setClock(new Date());
    const interval = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(interval);
  }, [isAuto, isSeasonAuto]);

  const setTimeOfDay = (t: GhibliTimeOfDay) => {
    setIsAutoState(false);
    setManualTimeOfDay(t);
    safeStorageSet('labora_ghibli_auto', 'false');
    safeStorageSet('labora_ghibli_time', t);
  };

  const setSeason = (s: GhibliSeason) => {
    setIsSeasonAuto(false);
    setManualSeason(s);
    safeStorageSet('labora_ghibli_season_auto', 'false');
    safeStorageSet('labora_ghibli_season', s);
  };

  const setIsAuto = (auto: boolean) => {
    setIsAutoState(auto);
    safeStorageSet('labora_ghibli_auto', String(auto));
    if (auto) {
      const current = new Date();
      setClock(current);
      setManualTimeOfDay(detectTimeOfDay(current.getHours()));
    }
  };

  const resetToCurrentSeason = () => {
    setClock(new Date());
    setIsSeasonAuto(true);
    safeStorageSet('labora_ghibli_season_auto', 'true');
  };

  const setIntensity = (int: GhibliIntensity) => {
    setIntensityState(int);
    safeStorageSet('labora_ghibli_intensity', int);
  };

  const resetToCurrentTime = () => {
    setIsAuto(true);
  };

  // Get active configuration
  const activeConfig = BASE_ATMOSPHERES[timeOfDay];
  const palette = useMemo(() => {
    return applySeasonalAdjustment(activeConfig.base, season, intensity);
  }, [activeConfig, season, intensity]);

  // Apply CSS Variables to Document Root for seamless integration
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ghibli-forest', palette.forest);
    root.style.setProperty('--ghibli-deepforest', palette.deepforest);
    root.style.setProperty('--ghibli-moss', palette.moss);
    root.style.setProperty('--ghibli-softgreen', palette.softgreen);
    root.style.setProperty('--ghibli-bordergreen', palette.bordergreen);
    
    root.style.setProperty('--ghibli-clay', palette.clay);
    root.style.setProperty('--ghibli-terracotta', palette.terracotta);
    root.style.setProperty('--ghibli-warmearth', palette.warmearth);
    root.style.setProperty('--ghibli-borderclay', palette.borderclay);
    
    root.style.setProperty('--ghibli-amber', palette.amber);
    root.style.setProperty('--ghibli-gold', palette.gold);
    root.style.setProperty('--ghibli-softamber', palette.softamber);
    root.style.setProperty('--ghibli-borderamber', palette.borderamber);
    
    root.style.setProperty('--ghibli-canvas', palette.canvas);
    root.style.setProperty('--ghibli-card', palette.card);
    root.style.setProperty('--ghibli-parchment', palette.parchment);
    root.style.setProperty('--ghibli-border', palette.border);
    root.style.setProperty('--ghibli-border-subtle', palette.borderSubtle);
    
    root.style.setProperty('--ghibli-sun-fill', palette.sunFill);
    root.style.setProperty('--ghibli-sun-glow', palette.sunGlow);
    root.style.setProperty('--ghibli-ambient-gradient', palette.ambientGradient);
    root.style.setProperty('--labora-atmosphere-canvas', palette.canvas);
  }, [palette]);

  const value: GhibliAtmosphereState = {
    timeOfDay,
    season,
    isAuto,
    isSeasonAuto,
    intensity,
    palette,
    title: activeConfig.title,
    subtitle: activeConfig.subtitle,
    filmInspiration: activeConfig.filmInspiration,
    paletteDescription: activeConfig.paletteDescription,
    setTimeOfDay,
    setSeason,
    setIsAuto,
    resetToCurrentSeason,
    setIntensity,
    resetToCurrentTime,
  };

  return (
    <GhibliAtmosphereContext.Provider value={value}>
      {children}
    </GhibliAtmosphereContext.Provider>
  );
};

export const useGhibliAtmosphere = (): GhibliAtmosphereState => {
  const context = useContext(GhibliAtmosphereContext);
  if (!context) {
    throw new Error('useGhibliAtmosphere must be used within a GhibliAtmosphereProvider');
  }
  return context;
};
