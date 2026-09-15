import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

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
  intensity: GhibliIntensity;
  palette: GhibliPalette;
  title: string;
  subtitle: string;
  filmInspiration: string;
  paletteDescription: string;
  setTimeOfDay: (time: GhibliTimeOfDay) => void;
  setSeason: (season: GhibliSeason) => void;
  setIsAuto: (auto: boolean) => void;
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
    title: 'Amanecer en la Colina',
    subtitle: 'Rocío matinal, aire fresco y bruma sobre los campos',
    filmInspiration: 'Mi Vecino Totoro & Arrietty',
    paletteDescription: 'Verdes salvia y celadón húmedos con tierras perladas de arcilla clara y luz naciente suave.',
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
    title: 'Mediodía Solar',
    subtitle: 'Luz cenital cristalina, prados vibrantes y tejas mediterráneas',
    filmInspiration: 'Kiki: Entregas a Domicilio & Porco Rosso',
    paletteDescription: 'Verde bosque prado clásico y terracota horneada con el contraste vivo de un día radiante.',
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
    title: 'Atardecer Ámbar',
    subtitle: 'Hora mágica de luz dorada, sombras suaves y calidez nostálgica',
    filmInspiration: 'El Viaje de Chihiro & Susurros del Corazón',
    paletteDescription: 'Verdes oliva y musgo otoñal entrelazados con calderas ardientes, canela y fondos de pergamino miel.',
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
    title: 'Noche en el Bosque',
    subtitle: 'Quietud plateada, luna clara y serenidad bajo los árboles',
    filmInspiration: 'La Princesa Mononoke & El Castillo Ambulante',
    paletteDescription: 'Verdes ciprés profundo y corteza nocturna con fondos marfil luna que cuidan el descanso visual.',
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
  } else if (season === 'summer') {
    // Verano: Follaje denso y terracota horneada al sol
    result.forest = '#24523B';
    result.terracotta = '#DB7654';
    result.clay = '#CA6540';
  } else if (season === 'autumn') {
    // Otoño: Hojas doradas, ocre, musgo cálido y madera de arce
    result.moss = '#4F6F41';
    result.amber = '#DF8E28';
    result.border = '#E5D6BD';
    result.borderSubtle = '#E9DCC7';
  } else if (season === 'winter') {
    // Invierno: Pino sereno, quietud cristalina y hogar acogedor
    result.deepforest = '#193327';
    result.softgreen = '#E7EFEA';
    result.bordergreen = '#CADAD0';
  }

  return result;
}

const GhibliAtmosphereContext = createContext<GhibliAtmosphereState | undefined>(undefined);

export const GhibliAtmosphereProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to automatic tracking
  const [isAuto, setIsAutoState] = useState<boolean>(() => {
    const saved = localStorage.getItem('labora_ghibli_auto');
    return saved !== null ? saved === 'true' : true;
  });

  const [intensity, setIntensityState] = useState<GhibliIntensity>(() => {
    return (localStorage.getItem('labora_ghibli_intensity') as GhibliIntensity) || 'standard';
  });

  // Calculate current date/time
  const now = new Date();
  const detectedTime = detectTimeOfDay(now.getHours());
  const detectedSeason = detectSeason(now.getMonth());

  const [manualTimeOfDay, setManualTimeOfDay] = useState<GhibliTimeOfDay>(() => {
    return (localStorage.getItem('labora_ghibli_time') as GhibliTimeOfDay) || detectedTime;
  });

  const [manualSeason, setManualSeason] = useState<GhibliSeason>(() => {
    return (localStorage.getItem('labora_ghibli_season') as GhibliSeason) || detectedSeason;
  });

  // Effective time of day & season
  const timeOfDay = isAuto ? detectedTime : manualTimeOfDay;
  const season = isAuto ? detectedSeason : manualSeason;

  // Periodically check time in auto mode (every 1 minute)
  useEffect(() => {
    if (!isAuto) return;
    const interval = setInterval(() => {
      const currentH = new Date().getHours();
      const newTime = detectTimeOfDay(currentH);
      if (newTime !== manualTimeOfDay) {
        setManualTimeOfDay(newTime);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuto, manualTimeOfDay]);

  const setTimeOfDay = (t: GhibliTimeOfDay) => {
    setIsAutoState(false);
    setManualTimeOfDay(t);
    localStorage.setItem('labora_ghibli_auto', 'false');
    localStorage.setItem('labora_ghibli_time', t);
  };

  const setSeason = (s: GhibliSeason) => {
    setIsAutoState(false);
    setManualSeason(s);
    localStorage.setItem('labora_ghibli_auto', 'false');
    localStorage.setItem('labora_ghibli_season', s);
  };

  const setIsAuto = (auto: boolean) => {
    setIsAutoState(auto);
    localStorage.setItem('labora_ghibli_auto', String(auto));
    if (auto) {
      const current = new Date();
      setManualTimeOfDay(detectTimeOfDay(current.getHours()));
      setManualSeason(detectSeason(current.getMonth()));
    }
  };

  const setIntensity = (int: GhibliIntensity) => {
    setIntensityState(int);
    localStorage.setItem('labora_ghibli_intensity', int);
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
  }, [palette]);

  const value: GhibliAtmosphereState = {
    timeOfDay,
    season,
    isAuto,
    intensity,
    palette,
    title: activeConfig.title,
    subtitle: activeConfig.subtitle,
    filmInspiration: activeConfig.filmInspiration,
    paletteDescription: activeConfig.paletteDescription,
    setTimeOfDay,
    setSeason,
    setIsAuto,
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
