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
    md: { mark: 40, container: 'w-10 h-10', text: 'text-lg' },
    lg: { mark: 52, container: 'w-[52px] h-[52px]', text: 'text-2xl' },
    xl: { mark: 68, container: 'w-[68px] h-[68px]', text: 'text-4xl' }
  };

  const config = sizeConfig[size];
  const textColor = variant === 'dark' ? 'text-[#FFFEFB]' : 'text-[#0A1210]';
  const plusColor = variant === 'dark' ? 'text-[#E8D48A]' : 'text-[#E85D3B]';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${config.container} overflow-hidden rounded-[15px] shadow-[0_12px_32px_rgba(15,61,46,0.28)] ring-1 ring-white/10 ${animated ? 'transition-transform duration-500 hover:-rotate-2 hover:scale-[1.03]' : ''}`}
        aria-hidden="true"
      >
        <svg
          width={config.mark}
          height={config.mark}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-full w-full"
        >
          <defs>
            <linearGradient id="laboraMarkPremium" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0F3D2E" />
              <stop offset="0.55" stopColor="#1A5C42" />
              <stop offset="1" stopColor="#247A56" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#laboraMarkPremium)" />
          <path
            d="M14 42C19.5 42 20.5 30 27 30C33.2 30 33.2 40 39.5 40C44 40 45.8 33.5 49.5 28"
            stroke="#FFFEFB"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="42" r="3" fill="#FFFEFB" />
          <circle cx="50" cy="27.5" r="3.2" fill="#E85D3B" stroke="#FFFEFB" strokeWidth="1.4" />
          <path d="M48.2 14.5V22.5" stroke="#C9A227" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M44.2 18.5H52.2" stroke="#C9A227" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <span className={`font-sans font-extrabold tracking-[-0.05em] ${config.text} ${textColor}`}>
          Labora<span className={plusColor}>+</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
