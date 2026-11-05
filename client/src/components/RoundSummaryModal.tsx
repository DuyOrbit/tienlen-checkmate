import React from 'react';
import { MatchState } from '../types.js';
import { CuteAvatar } from './CuteAvatar.js';
import { ArrowRight } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-[#0f1713]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="max-w-lg w-full bg-[#1b2620] border-2 border-[#2c3d32] rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        <div className="text-center mb-5">
          <span className="text-[11px] font-bold text-[#86efac] uppercase tracking-widest block mb-0.5">
            KẾT THÚC ROUND 0{state.roundNumber}
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#f8fafc]">
            Tổng Kết & Cộng Điểm
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Một ván đấu đầy kịch tính! Xem ai đã bứt phá nào.
          </p>
        </div>

        {/* Players Round Result Table */}
        <div className="space-y-2.5 mb-5">
          {sortedPlayers.map((p) => {
            const isTop1 = p.rankInRound === 1;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isTop1
                    ? 'border-[#fde047] bg-[#fef08a] text-[#78350f] font-bold shadow-md'
                    : 'border-[#27372d] bg-[#141e18] text-[#cbd5e1]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      isTop1 ? 'bg-[#78350f] text-[#fef08a]' : 'bg-[#27372d] text-[#94a3b8]'
                    }`}
                  >
                    #{p.rankInRound || '-'}
                  </div>
                  <CuteAvatar type={p.name} size="sm" />
                  <div>
                    <div className="font-bold text-sm leading-tight">{p.name}</div>
                    <div className={`text-[10px] ${isTop1 ? 'text-[#92400e]' : 'text-[#64748b]'}`}>
                      {p.totalPoints >= 12 && !p.isCheckmate && (
                        <span className="text-[#f87171] mr-1">⚡ Đánh chay (≥ 12đ)</span>
                      )}
                      {p.isCheckmate && (
                        <span className="text-[#eab308] font-black">👑 MỞ CHECKMATE (Cần 1 lần Top 1 để thắng)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-base sm:text-lg font-black font-heading ${isTop1 ? 'text-[#78350f]' : 'text-[#86efac]'}`}>
                    {p.totalPoints}đ
                  </div>
                  <div className={`text-[10px] ${isTop1 ? 'text-[#92400e]' : 'text-[#64748b]'}`}>
                    {isTop1 ? '+4đ (Top 1)' : p.rankInRound === 2 ? '+2đ (Top 2)' : p.rankInRound === 3 ? '+1đ (Top 3)' : '0đ'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Events / Thối heo */}
        {state.pointEvents.length > 0 && (
          <div className="mb-5 p-3 rounded-2xl bg-[#121c16] border border-[#233329] text-xs text-[#cbd5e1] space-y-1">
            <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">
              Sự kiện chặt heo & chuyển điểm:
            </div>
            {state.pointEvents.map((e, idx) => (
              <div key={idx} className="text-[#86efac] text-[11px] font-medium">
                • {e.message}
              </div>
            ))}
          </div>
        )}

        {/* Next Round Button */}
        <button
          onClick={onNextRound}
          className="w-full py-3.5 rounded-full btn-squish-green font-heading font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
        >
          <span>TIẾP TỤC ROUND 0{state.roundNumber + 1}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
