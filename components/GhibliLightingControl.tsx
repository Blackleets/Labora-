import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, Sunrise, Sunset, Moon, Sparkles, Clock, 
  Leaf, Trees, CloudRain, Snowflake, Check, X, 
  RotateCcw, Info, Palette 
} from 'lucide-react';
import { 
  useGhibliAtmosphere, 
  GhibliTimeOfDay, 
  GhibliSeason 
} from '../contexts/GhibliAtmosphereContext';

export const GhibliLightingControl: React.FC = () => {
  const {
    timeOfDay,
    season,
    isAuto,
    palette,
    title,
    subtitle,
    filmInspiration,
    paletteDescription,
    setTimeOfDay,
    setSeason,
    setIsAuto,
    resetToCurrentTime
  } = useGhibliAtmosphere();

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getTimeIcon = (t: GhibliTimeOfDay, size = 15) => {
    switch (t) {
      case 'dawn':
        return <Sunrise size={size} className="text-[#C27358]" />;
      case 'midday':
        return <Sun size={size} className="text-[#D9943B]" />;
      case 'golden_hour':
        return <Sunset size={size} className="text-[#C96846]" />;
      case 'night':
        return <Moon size={size} className="text-[#3A7596]" />;
    }
  };

  const getSeasonIcon = (s: GhibliSeason, size = 14) => {
    switch (s) {
      case 'spring':
        return <Leaf size={size} className="text-[#3B7258]" />;
      case 'summer':
        return <Sun size={size} className="text-[#D9943B]" />;
      case 'autumn':
        return <Trees size={size} className="text-[#C96846]" />;
      case 'winter':
        return <Snowflake size={size} className="text-[#3A7596]" />;
    }
  };

  const timeOptions: { id: GhibliTimeOfDay; name: string; hours: string; film: string; icon: any }[] = [
    { id: 'dawn', name: 'Mañana', hours: '06:00 - 10:00', film: 'Tonos frescos', icon: Sunrise },
    { id: 'midday', name: 'Mediodía', hours: '10:00 - 18:00', film: 'Claridad diurna', icon: Sun },
    { id: 'golden_hour', name: 'Tarde', hours: '18:00 - 22:00', film: 'Calidez ámbar', icon: Sunset },
    { id: 'night', name: 'Noche', hours: '22:00 - 06:00', film: 'Quietud serena', icon: Moon },
  ];

  const seasonOptions: { id: GhibliSeason; name: string; icon: any; hint: string }[] = [
    { id: 'spring', name: 'Primavera', icon: Leaf, hint: 'Tonos frescos' },
    { id: 'summer', name: 'Verano', icon: Sun, hint: 'Contraste diurno' },
    { id: 'autumn', name: 'Otoño', icon: Trees, hint: 'Calidez otoñal' },
    { id: 'winter', name: 'Invierno', icon: Snowflake, hint: 'Quietud invernal' },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      {/* Header Trigger Pill */}
      <button
        id="ghibli-lighting-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`labora-icon-btn px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-serif font-semibold flex items-center space-x-2 border transition-all duration-300 shadow-sm active:scale-95 ${
          isOpen
            ? 'bg-[color:var(--labora-surface,#FFFEFB)] border-[color:var(--labora-primary,#2E5A44)] text-[color:var(--labora-primary,#245338)] ring-2 ring-[color:var(--labora-primary,#2E5A44)]/15'
            : 'bg-[color:var(--labora-parchment,#FAF7F2)] hover:bg-[color:var(--labora-surface,#FFFEFB)] border-[color:var(--labora-border,#E5DAC2)] text-[color:var(--labora-ink,#44403c)]'
        }`}
        title="Ajustar luz ambiental"
        aria-expanded={isOpen}
      >
        <span className="relative flex items-center justify-center">
          {getTimeIcon(timeOfDay, 14)}
          {isAuto && (
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-[#2E5A44] rounded-full ring-1 ring-white" />
          )}
        </span>
        
        <span className="hidden lg:inline text-stone-800">
          {title}
        </span>
        
        <span className="lg:hidden text-stone-800">
          {timeOfDay === 'dawn' ? 'Amanecer' : timeOfDay === 'midday' ? 'Mediodía' : timeOfDay === 'golden_hour' ? 'Atardecer' : 'Noche'}
        </span>

        <span className="text-[10px] px-1.5 py-0.2 bg-[#EBF3ED] text-[#245338] rounded-md font-sans font-medium hidden sm:inline">
          {season === 'spring' ? '🌸' : season === 'summer' ? '🌻' : season === 'autumn' ? '🍂' : '❄️'}
        </span>
      </button>

      {/* Atmospheric Settings Popover Panel */}
      {isOpen && (
        <div 
          id="ghibli-lighting-panel"
          className="absolute right-0 mt-2 w-[340px] sm:w-[410px] bg-[#FCFAF7] rounded-3xl border border-[#E4D7BE] shadow-[0_12px_40px_-10px_rgba(70,50,30,0.18)] p-5 z-50 text-stone-800 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE0CD]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EBF3ED] border border-[#D0E5D7] text-[#2E5A44] flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900 leading-tight">
                  Luz ambiental
                </h3>
                <p className="text-[11px] text-stone-500">
                  Tonos del espacio de trabajo
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-[#F2EDE4] rounded-xl transition-colors"
              aria-label="Cerrar panel de iluminación"
            >
              <X size={16} />
            </button>
          </div>

          {/* Automatic Sync Banner */}
          <div className="mt-3.5 p-3 rounded-2xl bg-[#F6F1E8] border border-[#E7DBC4] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Clock size={16} className={isAuto ? 'text-[#2E5A44]' : 'text-stone-400'} />
              <div>
                <span className="text-xs font-serif font-bold text-stone-800 block">
                  Sincronización Solar Automática
                </span>
                <span className="text-[10px] text-stone-500 block leading-tight">
                  Adapta los tonos según la hora local y estación del año
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsAuto(!isAuto)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAuto ? 'bg-[#2E5A44]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAuto ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Time of Day Presets */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-800">
                Momento del día
              </span>
              {!isAuto && (
                <button
                  onClick={resetToCurrentTime}
                  className="text-[10px] font-serif font-medium text-[#2E5A44] hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={10} />
                  <span>Restablecer a hora real</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {timeOptions.map((opt) => {
                const isSelected = timeOfDay === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTimeOfDay(opt.id)}
                    className={`p-2.5 rounded-2xl text-left border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-[#2E5A44] shadow-sm ring-1 ring-[#2E5A44]/20'
                        : 'bg-[#FAF7F2] hover:bg-white border-[#E7DBC4] text-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-[#EBF3ED] text-[#2E5A44]' : 'bg-[#F2EDE4] text-stone-600'
                      }`}>
                        <IconComponent size={14} />
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E5A44]" />
                      )}
                    </div>

                    <div>
                      <p className={`font-serif text-xs font-bold ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>
                        {opt.name}
                      </p>
                      <p className="text-[10px] text-stone-400 font-sans truncate">
                        {opt.film}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seasons Row */}
          <div className="mt-4">
            <span className="text-xs font-serif font-bold text-stone-800 block mb-2">
              Matiz Estacional
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {seasonOptions.map((s) => {
                const isSelected = season === s.id;
                const IconComp = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSeason(s.id)}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-white border-[#2E5A44] shadow-sm text-stone-900 font-semibold'
                        : 'bg-[#FAF7F2] hover:bg-white border-[#E7DBC4] text-stone-600'
                    }`}
                    title={s.hint}
                  >
                    <IconComp size={13} className={isSelected ? 'text-[#2E5A44]' : 'text-stone-500'} />
                    <span className="text-[11px] font-serif leading-none truncate">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Palette Preview Pill Strip */}
          <div className="mt-4 p-3 rounded-2xl bg-white border border-[#E7DBC4]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-serif font-bold text-stone-700 flex items-center gap-1.5">
                <Palette size={12} className="text-[#2E5A44]" />
                <span>Paleta Activa: {title}</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                {palette.forest}
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed font-serif mb-2.5">
              {paletteDescription}
            </p>

            {/* Live Swatches */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="p-1.5 rounded-xl bg-[#FAF7F2] border border-[#EAE0CD]">
                <div 
                  className="w-full h-5 rounded-lg mb-1 shadow-inner border border-black/5" 
                  style={{ backgroundColor: palette.forest }}
                />
                <span className="text-[9px] font-serif font-bold block text-stone-700 truncate">Verde Bosque</span>
              </div>

              <div className="p-1.5 rounded-xl bg-[#FAF7F2] border border-[#EAE0CD]">
                <div 
                  className="w-full h-5 rounded-lg mb-1 shadow-inner border border-black/5" 
                  style={{ backgroundColor: palette.clay }}
                />
                <span className="text-[9px] font-serif font-bold block text-stone-700 truncate">Terracota</span>
              </div>

              <div className="p-1.5 rounded-xl bg-[#FAF7F2] border border-[#EAE0CD]">
                <div 
                  className="w-full h-5 rounded-lg mb-1 shadow-inner border border-black/5" 
                  style={{ backgroundColor: palette.amber }}
                />
                <span className="text-[9px] font-serif font-bold block text-stone-700 truncate">Ámbar 130</span>
              </div>

              <div className="p-1.5 rounded-xl bg-[#FAF7F2] border border-[#EAE0CD]">
                <div 
                  className="w-full h-5 rounded-lg mb-1 shadow-inner border border-black/5" 
                  style={{ backgroundColor: palette.canvas }}
                />
                <span className="text-[9px] font-serif font-bold block text-stone-700 truncate">Pergamino</span>
              </div>
            </div>
          </div>

          {/* Artistic Philosophy Quote */}
          <div className="mt-3 text-[10px] text-stone-400 text-center px-2">
            La luz ambiental adapta tonos según la hora — sin cambiar tu lógica de trabajo.
          </div>
        </div>
      )}
    </div>
  );
};
