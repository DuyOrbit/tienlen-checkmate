import { Card, Combo, PlayerState, Augment } from '../engine/types.js';
import { evaluateCombo, canBeat } from '../engine/evaluator.js';
import { sortCards } from '../engine/cardUtils.js';

export class BotAI {
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

    // 1. Nếu được quyền ra bài đầu vòng (hoặc người trước đã qua lượt hết)
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

function generateLegalMoves(hand: Card[], target: Combo): Card[][] {
  const moves: Card[][] = [];

  // Đè rác
  if (target.type === 'SINGLE') {
    for (const c of hand) {
      const combo = evaluateCombo([c]);
      if (canBeat(combo, target)) {
        // Nếu target là heo, cân nhắc dùng heo khác hoặc hàng
        moves.push([c]);
      }
    }
  }

  // Đè đôi
  if (target.type === 'PAIR') {
    for (let i = 0; i < hand.length - 1; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        if (hand[i].rankValue === hand[j].rankValue) {
          const combo = evaluateCombo([hand[i], hand[j]]);
          if (canBeat(combo, target)) {
            moves.push([hand[i], hand[j]]);
          }
        }
      }
    }
  }

  // Đè sảnh cùng độ dài
  if (target.type === 'STRAIGHT') {
    const len = target.length;
    // Tìm các chuỗi liên tiếp độ dài len
    for (let i = 0; i <= hand.length - len; i++) {
      // Đơn giản hóa: thử các tổ hợp liên tiếp
      const sub = hand.slice(i, i + len);
      const combo = evaluateCombo(sub);
      if (combo.type === 'STRAIGHT' && canBeat(combo, target)) {
        moves.push(sub);
      }
    }
  }

  // Hàng chặt heo (Tứ quý)
  const rankGroups: Record<number, Card[]> = {};
  for (const c of hand) {
    if (!rankGroups[c.rankValue]) rankGroups[c.rankValue] = [];
    rankGroups[c.rankValue].push(c);
  }

  for (const r in rankGroups) {
    if (rankGroups[r].length === 4) {
      const quadCombo = evaluateCombo(rankGroups[r]);
      if (canBeat(quadCombo, target)) {
        moves.push(rankGroups[r]);
      }
    }
  }

  return moves;
}

