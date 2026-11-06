import { createDeck, dealHands, sortCards } from './cardUtils.js';
import { evaluateCombo, canBeat, checkToiTrang } from './evaluator.js';
import { handleChopPointTransfer, finalizeRoundScores } from './scoring.js';
import { PlayerState, Card } from './types.js';
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

  // Round 3: playerA lại về Top 1 (+4đ -> 19đ >= 16đ) -> Đủ điều kiện Checkmate nhưng CHƯA THẮNG NGAY!
  const round3Result = finalizeRoundScores([playerA, playerB, dummyP3, dummyP4]);
  console.assert(round3Result.checkmateWinner === null, 'Vừa đạt >= 16đ ở round này thì CHƯA THẮNG luôn');
  console.assert(playerA.isCheckmate === true, 'Player A phải được mở khóa trạng thái Checkmate Eligible');

  // Round 4: playerA về Top 2 (+2đ -> 21đ) -> Chưa thắng vì không về Top 1
  playerA.rankInRound = 2;
  const round4Result = finalizeRoundScores([playerA, playerB, dummyP3, dummyP4]);
  console.assert(round4Result.checkmateWinner === null, 'Đã đủ điều kiện Checkmate nhưng về Top 2 thì vẫn chưa thắng');

  // Round 5: playerA về Top 1 một lần nữa -> KÍCH HOẠT CHECKMATE VÔ ĐỊCH TOÀN TRẬN!
  playerA.rankInRound = 1;
  const round5Result = finalizeRoundScores([playerA, playerB, dummyP3, dummyP4]);
  console.assert(round5Result.checkmateWinner?.id === 'pA', 'Player A đã đủ điều kiện Checkmate và về Top 1 -> Thắng trận!');
  console.log('✔ Test 9: Luật Checkmate 16 điểm và Vô Địch Toàn Trận (Mở Checkmate -> Thêm 1 lần Top 1): PASSED');

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

  // Test 12: Đổi Lõi theo từng slot riêng biệt (rerollAugmentSlot)
  const roomReroll = new GameRoom('TEST-REROLL', null as any, () => {});
  roomReroll.initVsBots('user-A', 'Player A');
  // Chuyển sang phase AUGMENT_SELECT
  const initialChoiceSlot0 = roomReroll.state.augmentChoices['user-A']?.[0]?.id;
  const initialChoiceSlot1 = roomReroll.state.augmentChoices['user-A']?.[1]?.id;
  const rerollRes = roomReroll.rerollAugmentSlot('user-A', 0);
  console.assert(rerollRes.success === true, 'Đổi slot 0 lần đầu phải thành công');
  console.assert(roomReroll.state.augmentChoices['user-A'][1].id === initialChoiceSlot1, 'Slot 1 không được đổi');
  const rerollAgainRes = roomReroll.rerollAugmentSlot('user-A', 0);
  console.assert(rerollAgainRes.success === false, 'Đổi slot 0 lần thứ 2 phải bị từ chối');
  console.log('✔ Test 12: Đổi Lõi từng slot độc lập (mỗi slot 1 lần): PASSED');

  // Test 13: Bắt buộc mở màn Round 1 phải chứa lá 3 Bích
  const room3Bich = new GameRoom('TEST-3BICH', null as any, () => {});
  room3Bich.initVsBots('user-A', 'Player A');
  // Đảm bảo user-A có 3 Bích và bắt đầu chơi
  const spade3Card = { id: '3-spades', rank: '3', suit: 'spades', rankValue: 3, suitValue: 1 } as Card;
  const nonSpade3Card = { id: '4-spades', rank: '4', suit: 'spades', rankValue: 4, suitValue: 1 } as Card;
  const pA = room3Bich.state.players.find((p) => p.id === 'user-A')!;
  pA.hand = [spade3Card, nonSpade3Card];
  room3Bich.state.phase = 'PLAYING';
  room3Bich.state.currentTurnPlayerId = 'user-A';
  room3Bich.state.roundNumber = 1;
  room3Bich.state.lastValidMove = null;
  room3Bich.state.finishOrder = [];

  // Thử đánh 4 bích (không có 3 bích) -> Phải thất bại
  const illegalMove = room3Bich.playCards('user-A', ['4-spades']);
  console.assert(illegalMove.success === false, 'Nước đi mở màn round 1 không có 3 bích phải bị chặn');

  // Đánh 3 bích -> Thành công
  const legalMove = room3Bich.playCards('user-A', ['3-spades']);
  console.assert(legalMove.success === true, 'Nước đi mở màn round 1 có 3 bích phải thành công');

  // Vòng tiếp theo trong cùng Round 1: lastValidMove = null nhưng KHÔNG được chặn nữa
  room3Bich.state.lastValidMove = null;
  room3Bich.state.currentTurnPlayerId = 'user-A';
  const nextTrickMove = room3Bich.playCards('user-A', ['4-spades']);
  console.assert(nextTrickMove.success === true, 'Vòng mới sau nước mở màn không được đòi 3 bích nữa');
  console.log('✔ Test 13: Nước đi đầu tiên Round 1 bắt buộc có 3 Bích và các vòng sau không bị kẹt: PASSED');

  // Test 14 (B1): Chủ phòng rời giữa trận -> Chuyển host cho người thật kế tiếp
  const roomB1 = new GameRoom('TEST-B1', null as any, () => {});
  roomB1.initCustomRoom('h1', 'Chủ Phòng H1');
  roomB1.addPlayer('p2', 'Người Chơi P2');
  roomB1.addPlayer('p3', 'Người Chơi P3');
  roomB1.addPlayer('p4', 'Người Chơi P4');
  roomB1.state.phase = 'ROUND_END';

  // h1 rời phòng
  roomB1.handlePlayerLeave('h1');
  if (roomB1.isHost('h1')) {
    throw new Error('FAIL B1: h1 đã rời và thành Bot nhưng vẫn là host!');
  }
  if (!roomB1.isHost('p2')) {
    throw new Error('FAIL B1: p2 phải là host mới nhưng isHost(p2) lại là false!');
  }
  console.log('✔ Test 14: Chủ phòng rời trận -> Chuyển host cho người thật kế tiếp: PASSED');

  // Test 15 (B2): Cả 4 người chơi đều >= 12 điểm (đánh chay) -> Không kẹt ở AUGMENT_SELECT
  const roomB2 = new GameRoom('TEST-B2', null as any, () => {});
  roomB2.initCustomRoom('p1', 'Player 1');
  roomB2.addPlayer('p2', 'Player 2');
  roomB2.addPlayer('p3', 'Player 3');
  roomB2.addPlayer('p4', 'Player 4');
  for (const p of roomB2.state.players) {
    p.totalPoints = 13;
    p.canPickAugment = false;
  }
  roomB2.state.phase = 'ROUND_END';
  roomB2.startNewRound();

  if (roomB2.state.phase !== 'PLAYING') {
    throw new Error(`FAIL B2: Cả 4 người >= 12đ nhưng phase là ${roomB2.state.phase}, không tự chuyển sang PLAYING!`);
  }
  if (!roomB2.state.currentTurnPlayerId) {
    throw new Error('FAIL B2: Thiếu currentTurnPlayerId sau khi chuyển sang PLAYING!');
  }
  console.log('✔ Test 15: Cả 4 người >= 12 điểm tự động chuyển sang PLAYING: PASSED');

  // Test 16 (B3): Đã chọn Lõi rồi thì không được reroll để chọn thêm Lõi thứ 2
  const roomB3 = new GameRoom('TEST-B3', null as any, () => {});
  roomB3.initCustomRoom('h1', 'Player H1');
  roomB3.addPlayer('p2', 'Player P2');
  roomB3.addPlayer('p3', 'Player P3');
  roomB3.addPlayer('p4', 'Player P4');
  roomB3.startNewRound(); // Pha AUGMENT_SELECT

  const h1Choices = roomB3.state.augmentChoices['h1'];
  if (!h1Choices || h1Choices.length === 0) {
    throw new Error('FAIL B3: Thiếu choices của h1');
  }
  // h1 chọn Lõi lần đầu
  roomB3.selectAugment('h1', h1Choices[0].id);
  const p1 = roomB3.state.players.find((p) => p.id === 'h1')!;
  console.assert(p1.activeAugments.length === 1, 'h1 phải có 1 Lõi');

  // Thử reroll sau khi đã chọn Lõi
  const rerollResB3 = roomB3.rerollAugments('h1');
  if (rerollResB3.success) {
    // Nếu reroll thành công thì thử chọn thêm lần 2
    if (roomB3.state.augmentChoices['h1']?.length) {
      roomB3.selectAugment('h1', roomB3.state.augmentChoices['h1'][0].id);
    }
  }
  if (p1.activeAugments.length > 1) {
    throw new Error(`FAIL B3: Đã chọn Lõi rồi vẫn reroll chọn thêm được ${p1.activeAugments.length} Lõi!`);
  }
  console.log('✔ Test 16: Không được reroll chọn thêm Lõi sau khi đã chọn: PASSED');

  // Test 17 (B4): Vòng đánh không được kết thúc sớm khi người về đích thắng trick
  const roomB4 = new GameRoom('TEST-B4', null as any, () => {});
  roomB4.initCustomRoom('p0', 'Player 0');
  roomB4.addPlayer('p1', 'Player 1');
  roomB4.addPlayer('p2', 'Player 2');
  roomB4.addPlayer('p3', 'Player 3');
  roomB4.state.phase = 'PLAYING';
  roomB4.state.roundNumber = 2; // Không phải round 1 để không ép 3 bích
  roomB4.isFirstMoveOfRound1Completed = true;

  // Thiết lập bài cho 4 người:
  const card5s = { id: '5-spades', rank: '5', suit: 'spades', rankValue: 5, suitValue: 1, weight: 51 } as Card;
  const cardKs = { id: 'K-spades', rank: 'K', suit: 'spades', rankValue: 13, suitValue: 1, weight: 131 } as Card;
  const card7c = { id: '7-clubs', rank: '7', suit: 'clubs', rankValue: 7, suitValue: 2, weight: 72 } as Card;
  const cardAc = { id: 'A-clubs', rank: 'A', suit: 'clubs', rankValue: 14, suitValue: 2, weight: 142 } as Card;
  const cardDummy = { id: '4-hearts', rank: '4', suit: 'hearts', rankValue: 4, suitValue: 4, weight: 44 } as Card;

  const [pl0, pl1, pl2, pl3] = roomB4.state.players;
  pl0.hand = [card5s, cardKs];
  pl1.hand = [cardDummy];
  pl2.hand = [cardDummy];
  pl3.hand = [card7c, cardAc];

  // p0 mở vòng bằng 5 Bích
  roomB4.state.currentTurnPlayerId = 'p0';
  roomB4.playCards('p0', ['5-spades']);

  // p1 pass, p2 pass
  roomB4.passTurn('p1');
  roomB4.passTurn('p2');

  // p3 đánh 7 Chuồn
  roomB4.playCards('p3', ['7-clubs']);

  // p0 đánh K Bích và HẾT BÀI
  roomB4.playCards('p0', ['K-spades']);

  // Mong đợi: p0 đã hết bài nhưng p3 chưa pass, nên lastValidMove vẫn là K Bích và lượt thuộc p3
  if (!roomB4.state.lastValidMove) {
    throw new Error('FAIL B4: Vòng đánh bị kết thúc sớm khi p0 hết bài! lastValidMove bị null!');
  }
  if (roomB4.state.currentTurnPlayerId !== 'p3') {
    throw new Error(`FAIL B4: Lượt phải thuộc về p3 nhưng lại thuộc về ${roomB4.state.currentTurnPlayerId}!`);
  }

  // p3 pass -> Lúc này không còn ai chưa pass -> Vòng kết thúc và người kế tiếp sau p0 (là p1) cầm vòng mới
  roomB4.passTurn('p3');
  if (roomB4.state.lastValidMove !== null) {
    throw new Error('FAIL B4: Sau khi p3 pass, lastValidMove phải là null cho vòng mới!');
  }
  if (roomB4.state.currentTurnPlayerId !== 'p1') {
    throw new Error(`FAIL B4: Người kế tiếp sau p0 (là p1) phải cầm vòng mới, nhưng lại là ${roomB4.state.currentTurnPlayerId}!`);
  }
  console.log('✔ Test 17: Vòng đánh không kết thúc sớm khi người về đích thắng trick: PASSED');

  console.log('🎉 TOÀN BỘ BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100%!');
}

runTests();
