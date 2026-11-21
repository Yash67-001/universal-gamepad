import React from 'react';
import { Touchpad } from './Touchpad';
import { X } from 'lucide-react';

interface TouchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseMove: (dx: number, dy: number) => void;
  onMouseClick: (button: 'left' | 'right', down: boolean) => void;
  onMouseScroll?: (deltaY: number) => void;
  isIOS?: boolean;
}

export const TouchpadModal: React.FC<TouchpadModalProps> = ({
  isOpen,
  onClose,
  onMouseMove,
  onMouseClick,
  onMouseScroll,
  isIOS = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm select-none animate-fadeIn"
    >
      {/* Floating Modal Window - Does not affect layout of underlying controller */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[380px] max-w-[92vw] h-[210px] max-h-[85vh] rounded-3xl border-2 border-cyan-400/70 bg-[#070C18]/95 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden relative"
      >
        <Touchpad
          onMouseMove={onMouseMove}
          onMouseClick={onMouseClick}
          onMouseScroll={onMouseScroll}
          onClose={onClose}
          isIOS={isIOS}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
};
