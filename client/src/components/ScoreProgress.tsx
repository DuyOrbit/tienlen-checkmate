import React from 'react';
import { PlayerState } from '../types.js';
import { Shield, Zap, Sparkles, Skull, AlertTriangle, Crown } from 'lucide-react';

interface ScoreProgressProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  position: 'south' | 'north' | 'west' | 'east';
}

export const ScoreProgress: React.FC<ScoreProgressProps> = ({
  player,
  isCurrentTurn,
  position,
}) => {
  const points = player.totalPoints;
  const pct = Math.min(100, Math.round((points / 16) * 100));
  const isPurged = points >= 12;
  const isCheckmate = points >= 16;

  const getPositionClasses = () => {
    switch (position) {
      case 'south':
        return 'border-cyan-500/50 bg-slate-900/90 shadow-neon-cyan';
      case 'north':
        return 'border-purple-500/40 bg-slate-950/80';
      case 'west':
        return 'border-amber-500/40 bg-slate-950/80';
      case 'east':
        return 'border-emerald-500/40 bg-slate-950/80';
    }
  };

  return (
    <div
      className={`rounded-2xl p-2.5 sm:p-3 border backdrop-blur-md transition-all duration-300 relative ${getPositionClasses()} ${
        isCurrentTurn ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''
      }`}
    >
      {/* Checkmate Alert Header if >= 16 */}
      {isCheckmate && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-cyber font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-neon-gold flex items-center gap-1 animate-pulse z-30">
          <Crown className="w-3 h-3" />
          MATCH POINT (16Đ)
        </div>
      )}

      {/* Player Info Row */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-cyber font-bold text-xs uppercase ${
                player.isBot
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                  : 'bg-cyan-500 text-slate-950 font-black'
              }`}
            >
              {player.name.substring(0, 2)}
            </div>
            {isCurrentTurn && (
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-cyber font-bold text-xs sm:text-sm text-slate-200 tracking-wide">
                {player.name}
              </span>
              {player.hasPassed && (
                <span className="text-[10px] text-rose-400 bg-rose-950/60 border border-rose-500/30 px-1 py-0.2 rounded">
                  BỎ LƯỢT
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>Còn {player.hand.length} lá</span>
              {player.rankInRound && (
                <span className="text-amber-400 font-bold">Top {player.rankInRound}</span>
              )}
            </div>
          </div>
        </div>

        {/* Big Points Badge */}
        <div className="text-right">
          <div className="font-cyber font-black text-lg sm:text-xl text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            {points} <span className="text-[10px] text-slate-400 font-normal">/16đ</span>
          </div>
        </div>
      </div>

      {/* Progress Bar towards 16 Points Checkmate */}
      <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isCheckmate
              ? 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-neon-gold'
              : isPurged
              ? 'bg-gradient-to-r from-rose-500 to-amber-500'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
        {/* 12pt line marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
          style={{ left: '75%' }}
          title="Mốc 12 điểm: Chặn Lõi"
        />
      </div>

      {/* 12pt Handicap Status */}
      <div className="flex justify-between items-center text-[10px] mt-1 text-slate-400 font-mono">
        <span>0đ</span>
        <span className={isPurged ? 'text-amber-400 font-bold' : ''}>
          {isPurged ? '⚠️ ĐÁNH CHAY (>=12đ)' : 'Mốc 12đ (Chặn Lõi)'}
        </span>
        <span className={isCheckmate ? 'text-yellow-400 font-bold' : ''}>16đ WIN</span>
      </div>

      {/* Active Augments Chips */}
      {player.activeAugments.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-slate-800/80">
          {player.activeAugments.map((a, i) => (
            <div
              key={i}
              className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 flex items-center gap-1 font-cyber"
              title={a.augment.description}
            >
              <Zap className="w-2.5 h-2.5 text-cyan-400" />
              <span>{a.augment.name}</span>
              <span className="text-[8px] text-cyan-400/80">({a.roundsRemaining}R)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

