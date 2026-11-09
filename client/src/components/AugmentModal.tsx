import React, { useState, useEffect } from 'react';
import { Augment, Card } from '../types.js';
import { Eye, Check, Sparkles } from 'lucide-react';
import { CardView } from './CardView.js';

interface AugmentModalProps {
  augments: Augment[];
  hand: Card[];
  rerolledSlots?: boolean[];
  onSelect: (augmentId: string) => void;
  onRerollSlot?: (slotIndex: number) => void;
}

export const AugmentModal: React.FC<AugmentModalProps> = ({
  augments,
  hand,
  rerolledSlots = [false, false, false],
  onSelect,
  onRerollSlot,
}) => {
  const [selectedId, setSelectedId] = useState<string>(augments[0]?.id || '');
  const [timeLeft, setTimeLeft] = useState<number>(25);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Cập nhật selectedId khi augments thay đổi sau khi roll
  useEffect(() => {
    if (augments.length > 0 && !augments.some((a) => a.id === selectedId)) {
      setSelectedId(augments[0].id);
    }
  }, [augments]);

  // Auto-countdown 25s
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

    if (id.includes('ambush') || name.includes('phục kích')) {
      return {
        category: 'PHỤC KÍCH',
        badgeBg: 'bg-[#831843]',
        badgeText: 'text-[#fce7f3]',
        cardBg: 'bg-[#fdf2f8]',
        icon: '🥷',
        iconBg: 'bg-[#fbcfe8]',
        headline: 'Phá lệ nhảy vào chặt Heo',
        highlightText: aug.description || 'Dù đã Bỏ Lượt ở vòng này, bạn vẫn có thể nhảy vào chặt Heo bằng Hàng!',
        footerTag: 'Bất ngờ lật kèo (1 round)',
      };
    }
    if (id.includes('stowaway') || name.includes('kẹp rác')) {
      return {
        category: 'TẨU THOÁT',
        badgeBg: 'bg-[#0f766e]',
        badgeText: 'text-[#ccfbf1]',
        cardBg: 'bg-[#ccfbf1]',
        icon: '📦',
        iconBg: 'bg-[#99f6e4]',
        headline: 'Kẹp rác tẩu thoát (bài <= 3)',
        highlightText: aug.description || 'Khi còn <= 3 lá: kẹp 1 lá rác nhỏ nhất vào bộ hợp lệ để đánh ra!',
        footerTag: 'Tẩu thoát ngoạn mục (1 round)',
      };
    }
    if (id.includes('scout_pig') || name.includes('thử lửa')) {
      return {
        category: 'BẢO HIỂM',
        badgeBg: 'bg-[#1e3a8a]',
        badgeText: 'text-[#dbeafe]',
        cardBg: 'bg-[#eff6ff]',
        icon: '🛡️',
        iconBg: 'bg-[#bfdbfe]',
        headline: 'Heo đầu tiên không mất điểm',
        highlightText: aug.description || 'Lá Heo (2) đầu tiên đánh ra nếu bị chặt: Không bị cướp điểm nào!',
        footerTag: 'Thử lửa an toàn (1 round)',
      };
    }
    if (id.includes('rank_supreme') || name.includes('bất chấp chất')) {
      return {
        category: 'ÁP ĐẢO',
        badgeBg: 'bg-[#701a75]',
        badgeText: 'text-[#fae8ff]',
        cardBg: 'bg-[#fdf4ff]',
        icon: '👑',
        iconBg: 'bg-[#f5d0fe]',
        headline: 'Đôi & Sám cô cùng số luôn đè',
        highlightText: aug.description || 'So sánh Đôi hoặc Sám cùng số: Bài bạn luôn tính là chất lớn hơn và đè đối thủ!',
        footerTag: 'Hiệu lực 2 round',
      };
    }
    if (id.includes('high_roller') || name.includes('jackpot') || name.includes('neon')) {
      return {
        category: 'ĐỘT BIẾN',
        badgeBg: 'bg-[#581c87]',
        badgeText: 'text-[#f5d0fe]',
        cardBg: 'bg-[#fae8ff]',
        icon: '👑',
        iconBg: 'bg-[#f0abfc]',
        headline: '+3 điểm Quán Quân',
        highlightText: aug.description || 'Về Top 1 nhận thêm +3 điểm thưởng.',
        footerTag: 'Chỉ áp dụng trong 1 round',
      };
    }
    if (id.includes('clutch') || name.includes('last stand') || name.includes('lật kèo')) {
      return {
        category: 'LẬT KÈO',
        badgeBg: 'bg-[#831843]',
        badgeText: 'text-[#fce7f3]',
        cardBg: 'bg-[#fef9c3]',
        icon: '🚀',
        iconBg: 'bg-[#fef08a]',
        headline: '+3 điểm lội ngược dòng',
        highlightText: aug.description || 'Điểm thấp mà về Top 1/2 nhận thêm +3 điểm.',
        footerTag: 'Hiệu lực 1 round',
      };
    }
    if (id.includes('double') || name.includes('turbo')) {
      return {
        category: 'TỐC ĐỘ',
        badgeBg: 'bg-[#1e1b4b]',
        badgeText: 'text-[#e0e7ff]',
        cardBg: 'bg-[#ede9fe]',
        icon: '⚡',
        iconBg: 'bg-[#ddd6fe]',
        headline: '+1 điểm khi về Top 1/2',
        highlightText: aug.description || 'Mỗi khi về Top 1 hoặc 2: nhận thêm +1 điểm.',
        footerTag: 'Hiệu lực 2 round',
      };
    }
    if (id.includes('comeback') || name.includes('phoenix')) {
      return {
        category: 'HỒI SINH',
        badgeBg: 'bg-[#7c2d12]',
        badgeText: 'text-[#ffedd5]',
        cardBg: 'bg-[#ffedd5]',
        icon: '🦅',
        iconBg: 'bg-[#fed7aa]',
        headline: '+2 điểm an ủi tích lũy',
        highlightText: aug.description || 'Về Top 3 hoặc 4 vẫn có điểm thưởng.',
        footerTag: 'Tự hủy sau 1 round',
      };
    }
    if (id.includes('chop_defense') || name.includes('barrier')) {
      return {
        category: 'PHÒNG THỦ',
        badgeBg: 'bg-[#134e4a]',
        badgeText: 'text-[#ccfbf1]',
        cardBg: 'bg-[#ccfbf1]',
        icon: '🛡️',
        iconBg: 'bg-[#99f6e4]',
        headline: 'Chặn 1 lần thối/chặt heo',
        highlightText: aug.description || 'Chặn toàn bộ điểm phạt khi bị chặt/thối heo.',
        footerTag: 'Hiệu lực trong 2 round',
      };
    }
    if (id.includes('overclock') || name.includes('về nhất')) {
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
    if (id.includes('bounty') || id.includes('hunter') || name.includes('săn heo')) {
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
    if (id.includes('gambit') || name.includes('roulette')) {
      return {
        category: 'CƯỢC LỚN',
        badgeBg: 'bg-[#991b1b]',
        badgeText: 'text-[#fee2e2]',
        cardBg: 'bg-[#ffe4e6]',
        icon: '🔥',
        iconBg: 'bg-[#fecdd3]',
        headline: 'Top 1 nhận +7 điểm',
        highlightText: 'Cược lớn: Top 1 nhận 7đ; các hạng khác 0đ.',
        footerTag: 'Ăn cả ngã về không',
      };
    }
    return {
      category: 'PHÒNG THỦ',
      badgeBg: 'bg-[#374151]',
      badgeText: 'text-[#f3f4f6]',
      cardBg: 'bg-[#e0f2fe]',
      icon: '🛡️',
      iconBg: 'bg-[#bae6fd]',
      headline: aug.name,
      highlightText: aug.description || 'Một nâng cấp chiến thuật hữu ích.',
      footerTag: `Hiệu lực ${aug.durationRounds} round`,
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

                {/* Nút Đổi riêng thẻ này (mỗi thẻ đổi được 1 lần) */}
                {onRerollSlot && (
                  <button
                    type="button"
                    disabled={rerolledSlots[idx]}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRerollSlot(idx);
                    }}
                    className={`mt-2 py-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow ${
                      rerolledSlots[idx]
                        ? 'bg-black/15 text-[#64748b] cursor-not-allowed opacity-60'
                        : 'bg-[#0f172a] hover:bg-[#1e293b] text-[#fde047] hover:scale-[1.02] cursor-pointer border border-[#334155]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-[#fde047]" />
                    <span>{rerolledSlots[idx] ? 'Đã đổi' : '🎲 Đổi thẻ này'}</span>
                  </button>
                )}
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-3 w-full">
          <button
            onClick={handleConfirm}
            className="w-full sm:w-80 py-3 rounded-full btn-squish-green font-heading font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>XÁC NHẬN CHỌN LÕI</span>
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-[#94a3b8]">
            Tự xác nhận khi hết giờ · Mỗi thẻ Lõi có thể bấm "🎲 Đổi thẻ này" riêng 1 lần
          </span>
        </div>
      </div>
    </div>
  );
};
