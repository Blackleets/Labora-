import React, { useEffect, useState } from 'react';
import Logo from './Logo';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 120);
    const leave = setTimeout(() => setLeaving(true), 1850);
    const done = setTimeout(onComplete, 2350);

    return () => {
      clearTimeout(show);
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#F7F4ED] flex items-center justify-center transition-all duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center text-center transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <Logo size="xl" showText={true} />
        <p className="mt-4 text-sm text-stone-500 font-medium">Gestión fiscal para riders y gestorías</p>
        <div className="mt-8 h-px w-24 bg-[#DDD5C8]" />
        <p className="mt-4 text-[11px] tracking-wide text-stone-400">Powered by Gemini 2.0</p>
      </div>
    </div>
  );
};

export default IntroAnimation;
