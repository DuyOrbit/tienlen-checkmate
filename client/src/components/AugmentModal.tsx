import React, { useState } from 'react';
import { Augment, Card } from '../types.js';
import { CardView } from './CardView.js';
import { Zap, Crosshair, ShieldAlert, Skull, Flame, EyeOff, Sparkles, Eye, EyeOff as EyeHide } from 'lucide-react';

interface AugmentModalProps {
  augments: Augment[];
  hand: Card[];
  onSelect: (augmentId: string) => void;
}

export const AugmentModal: React.FC<AugmentModalProps> = ({ augments, hand, onSelect }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />;
      case 'Crosshair':
        return <Crosshair className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />;
      case 'Skull':
        return <Skull className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500" />;
      case 'Flame':
        return <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />;
      case 'EyeOff':
        return <EyeOff className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />;
      case 'Sparkles':
        return <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-300" />;
      default:
        return <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />;
    }
  };

  const getRarityBadge = (rarity: Augment['rarity']) => {
    switch (rarity) {
      case 'COMMON':
        return 'border-cyan-500/40 text-cyan-400 bg-cyan-950/60';
      case 'RARE':
        return 'border-purple-500/50 text-purple-300 bg-purple-950/60';
      case 'EPIC':
        return 'border-amber-500/60 text-amber-300 bg-amber-950/60 shadow-neon-gold';
    }
  };

  // Thống kê nhanh bài trên tay để người chơi dễ định hướng
  const heoCount = hand.filter((c) => c.rankValue === 15).length;
  const rankCounts: Record<number, number> = {};
  for (const c of hand) rankCounts[c.rankValue] = (rankCounts[c.rankValue] || 0) + 1;
  const hasQuad = Object.values(rankCounts).some((v) => v === 4);

  // Khi người chơi muốn tạm thu nhỏ modal để nhìn toàn bộ bàn bài
  if (isMinimized) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-cyber font-black text-xs uppercase tracking-wider shadow-neon-cyan flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          <span>MỞ LẠI BẢNG CHỌN LÕI CÔNG NGHỆ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-4xl w-full flex flex-col items-center my-auto">
        {/* Header with Peek Button */}
        <div className="w-full flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full border border-cyan-400/40 bg-cyan-950/60 text-cyan-400 font-cyber text-[11px] tracking-widest uppercase">
              GIAI ĐOẠN ĐẶC TẢ CHIẾN THUẬT
            </span>
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 font-cyber text-xs flex items-center gap-1.5 transition"
            title="Thu nhỏ để nhìn toàn cảnh bàn chơi"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>XEM BÀN CHƠI</span>
          </button>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-xl sm:text-3xl font-cyber font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-300 to-pink-500">
            XEM BÀI & CHỌN LÕI CÔNG NGHỆ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quan sát 13 lá bài của bạn bên dưới để chọn Lõi phù hợp nhất với thế bài round này!
          </p>
        </div>

        {/* 3 Holo Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full mb-4">
          {augments.map((aug) => (
            <div
              key={aug.id}
              onClick={() => onSelect(aug.id)}
              className="group relative rounded-2xl p-4 sm:p-5 border border-slate-700/80 bg-gradient-to-b from-slate-900/90 via-slate-900 to-slate-950 hover:border-cyan-400 hover:shadow-neon-cyan transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5 select-none"
            >
              <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`text-[10px] font-cyber font-bold px-2 py-0.5 rounded border ${getRarityBadge(
                      aug.rarity
                    )}`}
                  >
                    {aug.rarity}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ⏱️ {aug.durationRounds} round
                  </span>
                </div>

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  {getIcon(aug.icon)}
                </div>

                <h3 className="text-base sm:text-lg font-cyber font-bold text-slate-100 group-hover:text-cyan-400 transition-colors mb-1.5">
                  {aug.name}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[44px]">
                  {aug.description}
                </p>
              </div>

              <button className="mt-4 w-full py-2 sm:py-2.5 rounded-xl font-cyber font-bold text-xs uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 group-hover:shadow-neon-cyan transition-all">
                KÍCH HOẠT LÕI NÀY
              </button>
            </div>
          ))}
        </div>

        {/* Player's 13 Cards Section (Directly visible while picking!) */}
        <div className="w-full rounded-2xl bg-slate-900/95 border border-cyan-500/30 p-3 sm:p-4 shadow-xl flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-between w-full mb-2.5 px-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-cyber font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                BÀI TRÊN TAY CỦA BẠN ({hand.length} LÁ):
              </span>
              {heoCount > 0 && (
                <span className="text-[10px] font-cyber px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
                  👑 {heoCount} HEO
                </span>
              )}
              {hasQuad && (
                <span className="text-[10px] font-cyber px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40">
                  ⚔️ TỨ QUÝ
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Kiểm tra kỹ bài trước khi chọn Lõi để tối ưu điểm số!
            </span>
          </div>

          {/* Cards Row */}
          <div className="flex -space-x-3 sm:-space-x-5 overflow-x-auto max-w-full py-1.5 px-2 justify-center">
            {hand.map((card) => (
              <CardView key={card.id} card={card} small={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
