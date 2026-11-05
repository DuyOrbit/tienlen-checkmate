export type Suit = 'spades' | 'clubs' | 'diamonds' | 'hearts'; // Bích (1), Chuồn (2), Rô (3), Cơ (4)
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';

export interface Card {
  id: string; // e.g. "3-spades"
  rank: Rank;
  suit: Suit;
  rankValue: number; // 3 -> 3, ..., A -> 14, 2 -> 15
  suitValue: number; // spades -> 1, clubs -> 2, diamonds -> 3, hearts -> 4
  weight: number; // rankValue * 10 + suitValue for exact comparison
}

export type ComboType =
  | 'SINGLE'
  | 'PAIR'
  | 'TRIPLE'
  | 'STRAIGHT' // Sảnh (3+ lá)
  | 'THREE_PAIRS_SEQ' // 3 đôi thông
  | 'FOUR_OF_A_KIND' // Tứ quý
  | 'FOUR_PAIRS_SEQ' // 4 đôi thông
  | 'INVALID';

export interface Combo {
  type: ComboType;
  cards: Card[];
  highestCard: Card;
  length: number;
}

export type ToiTrangType =
  | 'SANH_RONG' // Sảnh từ 3 đến A (12 lá) hoặc đến 2 (13 lá)
  | 'TU_QUY_2' // 4 con Heo
  | 'NAM_DOI_THONG' // 5 đôi thông
  | 'SAU_DOI' // 6 đôi bất kỳ
  | 'DONG_MAU' // 13 lá cùng đỏ hoặc cùng đen
  | null;

export interface Augment {
  id: string;
  name: string;
  description: string;
  durationRounds: number; // 1 or 2
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC';
}

export interface PlayerActiveAugment {
  augment: Augment;
  roundsRemaining: number;
}

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  avatarSeed: string;
  hand: Card[];
  handCount?: number; // Số lá bài còn lại (được gửi cho đối thủ khi hand bị ẩn)
  rankInRound: number | null; // 1, 2, 3, 4 (null if still playing)
  totalPoints: number; // Cumulative match points
  activeAugments: PlayerActiveAugment[];
  canPickAugment: boolean; // false if >= 12 points
  isCheckmate: boolean; // true if >= 16 points
  hasPassed: boolean; // In current trick
  choppedCount: number; // for pacifist augment
  beenChoppedCount: number;
}

export interface TrickMove {
  playerId: string;
  playerName: string;
  cards: Card[];
  combo: Combo;
  timestamp: number;
}

export interface PointTransferEvent {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  reason: 'CHOP_HEO_BLACK' | 'CHOP_HEO_RED' | 'CHOP_HANG' | 'THOI_HEO' | 'THOI_HANG';
  message: string;
}

export type GamePhase =
  | 'WAITING'
  | 'DEALING'
  | 'CHECK_TOI_TRANG'
  | 'AUGMENT_SELECT'
  | 'PLAYING'
  | 'ROUND_END'
  | 'MATCH_OVER';

export interface MatchState {
  matchId: string;
  roomCode: string;
  roundNumber: number;
  phase: GamePhase;
  players: PlayerState[];
  currentTurnPlayerId: string | null;
  lastValidMove: TrickMove | null;
  roundLeaderPlayerId: string | null;
  finishOrder: string[]; // playerIds that finished in this round
  log: string[];
  pointEvents: PointTransferEvent[];
  augmentChoices: Record<string, Augment[]>; // playerId -> 3 random choices
  rerollCounts?: Record<string, number>; // playerId -> remaining reroll count
  rerolledSlots?: Record<string, boolean[]>; // playerId -> [slot0Rerolled, slot1Rerolled, slot2Rerolled]
  winnerId: string | null; // Final checkmate winner
}
