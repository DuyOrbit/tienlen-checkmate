import React from 'react';

export type AnimalType = 'cat' | 'bear' | 'fox' | 'rabbit' | 'pig' | 'robot';

interface CuteAvatarProps {
  type?: AnimalType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  badge?: React.ReactNode;
}

export const CuteAvatar: React.FC<CuteAvatarProps> = ({
  type = 'cat',
  size = 'md',
  className = '',
  badge,
}) => {
  // Normalize type
  const lower = (type || 'cat').toLowerCase();
  let animal: AnimalType = 'cat';
  if (lower.includes('bắp') || lower.includes('gấu') || lower.includes('bear')) animal = 'bear';
  else if (lower.includes('cáo') || lower.includes('fox')) animal = 'fox';
  else if (lower.includes('thỏ') || lower.includes('rabbit')) animal = 'rabbit';
  else if (lower.includes('heo') || lower.includes('pig')) animal = 'pig';
  else if (lower.includes('bot') || lower.includes('robot')) animal = 'robot';
  else animal = 'cat';

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  }[size];

  const renderAnimalFace = () => {
    switch (animal) {
      case 'cat': // Mèo Mập (Vàng cam, tai mèo hồng)
        return (
          <div className="w-full h-full rounded-full bg-[#fcd34d] border-2 border-[#f59e0b] flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Ears */}
            <div className="absolute top-0.5 left-1 w-2.5 h-2.5 bg-[#f59e0b] rounded-tl-full rotate-[-20deg]" />
            <div className="absolute top-0.5 right-1 w-2.5 h-2.5 bg-[#f59e0b] rounded-tr-full rotate-[20deg]" />
            {/* Eyes */}
            <div className="flex items-center gap-2 z-10 -mt-1">
              <span className="w-1.5 h-2 bg-[#78350f] rounded-full" />
              <span className="w-1.5 h-2 bg-[#78350f] rounded-full" />
            </div>
            {/* Nose & Mouth */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="w-1.5 h-1 bg-[#ef4444] rounded-full" />
              <span className="text-[8px] font-bold text-[#78350f] leading-none">ω</span>
            </div>
            {/* Cheeks */}
            <div className="absolute bottom-2.5 left-1 w-2 h-1 bg-[#f87171] rounded-full opacity-60" />
            <div className="absolute bottom-2.5 right-1 w-2 h-1 bg-[#f87171] rounded-full opacity-60" />
          </div>
        );

      case 'bear': // Bắp Rang / Gấu Nâu
        return (
          <div className="w-full h-full rounded-full bg-[#b45309] border-2 border-[#78350f] flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Round ears */}
            <div className="absolute top-0 left-1 w-3 h-3 bg-[#78350f] rounded-full" />
            <div className="absolute top-0 right-1 w-3 h-3 bg-[#78350f] rounded-full" />
            {/* Snout area */}
            <div className="w-6 h-5 rounded-full bg-[#fde68a] absolute bottom-1.5 flex flex-col items-center justify-center">
              <span className="w-2 h-1.5 bg-[#451a03] rounded-full -mt-1" />
              <span className="text-[7px] font-bold text-[#451a03] leading-none">ᴥ</span>
            </div>
            {/* Eyes */}
            <div className="flex items-center gap-3 z-10 -mt-2">
              <span className="w-1.5 h-1.5 bg-[#451a03] rounded-full" />
              <span className="w-1.5 h-1.5 bg-[#451a03] rounded-full" />
            </div>
          </div>
        );

      case 'fox': // Cáo Nhỏ (Cam tươi)
        return (
          <div className="w-full h-full rounded-full bg-[#f97316] border-2 border-[#c2410c] flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Pointy ears */}
            <div className="absolute top-0 left-0.5 w-3 h-3.5 bg-[#c2410c] clip-path-polygon rotate-[-15deg] rounded-t-sm" />
            <div className="absolute top-0 right-0.5 w-3 h-3.5 bg-[#c2410c] clip-path-polygon rotate-[15deg] rounded-t-sm" />
            {/* White cheeks */}
            <div className="absolute bottom-0 inset-x-1 h-4 bg-[#fff7ed] rounded-b-full flex flex-col items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#431407] rounded-full -mt-1" />
            </div>
            {/* Slanted Eyes */}
            <div className="flex items-center gap-2.5 z-10 -mt-2">
              <span className="w-1.5 h-1 bg-[#431407] rounded-full rotate-[15deg]" />
              <span className="w-1.5 h-1 bg-[#431407] rounded-full rotate-[-15deg]" />
            </div>
          </div>
        );

      case 'rabbit': // Thỏ Chill (Trắng / xám)
        return (
          <div className="w-full h-full rounded-full bg-[#cbd5e1] border-2 border-[#94a3b8] flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Long ears */}
            <div className="absolute top-0 left-2 w-2 h-4 bg-[#e2e8f0] border border-[#f43f5e]/30 rounded-t-full" />
            <div className="absolute top-0 right-2 w-2 h-4 bg-[#e2e8f0] border border-[#f43f5e]/30 rounded-t-full" />
            {/* Eyes */}
            <div className="flex items-center gap-2.5 z-10 mt-1">
              <span className="w-1.5 h-1.5 bg-[#334155] rounded-full" />
              <span className="w-1.5 h-1.5 bg-[#334155] rounded-full" />
            </div>
            {/* Pink nose */}
            <div className="absolute bottom-2 w-1.5 h-1 bg-[#f43f5e] rounded-full" />
          </div>
        );

      case 'pig': // Heo Con (Hồng phấn)
        return (
          <div className="w-full h-full rounded-full bg-[#fca5a5] border-2 border-[#f87171] flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Big snout */}
            <div className="w-5 h-3.5 rounded-full bg-[#f87171] border border-[#ef4444] absolute bottom-1.5 flex items-center justify-center gap-1">
              <span className="w-1 h-1 bg-[#7f1d1d] rounded-full" />
              <span className="w-1 h-1 bg-[#7f1d1d] rounded-full" />
            </div>
            {/* Eyes */}
            <div className="flex items-center gap-3 z-10 -mt-2">
              <span className="w-1.5 h-1.5 bg-[#450a0a] rounded-full" />
              <span className="w-1.5 h-1.5 bg-[#450a0a] rounded-full" />
            </div>
          </div>
        );

      case 'robot': // Bot
      default:
        return (
          <div className="w-full h-full rounded-full bg-[#38bdf8] border-2 border-[#0284c7] flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Robot eyes */}
            <div className="flex items-center gap-2 z-10">
              <span className="w-2 h-2 bg-[#fef08a] rounded-sm animate-pulse" />
              <span className="w-2 h-2 bg-[#fef08a] rounded-sm animate-pulse" />
            </div>
            <div className="absolute bottom-1.5 w-3 h-1 bg-[#0f172a] rounded-full" />
          </div>
        );
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
      {renderAnimalFace()}
      {badge && <div className="absolute -bottom-1 -right-1 z-20">{badge}</div>}
    </div>
  );
};
