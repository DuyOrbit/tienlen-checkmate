import React, { useState, useEffect } from 'react';
import { Augment, Card } from '../types.js';
import { Eye, Check, Sparkles } from 'lucide-react';
import { CardView } from './CardView.js';

interface AugmentModalProps {
  augments: Augment[];
  hand: Card[];
  onSelect: (augmentId: string) => void;
}

export const AugmentModal: React.FC<AugmentModalProps> = ({ augments, hand, onSelect }) => {
  const [selectedId, setSelectedId] = useState<string>(augments[0]?.id || '');
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Auto-countdown 10s
  useEffect(() => {
    if (timeLeft <= 0) {
      if (selectedId) onSelect(selectedId);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, selectedId, onSelect]);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  // Helper visual category & icons for cards
  const getAugmentTheme = (aug: Augment, idx: number) => {
    const id = aug.id.toLowerCase();
    const name = aug.name.toLowerCase();

    if (id.includes('overclock') || name.includes('về nhất') || idx === 0) {
      return {
        category: 'BỨT TỐC',
        badgeBg: 'bg-[#78350f]',
        badgeText: 'text-[#fef3c7]',
        cardBg: 'bg-[#fef3c7]',
        icon: '🚀',
        iconBg: 'bg-[#fde68a]',
        headline: '+2 điểm khi về nhất',
        highlightText: 'Về nhất ở ván tiếp theo? Nhận thêm 2 điểm thưởng.',
        footerTag: 'Chỉ áp dụng trong 1 ván',
      };
    }
    if (id.includes('bounty') || id.includes('hunter') || name.includes('săn heo') || idx === 1) {
      return {
        category: 'TẤN CÔNG',
        badgeBg: 'bg-[#15803d]',
        badgeText: 'text-[#dcfce7]',
        cardBg: 'bg-[#fee2e2]',
        icon: '🐷',
        iconBg: 'bg-[#fecaca]',
        headline: '+1 điểm mỗi lần chặt heo',
        highlightText: 'Dùng Tứ Quý / 3 Đôi Thông chặt heo nhận thêm điểm.',
        footerTag: 'Sẵn sàng săn heo',
      };
    }
    return {
      category: 'PHÒNG THỦ',
      badgeBg: 'bg-[#374151]',
      badgeText: 'text-[#f3f4f6]',
      cardBg: 'bg-[#e0f2fe]',
      icon: '🛡️',
      iconBg: 'bg-[#bae6fd]',
      headline: 'Chặn 1 lần mất 2 điểm',
      highlightText: 'Một lớp bảo vệ êm ái cho pha xui đầu tiên của bạn.',
      footerTag: 'Tự kích hoạt khi bị phạt',
    };
  };

  // Thống kê nhanh tay bài
  const heoCards = hand.filter((c) => c.rankValue === 15);
  const heoCount = heoCards.length;

  if (isMinimized) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-6 py-2.5 rounded-full btn-squish-green font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl"
        >
          <Eye className="w-4 h-4" />
          <span>MỞ LẠI BẢNG PHÉP MÀU ({timeLeft}s)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1713]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <div className="max-w-4xl w-full bg-[#1b2620] border-2 border-[#2b3d33] rounded-3xl p-4 sm:p-6 shadow-2xl relative my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-center w-full relative">
            <span className="text-[11px] font-bold text-[#fde047] uppercase tracking-widest flex items-center justify-center gap-1">
              ✦ PHẦN THƯỞNG SAU VÁN ✦
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#f8fafc] mt-0.5">
              Chọn một chút “phép màu”
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5 font-medium">
              Một nâng cấp nhỏ, một pha lật kèo lớn. Chọn 1 trong 3 thẻ!
            </p>
          </div>

          {/* Countdown timer pill badge */}
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#78350f]/80 border border-[#b45309] text-[#fde047] font-black text-xs shadow">
            {timeLeft}s
          </div>
        </div>

        {/* 3 Collectible Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {augments.map((aug, idx) => {
            const theme = getAugmentTheme(aug, idx);
            const isSelected = selectedId === aug.id;

            return (
              <div
                key={aug.id}
                onClick={() => setSelectedId(aug.id)}
                className={`relative rounded-3xl p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer transition-all duration-150 ${
                  theme.cardBg
                } ${
                  isSelected
                    ? 'ring-4 ring-[#86efac] shadow-2xl scale-[1.02] -translate-y-1'
                    : 'opacity-90 hover:opacity-100 hover:-translate-y-0.5 shadow-md'
                }`}
              >
                {/* Checkmark icon for selected card */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#86efac] border-2 border-[#166534] flex items-center justify-center text-[#14532d] shadow">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Top Category Badge */}
                <div className="flex justify-center mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}
                  >
                    {theme.category}
                  </span>
                </div>

                {/* Big Center Icon */}
                <div className="flex justify-center my-1">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl shadow-inner ${theme.iconBg}`}
                  >
                    {theme.icon}
                  </div>
                </div>

                {/* Name & Headline */}
                <div className="text-center my-1.5">
                  <h3 className="text-sm sm:text-base font-heading font-black text-[#1e293b]">
                    {aug.name}
                  </h3>
                  <div className="text-[11px] font-black text-[#0f172a] mt-0.5">
                    {theme.headline}
                  </div>
                </div>

                {/* Description */}
                <p className="text-[10px] text-[#475569] text-center leading-relaxed mb-3 line-clamp-2">
                  {aug.description || theme.highlightText}
                </p>

                {/* Bottom Duration / Status Tag */}
                <div className="rounded-xl py-1 px-2 bg-black/10 text-center text-[9px] font-bold text-[#334155]">
                  {isSelected ? `Đã chọn · ${theme.footerTag}` : theme.footerTag}
                </div>
              </div>
            );
          })}
        </div>

        {/* 🃏 HAND PREVIEW: HIỂN THỊ BÀI ĐÃ CHIA SẴN CHO NGƯỜI CHƠI XEM (Hình 1) */}
        <div className="my-3 p-3 rounded-2xl bg-[#141e18] border border-[#233329]">
          <div className="flex items-center justify-between text-xs font-bold text-[#cbd5e1] mb-2 px-1">
            <span className="flex items-center gap-1.5">
              <span>🃏 Bài của bạn đã chia ({hand.length} lá):</span>
              {heoCount > 0 ? (
                <span className="text-[#fde047] font-black text-[11px]">
                  (Có {heoCount} Heo 👑)
                </span>
              ) : (
                <span className="text-[#94a3b8] text-[11px]">(Không có Heo)</span>
              )}
            </span>
            <span className="text-[10px] text-[#86efac]">
              Xem bài để chọn Lõi phù hợp
            </span>
          </div>

          {/* Fanned cards list */}
          <div className="flex -space-x-3 sm:-space-x-4 overflow-x-auto py-1 px-1 justify-start sm:justify-center">
            {hand.map((c) => (
              <CardView key={c.id} card={c} small={true} />
            ))}
          </div>
        </div>

        {/* Action Button & Disclaimer */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <button
            onClick={handleConfirm}
            className="w-full sm:w-64 py-3 rounded-full btn-squish-green font-heading font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
          >
            <span>XÁC NHẬN</span>
          </button>
          <span className="text-[10px] text-[#94a3b8]">
            Tự xác nhận khi hết giờ · Chỉ có hiệu lực trong ván tiếp theo
          </span>
        </div>
      </div>
    </div>
  );
};
