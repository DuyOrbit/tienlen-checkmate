import { Card, Combo, ComboType, ToiTrangType } from './types.js';
import { sortCards } from './cardUtils.js';

export function evaluateCombo(selectedCards: Card[]): Combo {
  if (!selectedCards || selectedCards.length === 0) {
    return { type: 'INVALID', cards: [], highestCard: {} as Card, length: 0 };
  }

  const cards = sortCards(selectedCards);
  const n = cards.length;
  const highestCard = cards[n - 1];

  // 1 lá: Rác / Lẻ
  if (n === 1) {
    return { type: 'SINGLE', cards, highestCard, length: 1 };
  }

  // 2 lá: Đôi
  if (n === 2) {
    if (cards[0].rankValue === cards[1].rankValue) {
      return { type: 'PAIR', cards, highestCard, length: 2 };
    }
    return { type: 'INVALID', cards, highestCard, length: n };
  }

  // 3 lá: Sám cô hoặc Sảnh 3
  if (n === 3) {
    if (cards[0].rankValue === cards[1].rankValue && cards[1].rankValue === cards[2].rankValue) {
      return { type: 'TRIPLE', cards, highestCard, length: 3 };
    }
  }

  // 4 lá: Tứ quý
  if (n === 4) {
    if (
      cards[0].rankValue === cards[1].rankValue &&
      cards[1].rankValue === cards[2].rankValue &&
      cards[2].rankValue === cards[3].rankValue
    ) {
      return { type: 'FOUR_OF_A_KIND', cards, highestCard, length: 4 };
    }
  }

  // 6 lá: Có thể là 3 đôi thông
  if (n === 6) {
    if (isConsecutivePairs(cards, 3)) {
      return { type: 'THREE_PAIRS_SEQ', cards, highestCard, length: 6 };
    }
  }

  // 8 lá: Có thể là 4 đôi thông
  if (n === 8) {
    if (isConsecutivePairs(cards, 4)) {
      return { type: 'FOUR_PAIRS_SEQ', cards, highestCard, length: 8 };
    }
  }

  // Kiểm tra Sảnh (3 lá trở lên, không chứa 2 / heo, các rank liên tiếp)
  if (n >= 3 && isStraight(cards)) {
    return { type: 'STRAIGHT', cards, highestCard, length: n };
  }

  return { type: 'INVALID', cards, highestCard, length: n };
}

function isStraight(cards: Card[]): boolean {
  // Không được chứa heo (rankValue 15)
  if (cards.some((c) => c.rankValue === 15)) {
    return false;
  }
  for (let i = 0; i < cards.length - 1; i++) {
    if (cards[i + 1].rankValue !== cards[i].rankValue + 1) {
      return false;
    }
  }
  return true;
}

function isConsecutivePairs(cards: Card[], pairCount: number): boolean {
  if (cards.length !== pairCount * 2) return false;
  // Không được chứa heo
  if (cards.some((c) => c.rankValue === 15)) return false;

  for (let i = 0; i < pairCount; i++) {
    const card1 = cards[i * 2];
    const card2 = cards[i * 2 + 1];
    if (card1.rankValue !== card2.rankValue) return false;

    if (i > 0) {
      const prevPairCard = cards[(i - 1) * 2];
      if (card1.rankValue !== prevPairCard.rankValue + 1) return false;
    }
  }
  return true;
}

/**
 * Kiểm tra xem combo mới có thể đè/chặt được combo hiện tại trên bàn không
 * hasRankSupreme: Nếu kích hoạt Lõi "Đè Bất Chấp Chất" (AUG_RANK_SUPREME), các bộ Đôi hoặc Sám cô cùng số luôn được coi là lớn hơn đối thủ.
 */
