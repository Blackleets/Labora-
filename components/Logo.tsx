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
    md: { mark: 38, container: 'w-[38px] h-[38px]', text: 'text-lg' },
    lg: { mark: 50, container: 'w-[50px] h-[50px]', text: 'text-2xl' },
    xl: { mark: 66, container: 'w-[66px] h-[66px]', text: 'text-4xl' }
  };

  const config = sizeConfig[size];
  const textColor = variant === 'dark' ? 'text-[#FFFDF9]' : 'text-[#1E231F]';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${config.container} overflow-hidden rounded-[14px] shadow-[0_8px_24px_rgba(33,78,58,0.18)] ${animated ? 'transition-transform duration-500 hover:-rotate-2 hover:scale-[1.03]' : ''}`}
        aria-hidden="true"
      >
        <svg
          width={config.mark}
          height={config.mark}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-full w-full"
        >
          <defs>
            <linearGradient id="laboraMark" x1="4" y1="2" x2="39" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#214E3A" />
              <stop offset="1" stopColor="#2F6B50" />
            </linearGradient>
          </defs>
          <rect x="0.75" y="0.75" width="42.5" height="42.5" rx="13.25" fill="url(#laboraMark)" stroke="#6F967F" strokeWidth="1.5" />
          <path
            d="M9.5 28C13.2 28 13.8 20.2 18 20.2C22.1 20.2 22.1 26 26.3 26C29.5 26 30.4 22.2 32.6 18.8"
            stroke="#FFFDF9"
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9.5" cy="28" r="2.35" fill="#FFFDF9" />
          <circle cx="32.8" cy="18.4" r="2.35" fill="#D66C47" stroke="#FFFDF9" strokeWidth="1.1" />
          <path d="M31.8 8.6V14.6" stroke="#F1C56B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M28.8 11.6H34.8" stroke="#F1C56B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M13.4 11.8C15.2 10.1 17.5 9.2 20 9.2" stroke="#8EAD9A" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
        </svg>
      </div>

      {showText && (
        <span className={`font-sans font-extrabold tracking-[-0.045em] ${config.text} ${textColor}`}>
          Labora<span className="text-[#D66C47]">+</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
