import React from 'react';
import { MatchState } from '../types.js';
import { Trophy, ArrowRight, Zap, AlertTriangle } from 'lucide-react';

interface RoundSummaryModalProps {
  state: MatchState;
  onNextRound: () => void;
}

export const RoundSummaryModal: React.FC<RoundSummaryModalProps> = ({ state, onNextRound }) => {
  // Sort players by round rank
  const sortedPlayers = [...state.players].sort((a, b) => {
    const rankA = a.rankInRound || 99;
    const rankB = b.rankInRound || 99;
    return rankA - rankB;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-5">
          <span className="text-xs font-cyber text-cyan-400 uppercase tracking-widest">
            KẾT THÚC ROUND {state.roundNumber}
          </span>
          <h2 className="text-2xl font-cyber font-bold text-slate-100 mt-1">
            TỔNG KẾT & CỘNG ĐIỂM
          </h2>
        </div>

        {/* Players Round Result Table */}
        <div className="space-y-3 mb-6">
          {sortedPlayers.map((p) => {
            const isTop1 = p.rankInRound === 1;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isTop1
                    ? 'border-amber-400/60 bg-amber-950/30 shadow-neon-gold'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-cyber font-bold text-xs ${
                      isTop1 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{p.rankInRound || '-'}
                  </div>
                  <div>
                    <div className="font-cyber font-bold text-sm text-slate-200">{p.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {p.totalPoints >= 12 && (
                        <span className="text-amber-400 mr-2">⚡ Đánh chay (&gt;= 12đ)</span>
                      )}
                      {p.totalPoints >= 16 && (
                        <span className="text-yellow-300 font-bold">👑 CHECKMATE READY</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-cyber font-black text-lg text-cyan-400">
                    {p.totalPoints}đ
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isTop1 ? '+4đ (Top 1)' : p.rankInRound === 2 ? '+2đ (Top 2)' : p.rankInRound === 3 ? '+1đ (Top 3)' : '0đ'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Events / Thối heo */}
        {state.pointEvents.length > 0 && (
          <div className="mb-6 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-cyber text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              Sự kiện chặt & thối heo round này:
            </div>
            {state.pointEvents.map((e, idx) => (
              <div key={idx} className="text-cyan-300">
                • {e.message}
              </div>
            ))}
          </div>
        )}

        {/* Next Round Button */}
        <button
          onClick={onNextRound}
          className="w-full py-3 rounded-xl font-cyber font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 shadow-neon-cyan transition-all flex items-center justify-center gap-2"
        >
          <span>TIẾP TỤC ROUND {state.roundNumber + 1}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
