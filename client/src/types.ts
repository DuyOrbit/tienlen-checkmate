export type Suit = 'spades' | 'clubs' | 'diamonds' | 'hearts';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
  rankValue: number;
  suitValue: number;
  weight: number;
}

export type ComboType =
  | 'SINGLE'
  | 'PAIR'
  | 'TRIPLE'
  | 'STRAIGHT'
  | 'THREE_PAIRS_SEQ'
  | 'FOUR_OF_A_KIND'
  | 'FOUR_PAIRS_SEQ'
  | 'INVALID';

export interface Combo {
  type: ComboType;
  cards: Card[];
  highestCard: Card;
  length: number;
}

export interface Augment {
  id: string;
  name: string;
  description: string;
  durationRounds: number;
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
  handCount?: number; // Số lá bài đối thủ còn lại
  rankInRound: number | null;
  totalPoints: number;
  activeAugments: PlayerActiveAugment[];
  canPickAugment: boolean;
  isCheckmate: boolean;
  hasPassed: boolean;
  choppedCount: number;
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
  reason: string;
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
  finishOrder: string[];
  log: string[];
  pointEvents: PointTransferEvent[];
  augmentChoices: Record<string, Augment[]>;
  winnerId: string | null;
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: 'USER' | 'ADMIN';
  stats?: {
    matchesPlayed: number;
    checkmateWins: number;
    totalPoints: number;
  };
}
