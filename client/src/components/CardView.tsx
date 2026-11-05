import React from 'react';
import { Card, Suit } from '../types.js';

interface CardViewProps {
  card: Card;
  isSelected?: boolean;
  onClick?: () => void;
  isFaceDown?: boolean;
  small?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isSelected = false,
  onClick,
  isFaceDown = false,
  small = false,
}) => {
  // Mặt úp lưng bài (Phong cách Poker Felt xanh rừng rậm)
  if (isFaceDown) {
    return (
      <div
        className={`relative rounded-xl border-2 border-[#153424] bg-gradient-to-br from-[#1d4632] via-[#163827] to-[#122e20] shadow-md flex items-center justify-center cursor-default select-none ${
          small ? 'w-8 h-12 sm:w-9 sm:h-13' : 'w-14 h-20 sm:w-16 sm:h-24'
        }`}
      >
        <div className="absolute inset-1 rounded-lg border border-[#347855]/40 flex items-center justify-center bg-[#183d2b]/60">
          <span className="text-[10px] text-[#fef08a] font-bold">♠</span>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const isHeo = card.rankValue === 15;

  const renderSuitIcon = (suit: Suit, className: string) => {
    switch (suit) {
      case 'hearts':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case 'diamonds':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2L2 12l10 10 10-10L12 2z" />
          </svg>
        );
      case 'clubs':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M19.5 9.5c-1.03 0-1.9.62-2.29 1.5-.47-.88-1.39-1.5-2.46-1.5-.13 0-.25.01-.38.03C14.78 8.64 15 7.6 15 6.5 15 4.01 12.99 2 10.5 2S6 4.01 6 6.5c0 1.1.22 2.14.63 3.03-.13-.02-.25-.03-.38-.03-1.07 0-1.99.62-2.46 1.5-.39-.88-1.26-1.5-2.29-1.5-1.38 0-2.5 1.12-2.5 2.5 0 1.25.92 2.29 2.13 2.47L3 21h15l1.87-6.53c1.21-.18 2.13-1.22 2.13-2.47 0-1.38-1.12-2.5-2.5-2.5z" />
          </svg>
        );
      case 'spades':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2C9.5 5 4 10.5 4 14.5c0 2.48 2.02 4.5 4.5 4.5 1.48 0 2.79-.72 3.5-1.82V21h-2v1h4v-1h-2v-3.82c.71 1.1 2.02 1.82 3.5 1.82 2.48 0 4.5-2.02 4.5-4.5C20 10.5 14.5 5 12 2z" />
          </svg>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      data-card-id={card.id}
      data-card-rank={card.rank}
      data-card-suit={card.suit}
      className={`relative select-none rounded-xl sm:rounded-2xl transition-all duration-150 cursor-pointer bg-[#fdfbf7] border border-[#e2e8f0] shadow-md flex-shrink-0 ${
        small
          ? 'w-9 h-13 sm:w-10 sm:h-14 text-xs'
          : 'w-15 h-22 sm:w-20 sm:h-28 text-sm sm:text-base'
      } ${
        isSelected
          ? '-translate-y-5 sm:-translate-y-6 ring-4 ring-[#86efac] shadow-2xl z-30 scale-105'
          : 'hover:-translate-y-2 hover:shadow-lg z-10'
      }`}
    >
      {/* Top Left Rank & Suit */}
      <div
        className={`absolute top-1 left-1.5 sm:top-1.5 sm:left-2 flex flex-col items-center leading-none font-black ${
          isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'
        }`}
      >
        <div className="flex items-center gap-0.5">
          <span className="text-sm sm:text-base tracking-tighter">{card.rank}</span>
          {isHeo && <span className="text-[10px] leading-none">👑</span>}
        </div>
        <div className="mt-0.5">
          {renderSuitIcon(card.suit, small ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
        </div>
      </div>

      {/* Center Big Graphic - Clean & Elegant */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`${isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'}`}>
          {renderSuitIcon(card.suit, small ? 'w-4 h-4' : 'w-6 h-6 sm:w-8 sm:h-8')}
        </div>
      </div>

      {/* Bottom Right Inverted Rank & Suit (only for normal size) */}
      {!small && (
        <div
          className={`absolute bottom-1 right-1.5 sm:bottom-1.5 sm:right-2 flex flex-col items-center leading-none font-black rotate-180 ${
            isRed ? 'text-[#e11d48]' : 'text-[#1e293b]'
          }`}
        >
          <div className="flex items-center gap-0.5">
            <span className="text-sm sm:text-base tracking-tighter">{card.rank}</span>
            {isHeo && <span className="text-[10px] leading-none">👑</span>}
          </div>
          <div className="mt-0.5">
            {renderSuitIcon(card.suit, 'w-3 h-3 sm:w-3.5 sm:h-3.5')}
          </div>
        </div>
      )}
    </div>
  );
};
