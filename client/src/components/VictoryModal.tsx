import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MatchState } from '../types.js';
import { CuteAvatar } from './CuteAvatar.js';

interface VictoryModalProps {
  state: MatchState;
  onRestart: () => void;
  onGoLobby?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ state, onRestart, onGoLobby }) => {
  const winner = state.players.find((p) => p.id === state.winnerId) || state.players[0];

  useEffect(() => {
    // Fire confetti bursts
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ['#86efac', '#fde047', '#f43f5e', '#38bdf8'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ['#86efac', '#fde047', '#f43f5e', '#38bdf8'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // Sort players by total points
  const rankings = [...state.players].sort((a, b) => {
    if (a.id === state.winnerId) return -1;
    if (b.id === state.winnerId) return 1;
    return b.totalPoints - a.totalPoints;
  });

  const funnySubtitles = [
    'Nhà vô địch · Quá đỉnh',
    'Suýt nữa thì...',
    'Chặt heo đầy nghệ thuật',
    'Chill là chính',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1713]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="max-w-xl w-full bg-[#1b2620] border-2 border-[#3b4d41] rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center">
        {/* Crown & Winner Avatar with sparkles */}
        <div className="relative inline-block mb-3">
          <span className="text-[11px] font-bold text-[#fde047] uppercase tracking-widest block mb-1">
            LÊN NGÔI VƯƠNG
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#f8fafc] mb-3">
            CHECKMATE 16!
          </h2>

          <div className="relative inline-block my-2">
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-4xl sm:text-5xl animate-bounce">
              👑
            </span>
            <div className="p-1 rounded-full ring-4 ring-[#fde047] ring-offset-4 ring-offset-[#1b2620] shadow-xl">
              <CuteAvatar type={winner?.name} size="xl" />
            </div>
            <span className="absolute -top-2 -left-4 text-xl text-[#fde047] animate-pulse">✨</span>
            <span className="absolute -bottom-1 -right-3 text-xl text-[#fde047] animate-pulse">✨</span>
          </div>

          <h3 className="text-lg sm:text-xl font-heading font-black text-[#f8fafc] mt-2">
            {winner?.name} lên ngôi!
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5 font-medium">
            Bài có thể xấu. Nhưng hôm nay bạn quá đỉnh.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 my-5">
          <div className="p-3 rounded-2xl bg-[#121c16] border border-[#233329]">
            <div className="text-xl sm:text-2xl font-black text-[#fde047] font-heading">
              {winner?.totalPoints || 16}
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#94a3b8] uppercase font-bold tracking-wider mt-0.5">
              ĐIỂM CHECKMATE
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#121c16] border border-[#233329]">
            <div className="text-xl sm:text-2xl font-black text-[#86efac] font-heading">
              0{state.roundNumber}
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#94a3b8] uppercase font-bold tracking-wider mt-0.5">
              VÁN VỀ NHẤT
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#121c16] border border-[#233329]">
            <div className="text-xl sm:text-2xl font-black text-[#f87171] font-heading">
              {state.pointEvents.length > 0 ? `0${state.pointEvents.length}` : '02'}
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#94a3b8] uppercase font-bold tracking-wider mt-0.5">
              PHA CHẶT HEO
            </div>
          </div>
        </div>

        {/* Final Standings Leaderboard */}
        <div className="text-left mb-6">
          <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2 px-1 flex justify-between">
            <span>BẢNG XẾP HẠNG CHUNG CUỘC</span>
            <span>ĐIỂM</span>
          </div>

          <div className="space-y-2">
            {rankings.map((p, idx) => {
              const isWinner = idx === 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all ${
                    isWinner
                      ? 'bg-[#fef08a] border-[#fde047] text-[#78350f] shadow-md font-bold'
                      : 'bg-[#141e18] border-[#223127] text-[#cbd5e1]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        isWinner ? 'bg-[#78350f] text-[#fef08a]' : 'bg-[#223127] text-[#94a3b8]'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <CuteAvatar type={p.name} size="sm" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold leading-tight">
                        {p.name}
                      </div>
                      <div className={`text-[10px] ${isWinner ? 'text-[#92400e]' : 'text-[#64748b]'}`}>
                        {funnySubtitles[idx] || 'Người chơi'}
                      </div>
                    </div>
                  </div>

                  <div className="text-base sm:text-lg font-black font-heading pr-2">
                    {p.totalPoints}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onRestart}
            className="w-full py-3.5 rounded-full btn-squish-green font-heading font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
          >
            <span>CHƠI TIẾP VÁN MỚI 🪅</span>
          </button>
          {onGoLobby && (
            <button
              onClick={onGoLobby}
              className="text-xs text-[#94a3b8] hover:text-[#f8fafc] underline transition py-1"
            >
              Về sảnh
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
