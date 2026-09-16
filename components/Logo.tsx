import React from 'react';

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
    sm: { mark: 32, container: 'w-8 h-8', text: 'text-base' },
    md: { mark: 36, container: 'w-9 h-9', text: 'text-lg' },
    lg: { mark: 48, container: 'w-12 h-12', text: 'text-2xl' },
    xl: { mark: 64, container: 'w-16 h-16', text: 'text-4xl' }
  };

  const config = sizeConfig[size];
  const textColor = variant === 'dark' ? 'text-[#F7F4ED]' : 'text-[#223128]';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${config.container} overflow-hidden rounded-[13px] shadow-sm ${animated ? 'transition-transform duration-500' : ''}`}
        aria-hidden="true"
      >
        <svg
          width={config.mark}
          height={config.mark}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-full w-full"
        >
          <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="12.25" fill="#2E5A44" stroke="#48735E" strokeWidth="1.5" />
          <path
            d="M8.5 25.5C12 25.5 12.3 19.4 16 19.4C19.7 19.4 19.8 24.1 23.4 24.1C26.1 24.1 27 21.5 28.5 19.3"
            stroke="#F8F6F0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="25.5" r="2.2" fill="#F8F6F0" />
          <circle cx="28.6" cy="19" r="2.2" fill="#F8F6F0" />
          <path d="M28.5 8.5V14.5" stroke="#F3C997" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M25.5 11.5H31.5" stroke="#F3C997" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <span className={`font-sans font-extrabold tracking-[-0.035em] ${config.text} ${textColor}`}>
          Labora<span className="text-[#C96846]">+</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
