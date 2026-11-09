import { Augment, PlayerState } from './types.js';

export const AUGMENTS_CATALOG: Augment[] = [
  {
    id: 'AUG_TOP1_BOOST',
    name: 'Overclock Top 1',
    description: 'Cược Top 1: Nếu về Top 1 nhận thêm +2đ (tổng 6đ). Nếu trượt Top 1: nhận 0đ round này (mất cả điểm Top 2/3). (1 round)',
    durationRounds: 1,
    icon: 'Zap',
    rarity: 'RARE',
  },
  {
    id: 'AUG_SEC_SAFE',
    name: 'Pursuit Protocol',
    description: 'Mỗi khi về Top 2: nhận thêm +1 điểm (tổng +3 điểm). Hiệu lực trong 2 round.',
    durationRounds: 2,
    icon: 'Crosshair',
    rarity: 'COMMON',
  },
  {
    id: 'AUG_UNDERDOG',
    name: 'Emergency Shield',
    description: 'Nếu về Top 4 (bét) ở round này: nhận +1 điểm an ủi. Tự hủy sau 1 round.',
    durationRounds: 1,
    icon: 'ShieldAlert',
    rarity: 'COMMON',
  },
  {
    id: 'AUG_HUNTER',
    name: 'Bounty Hunter',
    description: 'Mỗi lần chặt heo thành công: cướp thêm +1 điểm từ người bị chặt. Hiệu lực trong 2 round.',
    durationRounds: 2,
    icon: 'Skull',
    rarity: 'EPIC',
  },
  {
    id: 'AUG_GAMBIT',
    name: 'Hyper Roulette',
    description: 'Tất Tay: Nếu về Top 1 nhận +4đ (tổng 8đ)! Nếu trượt Top 1: nhận 0đ round này VÀ mất -2đ cống nạp cho người về Top 1! (1 round)',
    durationRounds: 1,
    icon: 'Flame',
    rarity: 'EPIC',
  },
  {
    id: 'AUG_SURVIVOR',
    name: 'Stealth Matrix',
    description: 'Nếu về Top 2 hoặc Top 3: nhận thêm +1 điểm thưởng sinh tồn. Hiệu lực trong 2 round.',
    durationRounds: 2,
    icon: 'EyeOff',
    rarity: 'COMMON',
  },
  {
    id: 'AUG_PACIFIST',
    name: 'Zero Threat',
    description: 'Nếu trong ván không chặt heo nào và không bị ai chặt: thưởng +1 điểm cuối ván. (1 round)',
    durationRounds: 1,
    icon: 'Sparkles',
    rarity: 'RARE',
  },
  {
    id: 'AUG_CLUTCH',
    name: 'Last Stand (Lật Kèo)',
    description: 'Nếu điểm tổng đang <= 4 điểm mà về Top 1 hoặc Top 2: nhận thêm +3 điểm thưởng! (1 round)',
    durationRounds: 1,
    icon: 'Rocket',
    rarity: 'EPIC',
  },
  {
    id: 'AUG_DOUBLE_TROUBLE',
    name: 'Twin Turbo',
    description: 'Nếu về Top 1: nhận thêm +1đ (tổng 5đ). Nhưng nếu về Top 4 (bét): bị phạt trừ -1đ điểm tổng. Hiệu lực trong 2 round.',
    durationRounds: 2,
    icon: 'Activity',
    rarity: 'RARE',
  },
  {
    id: 'AUG_COMEBACK',
    name: 'Phoenix Core',
    description: 'Nếu về Top 3 hoặc Top 4 ở round này: nhận +1 điểm an ủi để tích lũy. Tự hủy sau 1 round.',
    durationRounds: 1,
    icon: 'HeartHandshake',
    rarity: 'COMMON',
  },
  {
    id: 'AUG_HIGH_ROLLER',
    name: 'Neon Jackpot',
    description: 'Đại Thưởng: Nếu về Top 1 nhận thêm +3đ (tổng 7đ). Nếu trượt Top 1: nhận 0đ round này VÀ bị trừ -2đ điểm tổng! (1 round)',
    durationRounds: 1,
    icon: 'Crown',
    rarity: 'EPIC',
  },
  {
    id: 'AUG_CHOP_DEFENSE',
    name: 'Nano Barrier',
    description: 'Chặn hoàn toàn 1 lần mất điểm do bị chặt heo hoặc thối heo. (2 round)',
    durationRounds: 2,
    icon: 'ShieldCheck',
    rarity: 'RARE',
  },
];

/**
 * Lấy ngẫu nhiên các lõi không trùng nhau cho người chơi lựa chọn (có thể loại trừ các lõi cũ khi roll)
 */
