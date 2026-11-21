import React from 'react';
import { Share, PlusSquare, Smartphone, X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface SafariFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHideAddressBar?: () => void;
  isIOS?: boolean;
}

export const SafariFullscreenModal: React.FC<SafariFullscreenModalProps> = ({
  isOpen,
  onClose,
  onHideAddressBar,
  isIOS = true,
}) => {
  if (!isOpen) return null;

  const handleDismiss = () => {
    triggerHaptic('light', 0.5, isIOS);
    onClose();
  };

  const handleCollapseBars = () => {
    triggerHaptic('medium', 0.8, isIOS);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 1);
    }
    if (onHideAddressBar) onHideAddressBar();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="bg-[#070D1A] border-2 border-cyan-500/50 rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden text-slate-100 shadow-[0_0_35px_rgba(0,240,255,0.25)] relative">
        {/* Top Glowing Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-cyan-950/60 to-blue-950/40 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm text-cyan-300 tracking-wider">
                IPHONE FULLSCREEN GUIDE
              </h3>
              <p className="text-[10px] text-slate-400">Play without Safari address bar or buttons</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {/* Why Safari behaves this way */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
            <span className="text-cyan-400 font-bold">Why this happens:</span> Apple Safari on iPhone restricts website buttons from entering native fullscreen.
            To get <strong className="text-white">100% borderless fullscreen</strong> gaming:
          </div>

          {/* 3 Step Visual Flow */}
          <div className="space-y-2">
            {/* Step 1 */}
            <div className="p-2.5 rounded-xl bg-[#0B1426] border border-cyan-500/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shrink-0">
                <Share className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="text-[11px]">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-cyan-400 font-mono">1.</span> Tap Safari Share Button
                </div>
                <div className="text-slate-400 text-[10px]">
                  Located at the bottom toolbar or top address bar (<span className="text-cyan-300">⎋</span> icon).
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-2.5 rounded-xl bg-[#0B1426] border border-cyan-500/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shrink-0">
                <PlusSquare className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-[11px]">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400 font-mono">2.</span> Tap &ldquo;Add to Home Screen&rdquo;
                </div>
                <div className="text-slate-400 text-[10px]">
                  Scroll down the share sheet and tap <span className="text-emerald-300 font-semibold">&ldquo;Add to Home Screen&rdquo;</span>.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-2.5 rounded-xl bg-[#0B1426] border border-cyan-500/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-fuchsia-300" />
              </div>
              <div className="text-[11px]">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-fuchsia-400 font-mono">3.</span> Launch from Home Screen
                </div>
                <div className="text-slate-400 text-[10px]">
                  Opens as a <strong className="text-white">standalone PWA</strong> with zero URL bar and 100% full screen!
                </div>
              </div>
            </div>
          </div>

          {/* Quick Alternative for In-Browser Play */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCollapseBars}
              className="w-full py-2 px-3 rounded-xl bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-cyan-500/30 transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)] active:scale-95"
            >
              <span>Minimize Safari Bars &amp; Play Now</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-semibold text-[11px] hover:text-white transition-colors"
            >
              Continue Playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
