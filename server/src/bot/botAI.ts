import { Card, Combo, PlayerState, Augment } from '../engine/types.js';
import { evaluateCombo, canBeat } from '../engine/evaluator.js';
import { sortCards } from '../engine/cardUtils.js';

export class BotAI {
  static generateLegalMoves = generateLegalMoves;

  /**
   * Chọn Lõi thông minh dựa trên bài đang cầm
   */
  static pickAugment(choices: Augment[], hand: Card[], totalPoints: number): Augment {
    const hasHeo = hand.some((c) => c.rankValue === 15);
    const hasQuad = hasFourOfAKind(hand);
    
    // Nếu có heo hoặc tứ quý: ưu tiên Bounty Hunter (săn heo)
    if ((hasHeo || hasQuad) && choices.some((a) => a.id === 'AUG_HUNTER')) {
      return choices.find((a) => a.id === 'AUG_HUNTER')!;
    }

    // Nếu bài đẹp (nhiều sảnh/đôi): ưu tiên Overclock Top 1
    if (hand.length > 0 && choices.some((a) => a.id === 'AUG_TOP1_BOOST')) {
      return choices.find((a) => a.id === 'AUG_TOP1_BOOST')!;
    }

    // Nếu điểm thấp hoặc bài xấu: chọn Emergency Shield hoặc Stealth Matrix
    if (choices.some((a) => a.id === 'AUG_SURVIVOR')) {
      return choices.find((a) => a.id === 'AUG_SURVIVOR')!;
    }

    return choices[0];
  }

  /**
   * Quyết định đánh bài hay bỏ lượt
   * Trả về mảng Card[] nếu đánh, hoặc null nếu Bỏ lượt
   */
  static makeMove(hand: Card[], lastCombo: Combo | null, isFirstRoundMove: boolean = false): Card[] | null {
    const sorted = sortCards(hand);

    // 1. Nước mở màn ván 1: Bắt buộc phải chứa lá 3 Bích (3-spades)
    if (isFirstRoundMove) {
      const spade3 = sorted.find((c) => c.id === '3-spades');
      if (spade3) {
        // Thử tìm đôi nhỏ có chứa 3 bích
        const pairs = findPairs(sorted);
        const pairWithSpade3 = pairs.find((pair) => pair.some((c) => c.id === '3-spades'));
        if (pairWithSpade3) {
          return pairWithSpade3;
        }
        // Mặc định ra lá 3 bích
        return [spade3];
      }
    }

    // 2. Nếu được quyền ra bài đầu vòng (hoặc người trước đã qua lượt hết)
    if (!lastCombo || lastCombo.type === 'INVALID') {
      // Ưu tiên đánh rác nhỏ nhất trước (loại trừ heo)
      const nonHeoRacs = sorted.filter((c) => c.rankValue < 15);
      if (nonHeoRacs.length > 0) {
        // Tìm xem có đôi nhỏ không
        const pairs = findPairs(sorted);
        if (pairs.length > 0 && pairs[0][0].rankValue < 10) {
          return pairs[0];
        }
        return [nonHeoRacs[0]];
      }
      return [sorted[0]];
    }

    // 2. Phải đánh đè lên lastCombo
    // Tìm các combo hợp lệ từ hand có thể đè lastCombo
    const candidates = generateLegalMoves(sorted, lastCombo);
    if (candidates.length === 0) {
      return null; // Bỏ lượt
    }

    // Chọn nước đi nhỏ nhất đè được
    return candidates[0];
  }
}

function hasFourOfAKind(cards: Card[]): boolean {
  const counts: Record<number, number> = {};
  for (const c of cards) counts[c.rankValue] = (counts[c.rankValue] || 0) + 1;
  return Object.values(counts).some((v) => v === 4);
}

function findPairs(cards: Card[]): Card[][] {
  const pairs: Card[][] = [];
  for (let i = 0; i < cards.length - 1; i++) {
    if (cards[i].rankValue === cards[i + 1].rankValue) {
      pairs.push([cards[i], cards[i + 1]]);
      i++; // skip pair
    }
  }
  return pairs;
}

