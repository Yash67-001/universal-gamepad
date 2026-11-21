import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

export const OrientationPrompt: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // In landscape, width > height
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center mb-6 animate-pulse">
        <RotateCcw className="w-10 h-10 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
      </div>
      <h2 className="text-xl font-bold tracking-wide mb-2 text-cyan-300">
        PLEASE ROTATE YOUR DEVICE
      </h2>
      <p className="text-sm text-slate-400 max-w-xs mb-4">
        Universal Gamepad is ergonomically designed for landscape gaming mode.
      </p>
      <div className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
        💡 Tip: Lock screen rotation to landscape for the best grip!
      </div>
    </div>
  );
};
