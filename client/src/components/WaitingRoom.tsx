import React, { useState } from 'react';
import { MatchState } from '../types.js';
import { CuteAvatar } from './CuteAvatar.js';
import { Copy, Check, UserPlus, Play, ArrowLeft, Users, Shield } from 'lucide-react';

interface WaitingRoomProps {
  state: MatchState;
  currentUserId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeaveRoom: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  state,
  currentUserId,
  onStartGame,
  onAddBot,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = state.players[0]?.id === currentUserId;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const seats = [0, 1, 2, 3];

  return (
    <div className="min-h-screen bg-[#161c18] text-[#f1f5f9] flex flex-col justify-between select-none p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={onLeaveRoom}
          className="px-4 py-2 rounded-full bg-[#202b23] border border-[#2d3d32] text-xs font-bold text-[#cbd5e1] hover:text-white transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Rời phòng</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] font-bold text-[#86efac] tracking-widest uppercase block">
            PHÒNG RIÊNG TƯ
          </span>
          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#f8fafc]">
            Sảnh Chờ Bạn Bè
          </h1>
        </div>

        <div className="w-24" />
      </div>

      {/* Main Room Card */}
      <div className="max-w-3xl w-full mx-auto my-auto bg-[#1c2721] border-2 border-[#2b3a32] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Room Code Badge */}
        <div className="text-center mb-8">
          <span className="text-xs text-[#94a3b8] font-medium">MÃ PHÒNG ĐẤU</span>
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="px-5 py-2 rounded-2xl bg-[#111714] border-2 border-[#86efac] font-heading font-black text-2xl sm:text-3xl tracking-widest text-[#86efac] shadow-inner">
              #{state.roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-3 rounded-2xl btn-squish-gray flex items-center justify-center"
              title="Sao chép mã phòng"
            >
              {copied ? <Check className="w-5 h-5 text-[#86efac]" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-[#64748b] mt-2">
            Gửi mã này cho bạn bè để cùng vào bàn (Tối đa 4 người)
          </p>
        </div>

        {/* 4 Seats in the room */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
          {seats.map((idx) => {
            const player = state.players[idx];
            const isMe = player?.id === currentUserId;
            const isRoomHost = idx === 0;

            if (player) {
              return (
                <div
                  key={player.id}
                  className={`rounded-2xl p-4 flex flex-col items-center justify-center border-2 transition-all ${
                    isMe
                      ? 'bg-[#182a1f] border-[#86efac] shadow-lg'
                      : 'bg-[#141e18] border-[#223127]'
                  }`}
                >
                  <div className="relative mb-2">
                    <CuteAvatar type={player.name} size="lg" />
                    {isRoomHost && (
                      <span className="absolute -top-2 -right-1 text-base animate-bounce" title="Chủ phòng">
                        👑
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#f8fafc] text-center truncate max-w-[100px]">
                    {player.name}
                  </div>
                  <div className="text-[10px] text-[#86efac] font-semibold mt-0.5">
                    {isMe ? 'Bạn (Sẵn sàng)' : player.isBot ? 'Bot tự động' : 'Đã tham gia'}
                  </div>
                </div>
              );
            }

            // Empty Seat
            return (
              <div
                key={`empty-${idx}`}
                className="rounded-2xl p-4 border-2 border-dashed border-[#2b3a32] bg-[#111714]/40 flex flex-col items-center justify-center min-h-[140px]"
              >
                <div className="w-12 h-12 rounded-full border border-dashed border-[#3d5246] flex items-center justify-center text-xl text-[#475569] mb-2">
                  +
                </div>
                <span className="text-[11px] text-[#64748b] font-medium text-center mb-2">
                  Chờ bạn bè...
                </span>
                {isHost && (
                  <button
                    onClick={onAddBot}
                    className="px-2.5 py-1 rounded-full bg-[#1b3325] border border-[#2d5c41] text-[10px] font-bold text-[#86efac] hover:bg-[#224431] transition flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Bot</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#233329]">
          <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
            <Users className="w-4 h-4 text-[#86efac]" />
            <span>
              Số người hiện tại: <strong>{state.players.length}/4</strong>
              {state.players.length < 4 && ' (Hệ thống sẽ tự động thêm Bot nếu thiếu)'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isHost ? (
              <button
                onClick={onStartGame}
                className="w-full sm:w-auto px-8 py-3 rounded-full btn-squish-green font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>BẮT ĐẦU TRẬN ĐẤU</span>
              </button>
            ) : (
              <div className="px-6 py-3 rounded-full bg-[#1b251f] border border-[#2b3a32] text-xs font-bold text-[#86efac] text-center w-full sm:w-auto">
                Đang chờ chủ phòng bắt đầu...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-[#64748b]">
        Tiến Lên Checkmate 16 • Phòng Riêng Tư
      </div>
    </div>
  );
};
