
import React, { useState } from 'react';

interface TooltipSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: string;
  className?: string;
}

const TooltipSlider: React.FC<TooltipSliderProps> = ({ 
  min, 
  max, 
  step, 
  value, 
  onChange, 
  suffix = "", 
  className = "" 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Calcular la posición porcentual para el tooltip
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative pt-6 pb-2 w-full">
      {/* Tooltip flotante */}
      <div 
        className={`absolute -top-1 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded shadow-lg transition-opacity duration-200 pointer-events-none z-20 ${
          showTooltip ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ left: `${percentage}%` }}
      >
        {value}{suffix}
        {/* Flecha del tooltip */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
      
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value} 
        onChange={onChange}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseDown={() => setShowTooltip(true)}
        onMouseUp={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setShowTooltip(false)}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#1A73E8] ${className}`}
      />
    </div>
  );
};

export default TooltipSlider;