export function getRandomAugments(count: number = 3, excludeIds: string[] = []): Augment[] {
  let pool = AUGMENTS_CATALOG.filter((a) => !excludeIds.includes(a.id));
  if (pool.length < count) {
    pool = [...AUGMENTS_CATALOG];
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export interface AugmentEvaluationResult {
  finalPoints: number;
  bonusNotes: string[];
  totalPointPenalty?: number; // Trừ thẳng vào totalPoints
  transferredToTop1?: number; // Điểm cúng nộp cho người về Top 1
}

/**
 * Tính điểm thưởng/phạt từ các Lõi sau khi kết thúc một round
 */
export function evaluateAugmentBonuses(player: PlayerState, baseRankPoints: number): AugmentEvaluationResult {
  // Người >= 12 điểm thì không có lõi và đánh chay
  if (player.totalPoints >= 12 || player.activeAugments.length === 0) {
    return { finalPoints: baseRankPoints, bonusNotes: [] };
  }

  let finalPoints = baseRankPoints;
  let totalPointPenalty = 0;
  let transferredToTop1 = 0;
  const bonusNotes: string[] = [];

  for (const active of player.activeAugments) {
    const aug = active.augment;

    // 1. Overclock Top 1 (Phạt trắng round nếu trượt Top 1)
    if (aug.id === 'AUG_TOP1_BOOST') {
      if (player.rankInRound === 1) {
        finalPoints += 2;
        bonusNotes.push('Overclock Top 1 (+2đ, tổng 6đ)');
      } else {
        finalPoints = 0;
        bonusNotes.push('Overclock Thất Bại (0đ round này)');
      }
    }

    // 2. Pursuit Protocol
    if (aug.id === 'AUG_SEC_SAFE' && player.rankInRound === 2) {
      finalPoints += 1;
      bonusNotes.push('Pursuit Protocol (+1đ)');
    }

    // 3. Emergency Shield
    if (aug.id === 'AUG_UNDERDOG' && player.rankInRound === 4) {
      finalPoints += 1;
      bonusNotes.push('Emergency Shield (+1đ an ủi)');
    }

    // 4. Hyper Roulette (Tất Tay: Thắng 8đ, Thua mất 0đ round + trừ 2đ cống nạp cho Top 1)
    if (aug.id === 'AUG_GAMBIT') {
      if (player.rankInRound === 1) {
        finalPoints += 4;
        bonusNotes.push('Hyper Roulette Thắng Cược (+8đ)');
      } else {
        finalPoints = 0;
        transferredToTop1 += 2;
        bonusNotes.push('Hyper Roulette Thua Cược (0đ round, -2đ cống nạp cho Top 1)');
      }
    }

    // 5. Stealth Matrix
    if (aug.id === 'AUG_SURVIVOR' && (player.rankInRound === 2 || player.rankInRound === 3)) {
      finalPoints += 1;
      bonusNotes.push('Stealth Matrix (+1đ)');
    }

    // 6. Zero Threat
    if (aug.id === 'AUG_PACIFIST' && player.choppedCount === 0 && player.beenChoppedCount === 0) {
      finalPoints += 1;
      bonusNotes.push('Zero Threat (+1đ hòa bình)');
    }

    // 7. Last Stand (Lật Kèo)
    if (aug.id === 'AUG_CLUTCH' && (player.rankInRound === 1 || player.rankInRound === 2) && player.totalPoints <= 4) {
      finalPoints += 3;
      bonusNotes.push('Last Stand Lật Kèo (+3đ)');
    }

    // 8. Twin Turbo (Top 1 được +1đ, nhưng về bét bị phạt trừ 1đ tổng)
    if (aug.id === 'AUG_DOUBLE_TROUBLE') {
      if (player.rankInRound === 1) {
        finalPoints += 1;
        bonusNotes.push('Twin Turbo (+1đ)');
      } else if (player.rankInRound === 4) {
        totalPointPenalty += 1;
        bonusNotes.push('Twin Turbo Về Bét (-1đ điểm tổng)');
      }
    }

    // 9. Phoenix Core (An ủi +1đ khi về Top 3 hoặc 4)
    if (aug.id === 'AUG_COMEBACK' && (player.rankInRound === 3 || player.rankInRound === 4)) {
      finalPoints += 1;
      bonusNotes.push('Phoenix Core Tái Sinh (+1đ an ủi)');
    }

    // 10. Neon Jackpot (Thắng 7đ, Thua nhận 0đ round và bị trừ 2đ tổng điểm)
    if (aug.id === 'AUG_HIGH_ROLLER') {
      if (player.rankInRound === 1) {
        finalPoints += 3;
        bonusNotes.push('Neon Jackpot (+3đ, tổng 7đ)');
      } else {
        finalPoints = 0;
        totalPointPenalty += 2;
        bonusNotes.push('Neon Jackpot Thất Bại (0đ round, -2đ điểm tổng)');
      }
    }
  }

  return { finalPoints, bonusNotes, totalPointPenalty, transferredToTop1 };
}
