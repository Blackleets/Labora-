
import React, { useEffect, useState } from 'react';
import Logo from './Logo';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0); 

  useEffect(() => {
    // Cinematic AI Sequence
    // Stage 0: Blank/Init
    // Stage 1: Logo Scale Up (Spring)
    // Stage 2: Text Reveal
    // Stage 3: Subtitle Fade In
    // Stage 4: Exit
    
    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 1100);
    const t3 = setTimeout(() => setStage(3), 1800);
    const t4 = setTimeout(() => setStage(4), 3500);
    const t5 = setTimeout(onComplete, 4200);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${stage === 4 ? 'opacity-0 scale-105 filter blur-sm' : 'opacity-100'}`}>
      
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[100px] transition-transform duration-[4s] ease-out ${stage > 0 ? 'translate-x-10 translate-y-10 scale-110' : 'scale-90'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-100/50 rounded-full blur-[100px] transition-transform duration-[4s] ease-out ${stage > 0 ? '-translate-x-10 -translate-y-10 scale-125' : 'scale-75'}`}></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Logo Animation */}
        <div className={`transform transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${stage >= 1 ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10'}`}>
           <Logo size="xl" showText={false} animated={true} />
        </div>

        {/* Text Reveal */}
        <div className="mt-8 text-center overflow-hidden">
           <h1 className={`text-4xl md:text-5xl font-bold text-gray-900 tracking-tight transition-all duration-700 delay-100 ${stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
             Labora<span className="text-[#34A853]">+</span>
           </h1>
           <p className={`mt-3 text-lg text-gray-500 font-medium transition-all duration-700 delay-300 ${stage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
             Asistente Fiscal Inteligente
           </p>
        </div>

        {/* Loading Indicator */}
        <div className={`mt-12 transition-opacity duration-500 ${stage >= 2 && stage < 4 ? 'opacity-100' : 'opacity-0'}`}>
           <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#4285F4] animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
           </div>
        </div>

      </div>
      
      {/* Disclaimer */}
      <div className={`absolute bottom-8 text-xs text-gray-300 transition-opacity duration-1000 ${stage >= 3 ? 'opacity-100' : 'opacity-0'}`}>
        Powered by Google Gemini 2.0 Flash
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default IntroAnimation;
