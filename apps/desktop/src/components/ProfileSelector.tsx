import React from 'react';
import { ControllerProfileType } from '@universal-gamepad/shared-protocol';
import { Settings2 } from 'lucide-react';

interface ProfileSelectorProps {
  currentProfile: ControllerProfileType;
  onSelectProfile: (profile: ControllerProfileType) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  currentProfile,
  onSelectProfile,
}) => {
  const profiles: { id: ControllerProfileType; label: string; desc: string }[] = [
    {
      id: 'xbox',
      label: 'Xbox 360 / Wireless',
      desc: 'Standard XInput layout for 99% of modern PC games and Steam',
    },
    {
      id: 'playstation',
      label: 'PlayStation DualShock',
      desc: 'Classic Cross/Circle/Square/Triangle layout',
    },
    {
      id: 'nintendo',
      label: 'Nintendo Pro Layout',
      desc: 'Inverted A/B and X/Y face button orientation',
    },
    {
      id: 'racing',
      label: 'Racing & Driving Rig',
      desc: 'Highway Rush & racing games (GAS, BRK, NITRO, CAM)',
    },
    {
      id: 'arcade',
      label: 'Retro Arcade Fighter',
      desc: 'Classic 4-button arcade layout (1, 2, 3, 4)',
    },
    {
      id: 'kbm',
      label: 'WASD & Mouse Look (Mode B)',
      desc: 'Keyboard & mouse emulation for web or non-gamepad titles',
    },
  ];

  return (
    <div className="bg-gamepad-surface border border-gamepad-border rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-5 h-5 text-cyan-400" />
        <h2 className="font-bold text-base text-white tracking-wide">ACTIVE CONTROLLER PROFILE</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectProfile(p.id)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              currentProfile === p.id
                ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className={`font-bold text-xs ${currentProfile === p.id ? 'text-cyan-300' : 'text-slate-200'}`}>
              {p.label}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 leading-snug">{p.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
