import React, { useState } from 'react';
import { PlayerState } from '../types.js';
import { CuteAvatar } from './CuteAvatar.js';

interface PlayerSeatProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  position: 'top' | 'left' | 'right';
  speechBubble?: string;
  lastActionText?: string;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isCurrentTurn,
  position,
  speechBubble,
  lastActionText,
}) => {
  const [hoveredAugment, setHoveredAugment] = useState<string | null>(null);
  const cardCount = player.handCount ?? player.hand.length;
  const isPurged = player.totalPoints >= 12;
  const isCheckmate = player.totalPoints >= 16;

  // Lấy icon đại diện cho augment
  const getAugmentIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('về nhất') || n.includes('overclock')) return '🚀';
    if (n.includes('săn heo') || n.includes('bounty') || n.includes('chặt')) return '🐷';
    if (n.includes('khiên') || n.includes('shield')) return '🛡️';
    if (n.includes('roulette')) return '🎲';
    return '⚡';
  };

  return (
    <div className="flex flex-col items-center relative select-none z-20">
      {/* Speech / Reaction Bubble */}
      {speechBubble && (
        <div className="absolute -top-7 px-3 py-1 bg-[#fef08a] text-[#713f12] text-xs font-black rounded-2xl shadow-md border border-[#fde047] flex items-center gap-1 animate-bounce">
          <span>{speechBubble}</span>
        </div>
      )}

      {/* Main Avatar Pod with Score Badge */}
      <div className="relative flex flex-col items-center">
        {/* Pulsing Turn Halo */}
        <div
          className={`relative rounded-full p-1 transition-all duration-300 ${
            isCurrentTurn
              ? 'ring-4 ring-[#86efac] ring-offset-2 ring-offset-[#1b241e] scale-105 shadow-lg'
              : ''
          }`}
        >
          <CuteAvatar type={player.name} size="lg" />

          {/* Points Pill Badge */}
          <div className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full bg-[#fef08a] text-[#78350f] font-black text-[11px] shadow border border-[#fde047]">
            {player.totalPoints} đ
          </div>
        </div>

        {/* Fanned Card Backs representing remaining cards */}
        <div className="flex items-center -space-x-4 my-1 relative">
          <div className="w-5 h-7 rounded-md bg-[#163827] border border-[#2b6144] shadow transform -rotate-12" />
          <div className="w-5 h-7 rounded-md bg-[#1d4632] border border-[#347855] shadow transform rotate-0" />
          <div className="w-5 h-7 rounded-md bg-[#163827] border border-[#2b6144] shadow transform rotate-12 relative">
            {/* Card count tag */}
            <span className="absolute -bottom-1 -right-2 w-4 h-4 rounded-full bg-[#0f1713] text-[#f8fafc] text-[9px] font-black flex items-center justify-center border border-[#334155]">
              {cardCount}
            </span>
          </div>
        </div>

        {/* Name Tag Pill */}
        <div className="px-3 py-0.5 rounded-full bg-[#111714]/90 border border-[#232f28] text-xs font-bold text-[#e2e8f0] flex items-center gap-1 shadow">
          <span>{player.name}</span>
          {player.hasPassed && (
            <span className="text-[9px] px-1 bg-[#ef4444]/30 text-[#fca5a5] rounded">
              Bỏ
            </span>
          )}
        </div>

        {/* 🌟 HIỂN THỊ LÕI / PHÉP MÀU ĐỐI THỦ ĐANG SỞ HỮU */}
        {player.activeAugments && player.activeAugments.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 relative">
            {player.activeAugments.map((a, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredAugment(a.augment.id)}
                onMouseLeave={() => setHoveredAugment(null)}
                className="relative group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#1b2f23] border border-[#86efac]/60 flex items-center justify-center text-xs shadow hover:scale-110 transition">
                  {getAugmentIcon(a.augment.name)}
                </div>

                {/* Tooltip hiển thị chiến thuật của đối thủ */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-[#0f1713] border border-[#86efac]/80 p-2 rounded-xl text-left w-48 shadow-2xl z-50 pointer-events-none">
                  <div className="text-[11px] font-bold text-[#86efac] flex items-center gap-1">
                    <span>{getAugmentIcon(a.augment.name)}</span>
                    <span>{a.augment.name}</span>
                  </div>
                  <div className="text-[10px] text-[#cbd5e1] leading-tight mt-0.5">
                    {a.augment.description}
                  </div>
                  <div className="text-[9px] text-[#fde047] font-semibold mt-1">
                    Còn {a.roundsRemaining} ván hiệu lực
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status flags (Handicap / Checkmate) */}
        {isCheckmate && (
          <span className="mt-1 text-[10px] font-black text-[#fde047] flex items-center gap-0.5">
            👑 MATCH POINT
          </span>
        )}
        {isPurged && !isCheckmate && (
          <span className="mt-0.5 text-[9px] font-bold text-[#f87171]">
            ⚡ Đánh chay (bị tước lõi)
          </span>
        )}

        {/* Last Action Label */}
        {lastActionText && (
          <div className="mt-1 px-2 py-0.5 rounded-full bg-[#86efac]/20 border border-[#86efac]/40 text-[#86efac] text-[10px] font-bold">
            {lastActionText}
          </div>
        )}
      </div>
    </div>
  );
};
