import React, { useEffect, useState } from 'react';
import { LogoLockup } from './Logo';

interface IntroAnimationProps {
  onComplete: () => void;
}

const prefersReducedMotion = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'idle' | 'play' | 'leave'>('idle');
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const playDelay = 40;
    const leaveAt = reduced ? 700 : 1950;
    const doneAt = reduced ? 1100 : 2400;

    const show = setTimeout(() => setPhase('play'), playDelay);
    const leave = setTimeout(() => setPhase('leave'), leaveAt);
    const done = setTimeout(onComplete, doneAt);

    return () => {
      clearTimeout(show);
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, [onComplete, reduced]);

  const playing = phase === 'play' || phase === 'leave';

  return (
    <div
      className={`labora-intro-splash fixed inset-0 z-[100] flex items-center justify-center bg-[#F7F3EA] transition-opacity duration-500 ${
        phase === 'leave' ? 'opacity-0' : 'opacity-100'
      } ${reduced ? 'labora-intro-reduced' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className={`labora-intro-lockup flex flex-col items-center text-center ${
          playing ? 'is-playing' : ''
        }`}
      >
        <LogoLockup size="hero" showText variant="light" entrance />
        <p
          className={`labora-intro-tagline mt-5 max-w-[18rem] text-[13px] font-medium leading-relaxed tracking-[-0.01em] text-[#6B645C] ${
            playing ? 'is-visible' : ''
          }`}
        >
          Claridad fiscal para autónomos y gestorías
        </p>
        <div
          className={`labora-intro-rule mt-7 h-px w-20 bg-gradient-to-r from-transparent via-[#C9A574]/70 to-transparent ${
            playing ? 'is-visible' : ''
          }`}
        />
      </div>
    </div>
  );
};

export default IntroAnimation;
