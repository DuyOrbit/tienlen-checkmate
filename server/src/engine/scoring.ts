import { Combo, PlayerState, PointTransferEvent, Card } from './types.js';
import { evaluateAugmentBonuses } from './augments.js';

/**
 * Xử lý cướp điểm tức thì khi chặt Heo hoặc chặt Hàng
 */
export function handleChopPointTransfer(
  chopper: PlayerState,
  victim: PlayerState,
  incomingCombo: Combo,
  currentCombo: Combo
): PointTransferEvent | null {
  let stealAmount = 0;
  let reason: PointTransferEvent['reason'] = 'CHOP_HEO_BLACK';
  let message = '';

  // 1. Chặt Heo
  if (currentCombo.type === 'SINGLE' && currentCombo.cards[0].rankValue === 15) {
    const heo = currentCombo.cards[0];
    const isRed = heo.suit === 'hearts' || heo.suit === 'diamonds';
    stealAmount = isRed ? 2 : 1;
    reason = isRed ? 'CHOP_HEO_RED' : 'CHOP_HEO_BLACK';
    message = `${chopper.name} chặt ${isRed ? 'Heo Đỏ' : 'Heo Đen'} của ${victim.name}!`;
  } else if (currentCombo.type === 'PAIR' && currentCombo.cards[0].rankValue === 15) {
    // Chặt đôi heo
    stealAmount = 3;
    reason = 'CHOP_HEO_RED';
    message = `${chopper.name} chặt Đôi Heo của ${victim.name}!`;
  } else if (
    currentCombo.type === 'THREE_PAIRS_SEQ' ||
    currentCombo.type === 'FOUR_OF_A_KIND' ||
    currentCombo.type === 'FOUR_PAIRS_SEQ'
  ) {
    // Chặt đè hàng
    stealAmount = 3;
    reason = 'CHOP_HANG';
    message = `${chopper.name} chặt đè hàng của ${victim.name}!`;
  }

  if (stealAmount <= 0) return null;

  // Kiểm tra lõi Bounty Hunter (cướp thêm 1 điểm)
  const hasHunter = chopper.activeAugments.some((a) => a.augment.id === 'AUG_HUNTER');
  if (hasHunter) {
    stealAmount += 1;
    message += ` (Lõi Bounty Hunter cướp thêm +1đ!)`;
  }

  // Giới hạn điểm bị cướp: Điểm của victim không được âm dưới 0
  const actualSteal = Math.min(victim.totalPoints, stealAmount);
  victim.totalPoints = Math.max(0, victim.totalPoints - actualSteal);
  chopper.totalPoints += actualSteal;

  chopper.choppedCount++;
  victim.beenChoppedCount++;

  return {
    fromPlayerId: victim.id,
    toPlayerId: chopper.id,
    amount: actualSteal,
    reason,
    message: `${message} (+${actualSteal} điểm chuyển từ ${victim.name} sang ${chopper.name})`,
  };
}

/**
 * Xử lý phạt thối heo/hàng cuối ván (khi ván đấu kết thúc nhưng vẫn còn heo/hàng trên tay)
 * Điểm phạt được chuyển trực tiếp cho người về Nhất (Top 1) của round đó.
 */
export function handleThoiPenalties(
  players: PlayerState[],
  top1Player: PlayerState
): PointTransferEvent[] {
  const events: PointTransferEvent[] = [];

  for (const p of players) {
    if (p.id === top1Player.id) continue;
    if (p.hand.length === 0) continue; // Đã hết bài

    let penalty = 0;
    for (const card of p.hand) {
      if (card.rankValue === 15) {
        const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
        penalty += isRed ? 2 : 1;
      }
    }

    if (penalty > 0) {
      const actualPenalty = Math.min(p.totalPoints, penalty);
      p.totalPoints = Math.max(0, p.totalPoints - actualPenalty);
      top1Player.totalPoints += actualPenalty;

      events.push({
        fromPlayerId: p.id,
        toPlayerId: top1Player.id,
        amount: actualPenalty,
        reason: 'THOI_HEO',
        message: `${p.name} bị thối heo cuối ván! Bị trừ ${actualPenalty} điểm chuyển cho Quán quân round ${top1Player.name}`,
      });
    }
  }

  return events;
}

/**
 * Tính điểm xếp hạng sau round và xử lý các luật 12 điểm & Checkmate 16 điểm
 */
export function finalizeRoundScores(
  players: PlayerState[],
  isToiTrang: boolean = false
): {
  roundPoints: Record<string, number>;
  notes: Record<string, string[]>;
  checkmateWinner: PlayerState | null;
} {
  const roundPoints: Record<string, number> = {};
  const notes: Record<string, string[]> = {};
  let checkmateWinner: PlayerState | null = null;

  for (const player of players) {
    let basePoints = 0;
    if (player.rankInRound === 1) {
      basePoints = isToiTrang ? 5 : 4; // Ăn trắng được 5 điểm
    } else if (player.rankInRound === 2) {
      basePoints = 2;
    } else if (player.rankInRound === 3) {
      basePoints = 1;
    } else {
      basePoints = 0;
    }

    // Đánh giá hiệu ứng Lõi điểm số
    const { finalPoints, bonusNotes } = evaluateAugmentBonuses(player, basePoints);
    roundPoints[player.id] = finalPoints;
    notes[player.id] = bonusNotes;

    // Cộng điểm vào tổng tích lũy
    player.totalPoints += finalPoints;

    // Giảm số round còn lại của các active augments
    player.activeAugments = player.activeAugments
      .map((a) => ({ ...a, roundsRemaining: a.roundsRemaining - 1 }))
      .filter((a) => a.roundsRemaining > 0);

    // LUẬT CÂN BẰNG 12 ĐIỂM:
    // Nếu tổng điểm >= 12: TƯỚC HẾT LÕI và KHÔNG ĐƯỢC CHỌN LÕI NỮA (Đánh chay)
    if (player.totalPoints >= 12) {
      if (player.activeAugments.length > 0) {
        notes[player.id].push('⚡ Vượt mốc 12 điểm: Bị xóa toàn bộ Lõi tích lũy (Chuyển sang Đánh Chay)!');
      }
      player.activeAugments = [];
      player.canPickAugment = false;
    } else {
      player.canPickAugment = true;
    }

    // LUẬT CHECKMATE 16 ĐIỂM:
    if (player.totalPoints >= 16) {
      player.isCheckmate = true;
    }
  }

  // Kiểm tra điều kiện THẮNG TOÀN TRẬN:
  // Nếu có người chơi đang có >= 16 điểm VÀ vừa giành Top 1 ở round này -> WIN!
  for (const player of players) {
    if (player.rankInRound === 1 && player.totalPoints >= 16) {
      checkmateWinner = player;
      break;
    }
  }

  return { roundPoints, notes, checkmateWinner };
}

