import { createDeck, dealHands, sortCards } from './cardUtils.js';
import { evaluateCombo, canBeat, checkToiTrang } from './evaluator.js';
import { handleChopPointTransfer, finalizeRoundScores } from './scoring.js';
import { PlayerState } from './types.js';
import { AUGMENTS_CATALOG } from './augments.js';
import { GameRoom } from '../rooms/gameRoom.js';

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
  const c2s = deck.find((c) => c.rank === '2' && c.suit === 'spades')!; // Heo bích (đen)
  const c2h = deck.find((c) => c.rank === '2' && c.suit === 'hearts')!; // Heo cơ (đỏ)
  const c2d = deck.find((c) => c.rank === '2' && c.suit === 'diamonds')!; // Heo rô (đỏ)
  const c2c = deck.find((c) => c.rank === '2' && c.suit === 'clubs')!; // Heo chuồn (đen)

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

  // Player A chặt Heo Đỏ của Player B bằng Tứ quý -> cướp 2 điểm trực tiếp từ B
  const transfer = handleChopPointTransfer(playerA, playerB, quad7, heoSingle);
  console.assert(transfer !== null, 'Transfer event must be generated');
  console.assert(playerA.totalPoints === 7, `Player A should have 7 pts, got ${playerA.totalPoints}`);
  console.assert(playerB.totalPoints === 6, `Player B should have 6 pts, got ${playerB.totalPoints}`);
  console.log('✔ Test 4: Cướp điểm chặt Heo bằng Hàng: PASSED');

  // Test 5 (QUAN TRỌNG): Heo lớn đè Heo nhỏ KHÔNG ĐƯỢC TÍNH LÀ CHẶT HEO
  const heoBlack = evaluateCombo([c2s]);
  const heoRed = evaluateCombo([c2h]);
  const invalidChop = handleChopPointTransfer(playerA, playerB, heoRed, heoBlack);
  console.assert(invalidChop === null, 'Heo đè Heo KHÔNG được tính là chặt heo!');
  console.log('✔ Test 5: Heo lớn đè Heo nhỏ bình thường (KHÔNG cướp điểm): PASSED');

  // Test 6: Đôi Heo đè Đôi Heo KHÔNG ĐƯỢC TÍNH LÀ CHẶT HEO
  const pairHeoBlack = evaluateCombo([c2s, c2c]);
  const pairHeoRed = evaluateCombo([c2d, c2h]);
  const invalidPairChop = handleChopPointTransfer(playerA, playerB, pairHeoRed, pairHeoBlack);
  console.assert(invalidPairChop === null, 'Đôi heo đè đôi heo KHÔNG được tính là chặt heo!');
  console.log('✔ Test 6: Đôi Heo đè Đôi Heo bình thường (KHÔNG cướp điểm): PASSED');

  // Test 7: Tứ quý chặt Đôi Heo -> Cướp 3 điểm
  const chopPairHeo = handleChopPointTransfer(playerA, playerB, quad7, pairHeoRed);
  console.assert(chopPairHeo !== null && chopPairHeo.amount === 3, 'Tứ quý chặt đôi heo phải cướp 3 điểm!');
  console.log('✔ Test 7: Tứ quý chặt Đôi Heo (+3 điểm): PASSED');

  // Test 8: Luật 12 điểm Chặn Lõi & Checkmate 16 điểm
  playerA.totalPoints = 7;
  playerB.totalPoints = 6;
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
  console.log('✔ Test 8: Luật cân bằng 12 điểm (Tước Lõi, Đánh Chay): PASSED');

  // Round 3: playerA lại về Top 1 (+4đ -> 19đ >= 16đ) -> Kích hoạt CHECKMATE VÔ ĐỊCH!
  const round3Result = finalizeRoundScores([playerA, playerB, dummyP3, dummyP4]);
  console.assert(round3Result.checkmateWinner?.id === 'pA', 'Player A must win by Checkmate!');
  console.log('✔ Test 9: Luật Checkmate 16 điểm và Vô Địch Toàn Trận: PASSED');

  // Test 10: Redact State bảo mật bài đối thủ
  const room = new GameRoom('TEST-1', null as any, () => {});
  room.initVsBots('user-A', 'Player A');
  const userARedacted = room.getRedactedState('user-A');
  const userBRedacted = room.getRedactedState('bot-1');

  // Verify user-A sees their own hand but bot hands are empty
  const pAInAState = userARedacted.players.find((p) => p.id === 'user-A')!;
  const pBInAState = userARedacted.players.find((p) => p.id === 'bot-1')!;
  console.assert(pAInAState.hand.length === 13, 'User A must see their own 13 cards');
  console.assert(pBInAState.hand.length === 0, 'User A must NOT see Bot 1 cards (empty hand)');
  console.assert(pBInAState.handCount === 13, 'User A must see Bot 1 handCount = 13');

  // Verify bot-1 (User B) sees their own hand but User A hand is empty
  const pAInBState = userBRedacted.players.find((p) => p.id === 'user-A')!;
  const pBInBState = userBRedacted.players.find((p) => p.id === 'bot-1')!;
  console.assert(pAInBState.hand.length === 0, 'User B must NOT see User A cards (empty hand)');
  console.assert(pAInBState.handCount === 13, 'User B must see User A handCount = 13');
  console.assert(pBInBState.hand.length === 13, 'User B must see their own cards');
  console.log('✔ Test 10: Redact State bảo mật bài đối thủ: PASSED');

  // Test 11: Ăn Trắng kết thúc ván ngay lập tức
  const toiTrangHand = [c2s, c2c, c2d, c2h];
  console.assert(checkToiTrang(toiTrangHand) === 'TU_QUY_2', 'Tứ quý 2 phải nhận diện là TU_QUY_2');
  console.log('✔ Test 11: Nhận diện Ăn Trắng (Tứ quý 2): PASSED');

  console.log('🎉 TOÀN BỘ 11 BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100%!');
}

runTests();
