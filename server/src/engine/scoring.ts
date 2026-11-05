import { Combo, PlayerState, PointTransferEvent, Card } from './types.js';
import { evaluateAugmentBonuses } from './augments.js';

/**
 * Xử lý cướp điểm tức thì khi CHẶT HEO hoặc CHẶT HÀNG
 * THEO ĐÚNG LUẬT TIẾN LÊN MIỀN NAM:
 * - Heo đè Heo (kể cả Heo lớn đè Heo nhỏ) KHÔNG ĐƯỢC COI LÀ CHẶT HEO (không cướp điểm).
 * - Chặt Heo Đơn (1 Heo): CHỈ XẢY RA khi bị 3 ĐÔI THÔNG, TỨ QUÝ hoặc 4 ĐÔI THÔNG chặt!
 * - Chặt Đôi Heo: CHỈ XẢY RA khi bị TỨ QUÝ hoặc 4 ĐÔI THÔNG chặt!
 * - Chặt Đè Hàng: 3 đôi thông bị đè bởi 3 đôi thông lớn hơn / Tứ quý / 4 đôi thông; Tứ quý bị đè bởi Tứ quý lớn hơn / 4 đôi thông.
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

  const isIncomingHang =
    incomingCombo.type === 'THREE_PAIRS_SEQ' ||
    incomingCombo.type === 'FOUR_OF_A_KIND' ||
    incomingCombo.type === 'FOUR_PAIRS_SEQ';

  // 1. Chặt Heo Đơn: Phải do Hàng (3 đôi thông, Tứ quý, 4 đôi thông) chặt!
  // Heo lớn hơn đè Heo nhỏ hơn KHÔNG tính là chặt heo!
  if (currentCombo.type === 'SINGLE' && currentCombo.cards[0].rankValue === 15) {
    if (isIncomingHang) {
      const heo = currentCombo.cards[0];
      const isRed = heo.suit === 'hearts' || heo.suit === 'diamonds';
      stealAmount = isRed ? 2 : 1;
      reason = isRed ? 'CHOP_HEO_RED' : 'CHOP_HEO_BLACK';
      
      const hangName =
        incomingCombo.type === 'THREE_PAIRS_SEQ'
          ? '3 Đôi Thông'
          : incomingCombo.type === 'FOUR_OF_A_KIND'
          ? 'Tứ Quý'
          : '4 Đôi Thông';

      message = `${chopper.name} dùng ${hangName} CHẶT ${isRed ? 'Heo Đỏ' : 'Heo Đen'} của ${victim.name}!`;
    } else {
      // Heo lớn đè Heo nhỏ -> Đánh bài bình thường, không tính chặt
      return null;
    }
  }

  // 2. Chặt Đôi Heo: Phải do Tứ quý hoặc 4 đôi thông chặt!
  // Đôi heo lớn đè đôi heo nhỏ KHÔNG tính là chặt heo!
  else if (currentCombo.type === 'PAIR' && currentCombo.cards[0].rankValue === 15) {
    if (incomingCombo.type === 'FOUR_OF_A_KIND' || incomingCombo.type === 'FOUR_PAIRS_SEQ') {
      stealAmount = 3;
      reason = 'CHOP_HEO_RED';
      const hangName = incomingCombo.type === 'FOUR_OF_A_KIND' ? 'Tứ Quý' : '4 Đôi Thông';
      message = `${chopper.name} dùng ${hangName} CHẶT Đôi Heo của ${victim.name}!`;
    } else {
      return null;
    }
  }

  // 3. Chặt Đè Hàng: 3 đôi thông / Tứ quý / 4 đôi thông bị Hàng lớn hơn chặt đè
  else if (
    currentCombo.type === 'THREE_PAIRS_SEQ' ||
    currentCombo.type === 'FOUR_OF_A_KIND' ||
    currentCombo.type === 'FOUR_PAIRS_SEQ'
  ) {
    if (isIncomingHang) {
      stealAmount = 3;
      reason = 'CHOP_HANG';
      message = `${chopper.name} CHẶT ĐÈ HÀNG của ${victim.name}!`;
    } else {
      return null;
    }
  }

  if (stealAmount <= 0) return null;

  // Kiểm tra lõi Bounty Hunter của chopper (cướp thêm 1 điểm)
  const hasHunter = chopper.activeAugments.some(
    (a) => a.augment.id === 'AUG_HUNTER' || a.augment.name.toLowerCase().includes('săn heo')
  );
  if (hasHunter) {
    stealAmount += 1;
    message += ` (Lõi Thợ Săn Heo cướp thêm +1đ!)`;
  }

  // Kiểm tra lõi Phòng thủ (Emergency Shield / Nano Barrier) của victim: Chặn 1 lần mất điểm
  const shieldIdx = victim.activeAugments.findIndex(
    (a) =>
      a.augment.id === 'AUG_SHIELD' ||
      a.augment.id === 'AUG_CHOP_DEFENSE' ||
      a.augment.name.toLowerCase().includes('khiên') ||
      a.augment.name.toLowerCase().includes('barrier')
  );
  if (shieldIdx !== -1) {
    message += ` 🛡️ Khiên Bong Bóng của ${victim.name} đã hấp thụ toàn bộ điểm phạt!`;
    victim.activeAugments.splice(shieldIdx, 1);
    stealAmount = 0;
    return {
      fromPlayerId: victim.id,
      toPlayerId: chopper.id,
      amount: 0,
      reason,
      message,
    };
  }

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
 * Xử lý phạt thối heo/hàng cuối ván
 */
