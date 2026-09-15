
import React from 'react';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'dark' | 'light';
  animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '', 
  variant = 'light',
  animated = false
}) => {
  const sizeConfig = {
    sm: { icon: 16, container: 'w-8 h-8', text: 'text-lg' },
    md: { icon: 20, container: 'w-10 h-10', text: 'text-xl' },
    lg: { icon: 32, container: 'w-16 h-16', text: 'text-3xl' },
    xl: { icon: 48, container: 'w-24 h-24', text: 'text-5xl' }
  };

  const config = sizeConfig[size];
  const textColor = variant === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Container: Gradient Blue-Green, Rounded-XL (12px), Soft Shadow */}
      <div 
        className={`
          ${config.container} 
          bg-gradient-to-br from-blue-600 to-emerald-500 
          rounded-xl 
          flex items-center justify-center 
          text-white 
          shadow-lg shadow-blue-500/20
          ${animated ? 'animate-[bounce_3s_infinite]' : ''}
        `}
      >
        <Sparkles 
          size={config.icon} 
          fill="currentColor" 
          className={animated ? 'animate-[spin_4s_linear_infinite]' : ''} 
        />
      </div>
      
      {/* Text Label: Font Heading (Jakarta), Black Weight */}
      {showText && (
        <span className={`font-heading font-black tracking-tight ${config.text} ${textColor}`}>
          Labora<span className="text-emerald-500">+</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
