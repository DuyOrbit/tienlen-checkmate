import React from 'react';
import { PlayerState } from '../types.js';
import { CuteAvatar } from './CuteAvatar.js';

interface CheckmateTrackProps {
  players: PlayerState[];
  currentTurnPlayerId: string | null;
}

export const CheckmateTrack: React.FC<CheckmateTrackProps> = ({
  players,
  currentTurnPlayerId,
}) => {
  // Max score reference for progress calculation (16 is checkmate)
  const MAX_SCORE = 16;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2.5 rounded-2xl bg-[#1c2420]/90 border border-[#2a3730] backdrop-blur-md shadow-lg select-none">
      <div className="flex items-center justify-between text-[11px] font-bold text-[#94a3b8] mb-2 px-1">
        <span className="uppercase tracking-wider text-[#cbd5e1] font-heading flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#86efac] animate-pulse" />
          ĐƯỜNG ĐUA CHECKMATE
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[#f87171] font-extrabold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" />
            12 · Mất nâng cấp
          </span>
          <span className="text-[#fde047] font-black flex items-center gap-1">
            <span className="text-sm">👑</span>
            16 CHECKMATE!
          </span>
        </div>
      </div>

      {/* Track Container */}
      <div className="relative h-6 sm:h-7 w-full flex items-center my-3">
        {/* Track Base Rail */}
        <div className="w-full h-2 sm:h-2.5 rounded-full bg-[#111714] border border-[#232f28] relative overflow-hidden">
          {/* Subtle gradient fill up to leader */}
          <div className="h-full bg-gradient-to-r from-[#22553b] via-[#347855] to-[#86efac] opacity-50 rounded-full" />
        </div>

        {/* Milestone Marker: 12 Points (Handicap threshold) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none"
          style={{ left: `${(12 / MAX_SCORE) * 100}%` }}
        >
          <div className="w-0.5 h-7 sm:h-8 bg-[#f87171] shadow-[0_0_8px_#f87171]" />
        </div>

        {/* Milestone Marker: 16 Points (Checkmate Goal) */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none"
        >
          <div className="w-0.5 h-7 sm:h-8 bg-[#fde047] shadow-[0_0_10px_#fde047]" />
        </div>

        {/* Player Avatars racing along the track */}
        {players.map((p, idx) => {
          const clamped = Math.min(MAX_SCORE, Math.max(0, p.totalPoints));
          // Percentage with slight offset to avoid overlapping exactly
          const pct = Math.min(94, Math.max(2, (clamped / MAX_SCORE) * 94));
          const isTurn = currentTurnPlayerId === p.id;
          const isCheckmate = p.totalPoints >= 16;

          return (
            <div
              key={p.id}
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-20 group"
              style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className={`relative rounded-full p-0.5 transition-transform duration-200 ${
                  isTurn ? 'scale-125 ring-2 ring-[#fde047] ring-offset-2 ring-offset-[#111714]' : ''
                } ${isCheckmate ? 'animate-bounce ring-2 ring-[#f59e0b]' : ''}`}
              >
                <CuteAvatar type={p.name} size="sm" />
                {isCheckmate && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs">👑</span>
                )}
              </div>

              {/* Tooltip on Hover */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#0f1713] text-[#f8fafc] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#2e4035] whitespace-nowrap opacity-90 pointer-events-none">
                {p.name}: {p.totalPoints}đ
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Ticks */}
      <div className="flex justify-between items-center text-[9px] font-mono text-[#64748b] px-1 -mt-1">
        <span>0</span>
        <span>4</span>
        <span>8</span>
        <span className="text-[#f87171] font-bold">12</span>
        <span className="text-[#fde047] font-bold">16</span>
      </div>
    </div>
  );
};