export function handleThoiPenalties(
  players: PlayerState[],
  top1Player: PlayerState
): PointTransferEvent[] {
  const events: PointTransferEvent[] = [];

  for (const p of players) {
    if (p.id === top1Player.id) continue;
    if (p.hand.length === 0) continue;

    const shieldIdx = p.activeAugments.findIndex(
      (a) => a.augment.id === 'AUG_SHIELD' || a.augment.name.toLowerCase().includes('khiên')
    );
    if (shieldIdx !== -1) {
      p.activeAugments.splice(shieldIdx, 1);
      events.push({
        fromPlayerId: p.id,
        toPlayerId: top1Player.id,
        amount: 0,
        reason: 'THOI_HEO',
        message: `🛡️ Khiên Bong Bóng đã cứu ${p.name} khỏi bị phạt thối heo/hàng!`,
      });
      continue;
    }

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
        message: `${p.name} bị thối heo cuối ván! Bị trừ ${actualPenalty} điểm chuyển cho Quán quân ${top1Player.name}`,
      });
    }
  }

  return events;
}

/**
 * Quyết toán điểm round cơ bản
 */
export function finalizeRoundScores(players: PlayerState[]): {
  roundPoints: Record<string, number>;
  notes: Record<string, string[]>;
  checkmateWinner: PlayerState | null;
} {
  const roundPoints: Record<string, number> = {};
  const notes: Record<string, string[]> = {};
  let checkmateWinner: PlayerState | null = null;

  for (const p of players) {
    let base = 0;
    if (p.rankInRound === 1) base = 4;
    else if (p.rankInRound === 2) base = 2;
    else if (p.rankInRound === 3) base = 1;
    else base = 0;

    notes[p.id] = [];

    // Lưu lại trạng thái Checkmate trước khi cộng điểm round này:
    // Chỉ người chơi ĐÃ ĐỦ ĐIỀU KIỆN CHECKMATE TỪ TRƯỚC ROUND NÀY (isCheckmate === true hoặc totalPoints >= 16 từ trước)
    // mới có thể kích hoạt chiến thắng khi về nhất ở round này.
    const wasAlreadyCheckmateEligible = p.isCheckmate || p.totalPoints >= 16;

    // Áp dụng modifier từ Lõi nếu chưa chạm mốc 12 điểm
    if (p.totalPoints < 12) {
      const bonus = evaluateAugmentBonuses(p, base);
      base = bonus.finalPoints;
      notes[p.id] = bonus.bonusNotes;
    }

    p.totalPoints += base;
    roundPoints[p.id] = base;

    // Kiểm tra điều kiện Cân Bằng 12 điểm: Bị tước sạch toàn bộ Lõi
    if (p.totalPoints >= 12 && p.canPickAugment) {
      p.canPickAugment = false;
      p.activeAugments = [];
    }

    // Kiểm tra điều kiện Checkmate 16:
    // 1. Trận chỉ kết thúc khi người ĐÃ ĐỦ ĐIỀU KIỆN CHECKMATE TỪ TRƯỚC giành thêm 1 lần Top 1
    if (wasAlreadyCheckmateEligible && p.rankInRound === 1 && !checkmateWinner) {
      checkmateWinner = p;
    }

    // 2. Nếu điểm số sau round này >= 16: MỞ KHÓA TRẠNG THÁI CHECKMATE (cho các round tiếp theo)
    if (p.totalPoints >= 16) {
      p.isCheckmate = true;
    }

    // Trừ 1 round thời hạn của các Lõi còn lại
    p.activeAugments = p.activeAugments
      .map((a) => ({ ...a, roundsRemaining: a.roundsRemaining - 1 }))
      .filter((a) => a.roundsRemaining > 0);
  }

  return { roundPoints, notes, checkmateWinner };
}
