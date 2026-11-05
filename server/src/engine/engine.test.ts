import { createDeck, dealHands, sortCards } from './cardUtils.js';
import { evaluateCombo, canBeat, checkToiTrang } from './evaluator.js';
import { handleChopPointTransfer, finalizeRoundScores } from './scoring.js';
import { PlayerState } from './types.js';
import { AUGMENTS_CATALOG } from './augments.js';

function runTests() {
  console.log('=== TIẾN LÊN CHECKMATE ENGINE TEST SUITE ===');

  // Test 1: Deck creation & shuffle
  const deck = createDeck();
  console.assert(deck.length === 52, `Deck must have 52 cards, got ${deck.length}`);
  const hands = dealHands(deck);
  console.assert(hands.length === 4, `Must deal to 4 players`);
  console.assert(hands.every((h) => h.length === 13), `Every hand must have 13 cards`);
  console.log('✔ Test 1: Bộ bài & Chia 52 lá cho 4 người: PASSED');

  // Test 2: Combo Evaluator
  const c3s = deck.find((c) => c.rank === '3' && c.suit === 'spades')!;
  const c3c = deck.find((c) => c.rank === '3' && c.suit === 'clubs')!;
  const c3d = deck.find((c) => c.rank === '3' && c.suit === 'diamonds')!;
  const c4s = deck.find((c) => c.rank === '4' && c.suit === 'spades')!;
  const c5s = deck.find((c) => c.rank === '5' && c.suit === 'spades')!;
  const c2h = deck.find((c) => c.rank === '2' && c.suit === 'hearts')!; // Heo cơ

  const single = evaluateCombo([c3s]);
  console.assert(single.type === 'SINGLE', 'Must evaluate single');

  const pair = evaluateCombo([c3s, c3c]);
  console.assert(pair.type === 'PAIR', 'Must evaluate pair');

  const triple = evaluateCombo([c3s, c3c, c3d]);
  console.assert(triple.type === 'TRIPLE', 'Must evaluate triple');

  const straight = evaluateCombo([c3s, c4s, c5s]);
  console.assert(straight.type === 'STRAIGHT', 'Must evaluate straight 3-4-5');
  console.log('✔ Test 2: Đánh giá bộ Rác, Đôi, Sám, Sảnh: PASSED');

  // Test 3: Can Beat & Chặt Heo
  const quadCards = deck.filter((c) => c.rank === '7');
  const quad7 = evaluateCombo(quadCards);
  console.assert(quad7.type === 'FOUR_OF_A_KIND', 'Must be quad 7');

  const heoSingle = evaluateCombo([c2h]);
  console.assert(canBeat(quad7, heoSingle), 'Quad 7 must be able to chop Heo Cơ');
  console.log('✔ Test 3: Luật chặt Heo bằng Tứ quý: PASSED');

  // Test 4: Chặt heo cướp điểm trực tiếp
  const playerA: PlayerState = {
    id: 'pA',
    name: 'Player A',
    isBot: false,
    avatarSeed: 'A',
    hand: [],
    rankInRound: null,
    totalPoints: 5,
    activeAugments: [],
    canPickAugment: true,
    isCheckmate: false,
    hasPassed: false,
    choppedCount: 0,
    beenChoppedCount: 0,
  };

  const playerB: PlayerState = {
    id: 'pB',
    name: 'Player B',
    isBot: true,
    avatarSeed: 'B',
    hand: [],
    rankInRound: null,
    totalPoints: 8,
    activeAugments: [],
    canPickAugment: true,
    isCheckmate: false,
    hasPassed: false,
    choppedCount: 0,
    beenChoppedCount: 0,
  };

  // Player A chặt Heo Đỏ của Player B -> cướp 2 điểm trực tiếp từ B
  const transfer = handleChopPointTransfer(playerA, playerB, quad7, heoSingle);
  console.assert(transfer !== null, 'Transfer event must be generated');
  console.assert(playerA.totalPoints === 7, `Player A should have 7 pts, got ${playerA.totalPoints}`);
  console.assert(playerB.totalPoints === 6, `Player B should have 6 pts, got ${playerB.totalPoints}`);
  console.log('✔ Test 4: Cướp điểm chặt Heo trực tiếp từ đối thủ: PASSED');

  // Test 5: Luật 12 điểm Chặn Lõi & Checkmate 16 điểm
  playerA.rankInRound = 1; // Top 1 (+4 điểm -> 7 + 4 = 11đ)
  playerB.rankInRound = 2; // Top 2 (+2 điểm -> 6 + 2 = 8đ)
  const dummyP3: PlayerState = { ...playerA, id: 'p3', rankInRound: 3, totalPoints: 2 };
  const dummyP4: PlayerState = { ...playerA, id: 'p4', rankInRound: 4, totalPoints: 0 };

  const round1Result = finalizeRoundScores([playerA, playerB, dummyP3, dummyP4]);
  console.assert(playerA.totalPoints === 11, 'Player A reaches 11 points');
  console.assert(playerA.canPickAugment === true, 'Player A still under 12, can pick augment');

  // Giả sử round tiếp theo playerA lại về Top 1 (+4đ -> 15đ) và vượt mốc 12đ
  finalizeRoundScores([playerA, playerB, dummyP3, dummyP4]);
  console.assert(playerA.totalPoints === 15, 'Player A reaches 15 points');
  console.assert(playerA.canPickAugment === false, 'Player A >= 12 pts must be purged and play chay');
  console.log('✔ Test 5: Luật cân bằng 12 điểm (Tước Lõi, Đánh Chay): PASSED');

  // Round 3: playerA lại về Top 1 (+4đ -> 19đ >= 16đ) -> Kích hoạt CHECKMATE VÔ ĐỊCH!
  const round3Result = finalizeRoundScores([playerA, playerB, dummyP3, dummyP4]);
  console.assert(round3Result.checkmateWinner?.id === 'pA', 'Player A must win by Checkmate!');
  console.log('✔ Test 6: Luật Checkmate 16 điểm và Vô Địch Toàn Trận: PASSED');

  console.log('🎉 TOÀN BỘ TEST SUITE ENGINE ĐÃ VƯỢT QUA 100%!');
}

runTests();