export function canBeat(incoming: Combo, current: Combo, hasRankSupreme: boolean = false): boolean {
  if (incoming.type === 'INVALID') return false;

  // 1. Trường hợp bình thường (cùng loại, cùng độ dài)
  if (incoming.type === current.type && incoming.length === current.length) {
    if (hasRankSupreme && (incoming.type === 'PAIR' || incoming.type === 'TRIPLE')) {
      if (incoming.highestCard.rankValue === current.highestCard.rankValue) {
        return true;
      }
    }
    return incoming.highestCard.weight > current.highestCard.weight;
  }

  // 2. Luật chặt Heo (quân 2)
  if (current.type === 'SINGLE' && current.cards[0].rankValue === 15) {
    // Heo bị chặt bởi: 3 đôi thông, Tứ quý, 4 đôi thông
    if (incoming.type === 'THREE_PAIRS_SEQ') return true;
    if (incoming.type === 'FOUR_OF_A_KIND') return true;
    if (incoming.type === 'FOUR_PAIRS_SEQ') return true;
  }

  // Đôi Heo bị chặt bởi: Tứ quý, 4 đôi thông
  if (current.type === 'PAIR' && current.cards[0].rankValue === 15) {
    if (incoming.type === 'FOUR_OF_A_KIND') return true;
    if (incoming.type === 'FOUR_PAIRS_SEQ') return true;
  }

  // 3. Luật chặt Đè (Hàng đè Hàng)
  // 3 đôi thông bị chặt bởi: 3 đôi thông lớn hơn, Tứ quý, 4 đôi thông
  if (current.type === 'THREE_PAIRS_SEQ') {
    if (incoming.type === 'THREE_PAIRS_SEQ') {
      return incoming.highestCard.weight > current.highestCard.weight;
    }
    if (incoming.type === 'FOUR_OF_A_KIND') return true;
    if (incoming.type === 'FOUR_PAIRS_SEQ') return true;
  }

  // Tứ quý bị chặt bởi: Tứ quý lớn hơn, 4 đôi thông
  if (current.type === 'FOUR_OF_A_KIND') {
    if (incoming.type === 'FOUR_OF_A_KIND') {
      return incoming.highestCard.weight > current.highestCard.weight;
    }
    if (incoming.type === 'FOUR_PAIRS_SEQ') return true;
  }

  // 4 đôi thông bị chặt bởi 4 đôi thông lớn hơn
  if (current.type === 'FOUR_PAIRS_SEQ' && incoming.type === 'FOUR_PAIRS_SEQ') {
    return incoming.highestCard.weight > current.highestCard.weight;
  }

  return false;
}

/**
 * Kiểm tra Ăn Trắng (Tới trắng ngay sau khi chia bài)
 */
export function checkToiTrang(hand: Card[]): ToiTrangType {
  const cards = sortCards(hand);

  // 1. Tứ quý 2 (4 con heo)
  const twos = cards.filter((c) => c.rankValue === 15);
  if (twos.length === 4) {
    return 'TU_QUY_2';
  }

  // 2. Sảnh rồng (3 đến A hoặc 3 đến 2)
  const uniqueRanks = Array.from(new Set(cards.map((c) => c.rankValue))).sort((a, b) => a - b);
  if (uniqueRanks.length >= 12) {
    // Kiểm tra liên tiếp từ 3 đến A (3..14)
    let isSanhRong = true;
    for (let r = 3; r <= 14; r++) {
      if (!uniqueRanks.includes(r)) {
        isSanhRong = false;
        break;
      }
    }
    if (isSanhRong) return 'SANH_RONG';
  }

  // 3. 6 đôi bất kỳ
  let pairCount = 0;
  const rankCounts: Record<number, number> = {};
  for (const c of cards) {
    rankCounts[c.rankValue] = (rankCounts[c.rankValue] || 0) + 1;
  }
  for (const r in rankCounts) {
    pairCount += Math.floor(rankCounts[r] / 2);
  }
  if (pairCount >= 6) {
    return 'SAU_DOI';
  }

  // 4. Đồng màu (13 lá cùng đỏ hoặc cùng đen)
  const redCount = cards.filter((c) => c.suit === 'hearts' || c.suit === 'diamonds').length;
  if (redCount === 13 || redCount === 0) {
    return 'DONG_MAU';
  }

  return null;
}

