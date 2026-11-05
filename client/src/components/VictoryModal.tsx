import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MatchState } from '../types.js';
import { Crown, RotateCcw, Trophy } from 'lucide-react';

interface VictoryModalProps {
  state: MatchState;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ state, onRestart }) => {
  const winner = state.players.find((p) => p.id === state.winnerId);

  useEffect(() => {
    // Fire confetti bursts
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00f0ff', '#ffb703', '#ff007f'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00f0ff', '#ffb703', '#ff007f'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // Sort remaining players by total points
  const rankings = [...state.players].sort((a, b) => {
    if (a.id === state.winnerId) return -1;
    if (b.id === state.winnerId) return 1;
    return b.totalPoints - a.totalPoints;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 text-center shadow-neon-gold relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto mb-4 flex items-center justify-center shadow-neon-gold">
          <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950" />
        </div>

        <span className="text-xs font-cyber text-amber-400 uppercase tracking-widest">
          CHECKMATE 16 POINTS VICTORY
        </span>
        <h2 className="text-3xl sm:text-4xl font-cyber font-black text-slate-100 mt-1 mb-2">
          {winner?.name} VÔ ĐỊCH!
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mb-6">
          Đạt mốc 16 điểm và giành Top 1 ở Round {state.roundNumber}!
        </p>

        {/* Final Standings */}
        <div className="space-y-2 mb-6 text-left">
          {rankings.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                idx === 0
                  ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-bold'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-cyber font-bold w-6">#{idx + 1}</span>
                <span>{p.name}</span>
                {idx === 0 && <span className="text-xs text-amber-400">(Quán Quân)</span>}
              </div>
              <div className="font-cyber font-black text-base">{p.totalPoints} điểm</div>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-xl font-cyber font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-neon-gold transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>BẮT ĐẦU TRẬN ĐẤU MỚI</span>
        </button>
      </div>
    </div>
  );
};

