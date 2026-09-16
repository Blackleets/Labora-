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
    sm: { icon: 15, container: 'w-8 h-8', text: 'text-base' },
    md: { icon: 17, container: 'w-9 h-9', text: 'text-lg' },
    lg: { icon: 22, container: 'w-12 h-12', text: 'text-2xl' },
    xl: { icon: 30, container: 'w-16 h-16', text: 'text-4xl' }
  };

  const config = sizeConfig[size];
  const textColor = variant === 'dark' ? 'text-[#F7F4ED]' : 'text-[#223128]';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${config.container} rounded-xl bg-[#2E5A44] border border-[#3E7158] flex items-center justify-center text-white shadow-sm ${animated ? 'transition-transform duration-500' : ''}`}
        aria-hidden="true"
      >
        <Sparkles size={config.icon} strokeWidth={2.15} />
      </div>

      {showText && (
        <span className={`font-sans font-extrabold tracking-[-0.03em] ${config.text} ${textColor}`}>
          Labora<span className="text-[#C96846]">+</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
