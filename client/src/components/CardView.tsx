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
  if (isFaceDown) {
    return (
      <div
        className={`relative rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-lg flex items-center justify-center cursor-default select-none ${
          small ? 'w-10 h-14' : 'w-16 h-24 sm:w-20 sm:h-28'
        }`}
      >
        <div className="absolute inset-1 rounded-lg border border-cyan-400/20 bg-slate-950/60 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border border-cyan-400/40 flex items-center justify-center">
            <span className="text-[10px] text-cyan-400 font-cyber font-bold">CY</span>
          </div>
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
      className={`relative select-none rounded-xl transition-all duration-200 cursor-pointer ${
        small
          ? 'w-10 h-14 text-xs'
          : 'w-16 h-24 sm:w-20 sm:h-28 text-sm sm:text-base'
      } ${
        isSelected
          ? '-translate-y-5 sm:-translate-y-6 shadow-neon-cyan ring-2 ring-cyan-400 z-20'
          : 'hover:-translate-y-2 hover:shadow-lg z-10'
      } ${
        isHeo
          ? 'bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-950 border-2 border-amber-400'
          : 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-700/80 hover:border-cyan-400/60'
      }`}
    >
      {/* Top Left Rank & Suit */}
      <div
        className={`absolute top-1 left-1.5 flex flex-col items-center leading-tight font-cyber font-bold ${
          isRed ? 'text-rose-500' : 'text-slate-200'
        }`}
      >
        <span>{card.rank}</span>
        {renderSuitIcon(card.suit, 'w-3 h-3 sm:w-3.5 sm:h-3.5')}
      </div>

      {/* Center Graphic */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {isHeo ? (
          <div className="flex flex-col items-center">
            <span className="text-amber-400 text-xs sm:text-sm font-cyber font-extrabold tracking-wider animate-pulse">
              👑 HEO
            </span>
            {renderSuitIcon(
              card.suit,
              `w-6 h-6 sm:w-8 sm:h-8 ${isRed ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]'}`
            )}
          </div>
        ) : (
          renderSuitIcon(
            card.suit,
            `w-6 h-6 sm:w-8 sm:h-8 opacity-80 ${isRed ? 'text-rose-500' : 'text-slate-300'}`
          )
        )}
      </div>

      {/* Bottom Right Rank (inverted) */}
      <div
        className={`absolute bottom-1 right-1.5 rotate-180 flex flex-col items-center leading-tight font-cyber font-bold ${
          isRed ? 'text-rose-500' : 'text-slate-200'
        }`}
      >
        <span>{card.rank}</span>
        {renderSuitIcon(card.suit, 'w-3 h-3 sm:w-3.5 sm:h-3.5')}
      </div>
    </div>
  );
};