export function generateLegalMoves(hand: Card[], target: Combo): Card[][] {
  const moves: Card[][] = [];

  const rankGroups: Record<number, Card[]> = {};
  for (const c of hand) {
    if (!rankGroups[c.rankValue]) rankGroups[c.rankValue] = [];
    rankGroups[c.rankValue].push(c);
  }

  // 1. Đè rác (SINGLE)
  if (target.type === 'SINGLE') {
    for (const c of hand) {
      const combo = evaluateCombo([c]);
      if (canBeat(combo, target)) {
        moves.push([c]);
      }
    }
  }

  // 2. Đè đôi (PAIR)
  if (target.type === 'PAIR') {
    for (const r in rankGroups) {
      const group = rankGroups[r];
      if (group.length >= 2) {
        for (let i = 0; i < group.length - 1; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const pairCombo = evaluateCombo([group[i], group[j]]);
            if (canBeat(pairCombo, target)) {
              moves.push([group[i], group[j]]);
            }
          }
        }
      }
    }
  }

  // 3. Đè sám cô (TRIPLE)
  if (target.type === 'TRIPLE') {
    for (const r in rankGroups) {
      const group = rankGroups[r];
      if (group.length >= 3) {
        const tripleCombo = evaluateCombo(group.slice(0, 3));
        if (canBeat(tripleCombo, target)) {
          moves.push(group.slice(0, 3));
        }
      }
    }
  }

  // 4. Đè sảnh cùng độ dài (STRAIGHT) - Xử lý đúng ngay cả khi có đôi xen kẽ
  if (target.type === 'STRAIGHT') {
    const len = target.length;
    for (let startRank = 3; startRank <= 14 - len + 1; startRank++) {
      let canForm = true;
      for (let r = startRank; r < startRank + len; r++) {
        if (!rankGroups[r] || rankGroups[r].length === 0) {
          canForm = false;
          break;
        }
      }
      if (canForm) {
        // Thử với các lá cuối sảnh để kiểm tra đè được
        for (const lastCard of rankGroups[startRank + len - 1]) {
          const straightCards: Card[] = [];
          for (let r = startRank; r < startRank + len - 1; r++) {
            straightCards.push(rankGroups[r][0]);
          }
          straightCards.push(lastCard);
          const combo = evaluateCombo(straightCards);
          if (combo.type === 'STRAIGHT' && canBeat(combo, target)) {
            moves.push(straightCards);
          }
        }
      }
    }
  }

  // 5. Ba đôi thông (THREE_PAIRS_SEQ) - Chặt heo hoặc đè 3 đôi thông nhỏ hơn
  for (let startRank = 3; startRank <= 12; startRank++) {
    if (
      rankGroups[startRank]?.length >= 2 &&
      rankGroups[startRank + 1]?.length >= 2 &&
      rankGroups[startRank + 2]?.length >= 2
    ) {
      const seq3 = [
        ...rankGroups[startRank].slice(0, 2),
        ...rankGroups[startRank + 1].slice(0, 2),
        ...rankGroups[startRank + 2].slice(0, 2),
      ];
      const combo = evaluateCombo(seq3);
      if (canBeat(combo, target)) {
        moves.push(seq3);
      }
    }
  }

  // 6. Tứ quý (FOUR_OF_A_KIND) - Chặt heo đơn, đôi heo, 3 đôi thông, hoặc tứ quý nhỏ hơn
  for (const r in rankGroups) {
    if (rankGroups[r].length === 4) {
      const quadCombo = evaluateCombo(rankGroups[r]);
      if (canBeat(quadCombo, target)) {
        moves.push(rankGroups[r]);
      }
    }
  }

  // 7. Bốn đôi thông (FOUR_PAIRS_SEQ) - Chặt tứ quý, 3 đôi thông, heo đơn, đôi heo, 4 đôi thông nhỏ hơn
  for (let startRank = 3; startRank <= 11; startRank++) {
    if (
      rankGroups[startRank]?.length >= 2 &&
      rankGroups[startRank + 1]?.length >= 2 &&
      rankGroups[startRank + 2]?.length >= 2 &&
      rankGroups[startRank + 3]?.length >= 2
    ) {
      const seq4 = [
        ...rankGroups[startRank].slice(0, 2),
        ...rankGroups[startRank + 1].slice(0, 2),
        ...rankGroups[startRank + 2].slice(0, 2),
        ...rankGroups[startRank + 3].slice(0, 2),
      ];
      const combo = evaluateCombo(seq4);
      if (canBeat(combo, target)) {
        moves.push(seq4);
      }
    }
  }

  return moves;
}

