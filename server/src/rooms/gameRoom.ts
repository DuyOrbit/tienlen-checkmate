import { PrismaClient } from '@prisma/client';
import { Card, Combo, MatchState, PlayerState, TrickMove, Augment } from '../engine/types.js';
import { createDeck, shuffleDeck, dealHands, sortCards } from '../engine/cardUtils.js';
import { evaluateCombo, canBeat, checkToiTrang } from '../engine/evaluator.js';
import { getRandomAugments } from '../engine/augments.js';
import { handleChopPointTransfer, handleThoiPenalties, finalizeRoundScores } from '../engine/scoring.js';
import { BotAI } from '../bot/botAI.js';

export class GameRoom {
  public state: MatchState;
  public hostId: string = '';
  public rerollCounts: Record<string, number> = {};
  public rerolledSlots: Record<string, boolean[]> = {};
  public isFirstMoveOfRound1Completed: boolean = false;
  public onRoomEmpty?: (roomCode: string) => void;
  private prisma: PrismaClient;
  private onStateChange: (state: MatchState) => void;
  private botTimeout: NodeJS.Timeout | null = null;
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(roomCode: string, prisma: PrismaClient, onStateChange: (state: MatchState) => void) {
    this.prisma = prisma;
    this.onStateChange = onStateChange;
    this.state = {
      matchId: `match-${Date.now()}`,
      roomCode,
      roundNumber: 0,
      phase: 'WAITING',
      players: [],
      currentTurnPlayerId: null,
      lastValidMove: null,
      roundLeaderPlayerId: null,
      finishOrder: [],
      log: ['Phòng chơi đã được khởi tạo!'],
      pointEvents: [],
      augmentChoices: {},
      winnerId: null,
    };
  }

  // Khởi tạo phòng chơi với 3 Bot
  public initVsBots(humanPlayerId: string, humanName: string) {
    this.hostId = humanPlayerId;
    const bots: PlayerState[] = [
      {
        id: humanPlayerId,
        name: humanName,
        isBot: false,
        avatarSeed: humanName,
        hand: [],
        rankInRound: null,
        totalPoints: 0,
        activeAugments: [],
        canPickAugment: true,
        isCheckmate: false,
        hasPassed: false,
        choppedCount: 0,
        beenChoppedCount: 0,
      },
      {
        id: 'bot-1',
        name: 'Bắp Rang',
        isBot: true,
        avatarSeed: 'bear',
        hand: [],
        rankInRound: null,
        totalPoints: 0,
        activeAugments: [],
        canPickAugment: true,
        isCheckmate: false,
        hasPassed: false,
        choppedCount: 0,
        beenChoppedCount: 0,
      },
      {
        id: 'bot-2',
        name: 'Cáo Nhỏ',
        isBot: true,
        avatarSeed: 'fox',
        hand: [],
        rankInRound: null,
        totalPoints: 0,
        activeAugments: [],
        canPickAugment: true,
        isCheckmate: false,
        hasPassed: false,
        choppedCount: 0,
        beenChoppedCount: 0,
      },
      {
        id: 'bot-3',
        name: 'Thỏ Chill',
        isBot: true,
        avatarSeed: 'rabbit',
        hand: [],
        rankInRound: null,
        totalPoints: 0,
        activeAugments: [],
        canPickAugment: true,
        isCheckmate: false,
        hasPassed: false,
        choppedCount: 0,
        beenChoppedCount: 0,
      },
    ];

    this.state.players = bots;
    this.startNewRound();
  }

  // Khởi tạo phòng chờ tùy chọn nhiều người (Sảnh chờ Bạn Bè)
  public initCustomRoom(hostId: string, hostName: string): void {
    this.hostId = hostId;
    this.state.phase = 'WAITING';
    this.state.players = [
      {
        id: hostId,
        name: hostName,
        isBot: false,
        avatarSeed: hostName,
        hand: [],
        rankInRound: null,
        totalPoints: 0,
        activeAugments: [],
        canPickAugment: true,
        isCheckmate: false,
        hasPassed: false,
        choppedCount: 0,
        beenChoppedCount: 0,
      },
    ];
    this.state.log.push(`👑 ${hostName} đã tạo phòng chờ [${this.state.roomCode}]!`);
    this.broadcast();
  }

  // Thêm người chơi vào phòng chờ
  public addPlayer(playerId: string, playerName: string): { success: boolean; message: string } {
    if (this.state.players.length >= 4) {
      return { success: false, message: 'Phòng đã đủ 4 người chơi!' };
    }
    if (this.state.phase !== 'WAITING') {
      return { success: false, message: 'Trận đấu đang diễn ra, không thể tham gia!' };
    }
    if (this.state.players.some((p) => p.id === playerId)) {
      return { success: true, message: 'Đã ở trong phòng' };
    }
    this.state.players.push({
      id: playerId,
      name: playerName,
      isBot: false,
      avatarSeed: playerName,
      hand: [],
      rankInRound: null,
      totalPoints: 0,
      activeAugments: [],
      canPickAugment: true,
      isCheckmate: false,
      hasPassed: false,
      choppedCount: 0,
      beenChoppedCount: 0,
    });
    this.state.log.push(`🎮 ${playerName} đã tham gia phòng!`);
    this.broadcast();
    return { success: true, message: 'Tham gia thành công!' };
  }

  // Thêm bot vào phòng chờ
  public addBot(): { success: boolean; message: string } {
    if (this.state.players.length >= 4) {
      return { success: false, message: 'Phòng đã đủ 4 người!' };
    }
    const defaultBots = [
      { name: 'Bắp Rang', seed: 'bear' },
      { name: 'Cáo Nhỏ', seed: 'fox' },
      { name: 'Thỏ Chill', seed: 'rabbit' },
      { name: 'Gấu Nâu', seed: 'bear' },
    ];
    const existing = this.state.players.map((p) => p.name);
    const bot = defaultBots.find((b) => !existing.includes(b.name)) || {
      name: `Bot ${this.state.players.length}`,
      seed: 'robot',
    };
    this.state.players.push({
      id: `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: bot.name,
      isBot: true,
      avatarSeed: bot.seed,
      hand: [],
      rankInRound: null,
      totalPoints: 0,
      activeAugments: [],
      canPickAugment: true,
      isCheckmate: false,
      hasPassed: false,
      choppedCount: 0,
      beenChoppedCount: 0,
    });
    this.state.log.push(`🤖 Đã thêm ${bot.name} vào phòng!`);
    this.broadcast();
    return { success: true, message: 'Đã thêm Bot thành công!' };
  }

  // Bắt đầu trận đấu từ phòng chờ (tự động lấp đầy Bot nếu thiếu)
  public startCustomMatch(): { success: boolean; message: string } {
    if (this.state.phase !== 'WAITING') {
      return { success: false, message: 'Trận đấu đang diễn ra!' };
    }
    while (this.state.players.length < 4) {
      this.addBot();
    }
    this.startNewRound();
    return { success: true, message: 'Bắt đầu ván đấu!' };
  }

  public startNewRound() {
    this.state.roundNumber++;
    this.state.phase = 'DEALING';
    this.state.lastValidMove = null;
    this.state.finishOrder = [];
    this.state.pointEvents = [];
    this.state.augmentChoices = {};
    this.isFirstMoveOfRound1Completed = false;

    // Reset round-specific player properties
    for (const p of this.state.players) {
      p.rankInRound = null;
      p.hasPassed = false;
      p.choppedCount = 0;
      p.beenChoppedCount = 0;
    }

    // Chia bài
    const deck = shuffleDeck(createDeck());
    const hands = dealHands(deck);
    for (let i = 0; i < 4; i++) {
      this.state.players[i].hand = hands[i];
    }

    this.state.log.push(`--- BẮT ĐẦU ROUND ${this.state.roundNumber} ---`);

    // 1. Kiểm tra Ăn Trắng
    let toiTrangPlayer: PlayerState | null = null;
    for (const p of this.state.players) {
      const toiTrang = checkToiTrang(p.hand);
      if (toiTrang) {
        toiTrangPlayer = p;
        this.state.log.push(`🎉 ${p.name} ĂN TRẮNG (${toiTrang})! Tự động giành TOP 1 (+4 điểm)!`);
        p.rankInRound = 1;
        this.state.finishOrder.push(p.id);
        break;
      }
    }

    if (toiTrangPlayer) {
      // Khi có người Ăn Trắng, round kết thúc ngay lập tức, những người còn lại xếp Top 4
      for (const other of this.state.players) {
        if (other.id !== toiTrangPlayer.id) {
          other.rankInRound = 4;
          this.state.finishOrder.push(other.id);
        }
      }
      this.endRound();
      return;
    }

    // 2. Chuyển sang giai đoạn Chọn Lõi (Augment Selection)
    this.state.phase = 'AUGMENT_SELECT';
    this.rerollCounts = {};
    this.rerolledSlots = {};
    for (const p of this.state.players) {
      if (p.canPickAugment) {
        this.rerollCounts[p.id] = 1;
        this.rerolledSlots[p.id] = [false, false, false];
        this.state.augmentChoices[p.id] = getRandomAugments(3);
      } else {
        this.state.log.push(`⚡ ${p.name} đã chạm mốc 12 điểm -> Đánh chay, không được chọn Lõi!`);
      }
    }

    // Tự động chọn Lõi cho Bots
    for (const p of this.state.players) {
      if (p.isBot && p.canPickAugment && this.state.augmentChoices[p.id]) {
        const picked = BotAI.pickAugment(this.state.augmentChoices[p.id], p.hand, p.totalPoints);
        this.selectAugment(p.id, picked.id);
      }
    }

    // Nếu không còn ai cần chọn Lõi (ví dụ cả 4 người đều >= 12đ hoặc bot đã chọn hết):
    // Tự động chuyển ngay sang phase PLAYING
    if (this.state.phase === 'AUGMENT_SELECT') {
      const remainingToPick = this.state.players.filter((p) => p.canPickAugment && this.state.augmentChoices[p.id]);
      if (remainingToPick.length === 0) {
        this.beginPlayingPhase();
        return;
      }
    }

    this.broadcast();
  }

  public selectAugment(playerId: string, augmentId: string) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || !player.canPickAugment) return;

    const choices = this.state.augmentChoices[playerId];
    if (!choices) return;

    const augment = choices.find((a) => a.id === augmentId);
    if (!augment) return;

    player.activeAugments.push({
      augment,
      roundsRemaining: augment.durationRounds,
    });
    this.state.log.push(`${player.name} đã trang bị Lõi: [${augment.name}]`);
    delete this.state.augmentChoices[playerId];

    // Kiểm tra xem tất cả người chơi đủ điều kiện đã chọn xong chưa
    const remainingToPick = this.state.players.filter((p) => p.canPickAugment && this.state.augmentChoices[p.id]);
    if (remainingToPick.length === 0) {
      this.beginPlayingPhase();
    } else {
      this.broadcast();
    }
  }

  public rerollAugments(playerId: string): { success: boolean; message: string; choices?: Augment[] } {
    if (this.state.phase !== 'AUGMENT_SELECT') {
      return { success: false, message: 'Chưa phải lúc đổi Lõi!' };
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || !player.canPickAugment) {
      return { success: false, message: 'Bạn không thể đổi Lõi!' };
    }
    const currentChoices = this.state.augmentChoices[playerId];
    if (!currentChoices || currentChoices.length === 0) {
      return { success: false, message: 'Bạn đã chọn Lõi rồi hoặc không có danh sách Lõi để đổi!' };
    }
    const remaining = this.rerollCounts[playerId] ?? 0;
    if (remaining <= 0) {
      return { success: false, message: 'Bạn đã hết lượt đổi Lõi ở round này!' };
    }

    const excludeIds = currentChoices.map((a) => a.id);
    const newChoices = getRandomAugments(3, excludeIds);

    this.rerollCounts[playerId] = remaining - 1;
    this.state.augmentChoices[playerId] = newChoices;
    this.state.log.push(`🎲 ${player.name} đã dùng 1 lượt đổi Lõi!`);
    this.broadcast();

    return { success: true, message: 'Đổi Lõi thành công!', choices: newChoices };
  }

  public rerollAugmentSlot(
    playerId: string,
    slotIndex: number
  ): { success: boolean; message: string; newAugment?: Augment } {
    if (this.state.phase !== 'AUGMENT_SELECT') {
      return { success: false, message: 'Chưa phải lúc đổi Lõi!' };
    }
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || !player.canPickAugment) {
      return { success: false, message: 'Bạn không thể đổi Lõi!' };
    }
    const currentChoices = this.state.augmentChoices[playerId];
    if (!currentChoices || currentChoices.length === 0) {
      return { success: false, message: 'Bạn đã chọn Lõi rồi hoặc không có danh sách Lõi để đổi!' };
    }
    if (slotIndex < 0 || slotIndex >= currentChoices.length) {
      return { success: false, message: 'Vị trí Lõi không hợp lệ (0-2)!' };
    }

    if (!this.rerolledSlots[playerId]) {
      this.rerolledSlots[playerId] = [false, false, false];
    }
    if (this.rerolledSlots[playerId][slotIndex]) {
      return { success: false, message: 'Lõi ở vị trí này đã được đổi 1 lần rồi!' };
    }

    const excludeIds = currentChoices.map((a) => a.id);
    const newAugments = getRandomAugments(1, excludeIds);
    if (newAugments.length === 0) {
      return { success: false, message: 'Không còn Lõi mới trong kho!' };
    }

    const newAugment = newAugments[0];
    currentChoices[slotIndex] = newAugment;
    this.rerolledSlots[playerId][slotIndex] = true;
    this.state.log.push(`🎲 ${player.name} đã đổi riêng Lõi số ${slotIndex + 1}!`);
    this.broadcast();

    return { success: true, message: 'Đổi Lõi thành công!', newAugment };
  }

  private beginPlayingPhase() {
    this.state.phase = 'PLAYING';

    // Xác định người đi trước:
    // Round 1: Người có 3 Bích (3-spades). Các round sau: Người về nhất round trước (hoặc người chưa qua lượt)
    if (this.state.roundNumber === 1 || !this.state.roundLeaderPlayerId) {
      let leaderId = this.state.players[0].id;
      for (const p of this.state.players) {
        if (p.hand.some((c) => c.rank === '3' && c.suit === 'spades')) {
          leaderId = p.id;
          break;
        }
      }
      this.state.currentTurnPlayerId = leaderId;
      this.state.roundLeaderPlayerId = leaderId;
    } else {
      this.state.currentTurnPlayerId = this.state.roundLeaderPlayerId;
    }

    const currentP = this.state.players.find((p) => p.id === this.state.currentTurnPlayerId);
    this.state.log.push(`Lượt đi đầu tiên thuộc về: ${currentP?.name}`);

    this.broadcast();
    this.triggerBotTurnIfNeeded();
  }

  public playCards(playerId: string, cardIds: string[]): { success: boolean; message: string } {
    if (this.state.phase !== 'PLAYING') return { success: false, message: 'Chưa phải lúc đánh bài' };
    if (this.state.currentTurnPlayerId !== playerId) return { success: false, message: 'Chưa tới lượt bạn' };

    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return { success: false, message: 'Không tìm thấy người chơi' };

    const selectedCards = player.hand.filter((c) => cardIds.includes(c.id));
    if (selectedCards.length !== cardIds.length) {
      return { success: false, message: 'Quân bài không hợp lệ' };
    }

    const incomingCombo = evaluateCombo(selectedCards);
    if (incomingCombo.type === 'INVALID') {
      return { success: false, message: 'Bộ bài không hợp lệ theo luật Tiến Lên Miền Nam' };
    }

    // Kiểm tra luật mở màn Round 1: Nước đi đầu tiên bắt buộc phải chứa lá 3 Bích (3-spades)
    const isFirstMoveOfRound1 =
      this.state.roundNumber === 1 && !this.isFirstMoveOfRound1Completed;
    if (isFirstMoveOfRound1 && !cardIds.includes('3-spades')) {
      return { success: false, message: 'Nước đi đầu tiên của ván 1 bắt buộc phải chứa lá 3 Bích (3♠)!' };
    }

    // Nếu có nước đi trước đó trên bàn trong vòng này
    if (this.state.lastValidMove) {
      const currentCombo = this.state.lastValidMove.combo;
      if (!canBeat(incomingCombo, currentCombo)) {
        return { success: false, message: 'Bộ bài không đủ lớn để đè nước đi trước' };
      }

      // Xử lý CƯỚP ĐIỂM CHẶT HEO / CHẶT HÀNG
      const victim = this.state.players.find((p) => p.id === this.state.lastValidMove!.playerId);
      if (victim) {
        const transfer = handleChopPointTransfer(player, victim, incomingCombo, currentCombo);
        if (transfer) {
          this.state.pointEvents.push(transfer);
          this.state.log.push(`💥 ${transfer.message}`);
        }
      }
    }

    // Đánh bài thành công: Rút khỏi tay người chơi
    player.hand = player.hand.filter((c) => !cardIds.includes(c.id));
    this.isFirstMoveOfRound1Completed = true;
    this.state.lastValidMove = {
      playerId: player.id,
      playerName: player.name,
      cards: selectedCards,
      combo: incomingCombo,
      timestamp: Date.now(),
    };
    this.state.log.push(`${player.name} đánh: ${selectedCards.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`).join(' ')}`);

    // Kiểm tra hết bài (Về đích)
    if (player.hand.length === 0) {
      const rank = this.state.finishOrder.length + 1;
      player.rankInRound = rank;
      this.state.finishOrder.push(player.id);
      this.state.log.push(`🏆 ${player.name} ĐÃ VỀ ĐÍCH HẠNG ${rank}!`);

      // Nếu đã có 3 người về đích -> Người còn lại tự động là hạng 4
      if (this.state.finishOrder.length === 3) {
        const lastPlayer = this.state.players.find((p) => !this.state.finishOrder.includes(p.id));
        if (lastPlayer) {
          lastPlayer.rankInRound = 4;
          this.state.finishOrder.push(lastPlayer.id);
          this.state.log.push(`💀 ${lastPlayer.name} về chót (Top 4)!`);
        }
        this.endRound();
        return { success: true, message: 'Đánh thành công, kết thúc round' };
      }
    }

    this.advanceTurn();
    return { success: true, message: 'Đánh bài thành công' };
  }

  public passTurn(playerId: string): { success: boolean; message: string } {
    if (this.state.phase !== 'PLAYING') return { success: false, message: 'Chưa phải lúc đánh bài' };
    if (this.state.currentTurnPlayerId !== playerId) return { success: false, message: 'Chưa tới lượt bạn' };
    if (!this.state.lastValidMove) return { success: false, message: 'Bạn đang cầm vòng, không được bỏ lượt!' };

    const player = this.state.players.find((p) => p.id === playerId);
    if (player) {
      player.hasPassed = true;
      this.state.log.push(`${player.name} bỏ lượt`);
    }

    this.advanceTurn();
    return { success: true, message: 'Bỏ lượt thành công' };
  }

  private advanceTurn() {
    // Tìm người chơi kế tiếp còn bài và chưa pass
    const activePlayers = this.state.players.filter((p) => p.hand.length > 0);
    const nonPassedActive = activePlayers.filter((p) => !p.hasPassed);

    const lastMovePlayer = this.state.lastValidMove
      ? this.state.players.find((p) => p.id === this.state.lastValidMove!.playerId)
      : null;
    const isLastMovePlayerFinished = Boolean(lastMovePlayer && lastMovePlayer.hand.length === 0);

    // Điều kiện kết thúc vòng đánh:
    // 1. Nếu người đánh nước cuối ĐÃ HẾT BÀI: vòng CHỈ kết thúc khi TẤT CẢ người còn bài đều đã pass (nonPassedActive.length === 0).
    // 2. Nếu người đánh nước cuối CÒN BÀI: vòng kết thúc khi tất cả người khác đã pass (nonPassedActive.length <= 1).
    const isTrickEnded = isLastMovePlayerFinished
      ? nonPassedActive.length === 0
      : nonPassedActive.length <= 1;

    // Nếu vòng đánh kết thúc
    if (isTrickEnded) {
      // Vòng mới! Xóa bài trên bàn, reset hasPassed
      let trickWinner = isLastMovePlayerFinished ? null : (nonPassedActive.length === 1 ? nonPassedActive[0] : null);
      if (!trickWinner) {
        // Người đánh nước cuối cùng đã hết bài và tất cả người khác đều đã pass
        // Nhường quyền mở vòng mới cho người kế tiếp còn bài theo chiều kim đồng hồ
        const lastMovePlayerId = this.state.lastValidMove?.playerId;
        const lastMoveIdx = this.state.players.findIndex((p) => p.id === lastMovePlayerId);
        let nextIdx = lastMoveIdx !== -1 ? (lastMoveIdx + 1) % this.state.players.length : 0;
        while (this.state.players[nextIdx].hand.length === 0) {
          nextIdx = (nextIdx + 1) % this.state.players.length;
        }
        trickWinner = this.state.players[nextIdx];
      }

      this.state.lastValidMove = null;
      for (const p of this.state.players) {
        p.hasPassed = false;
      }
      this.state.currentTurnPlayerId = trickWinner.id;
      this.state.log.push(`--- Bắt đầu vòng đánh mới, ${trickWinner.name} cầm vòng! ---`);
      this.broadcast();
      this.triggerBotTurnIfNeeded();
      return;
    }

    // Chuyển lượt sang người tiếp theo theo chiều kim đồng hồ (còn bài và chưa pass)
    const currentIndex = this.state.players.findIndex((p) => p.id === this.state.currentTurnPlayerId);
    let nextIndex = (currentIndex + 1) % 4;

    while (this.state.players[nextIndex].hand.length === 0 || this.state.players[nextIndex].hasPassed) {
      nextIndex = (nextIndex + 1) % 4;
    }

    this.state.currentTurnPlayerId = this.state.players[nextIndex].id;
    this.broadcast();
    this.triggerBotTurnIfNeeded();
  }

  public triggerBotTurnIfNeeded() {
    if (this.state.phase !== 'PLAYING') return;
    const currentP = this.state.players.find((p) => p.id === this.state.currentTurnPlayerId);
    if (!currentP || !currentP.isBot) return;

    if (this.botTimeout) {
      clearTimeout(this.botTimeout);
      this.botTimeout = null;
    }

    // Delay 750ms để người chơi nhìn rõ nhịp độ trận đấu
    this.botTimeout = setTimeout(() => {
      this.botTimeout = null;
      if (this.state.phase !== 'PLAYING' || this.state.currentTurnPlayerId !== currentP.id) return;
      const isFirstMoveOfRound1 =
        this.state.roundNumber === 1 && !this.isFirstMoveOfRound1Completed;
      const lastCombo = this.state.lastValidMove ? this.state.lastValidMove.combo : null;
      const chosenCards = BotAI.makeMove(currentP.hand, lastCombo, isFirstMoveOfRound1);

      if (chosenCards && chosenCards.length > 0) {
        const res = this.playCards(currentP.id, chosenCards.map((c) => c.id));
        if (!res.success) {
          console.error(`[BOT AI ERROR] Bot ${currentP.name} playCards failed: ${res.message}`);
          // Fallback an toàn: nếu đang cầm vòng, thử đánh lá bài đơn nhỏ nhất
          if (!this.state.lastValidMove && currentP.hand.length > 0) {
            const fallbackRes = this.playCards(currentP.id, [currentP.hand[0].id]);
            if (!fallbackRes.success) {
              this.passTurn(currentP.id);
            }
          } else {
            this.passTurn(currentP.id);
          }
        }
      } else {
        this.passTurn(currentP.id);
      }
    }, 750);
  }

  public isHost(playerId: string): boolean {
    return this.hostId === playerId;
  }

  public hasAnyHuman(): boolean {
    return this.state.players.some((p) => !p.isBot || this.reconnectTimers.has(p.id));
  }

  public cleanup() {
    if (this.botTimeout) {
      clearTimeout(this.botTimeout);
      this.botTimeout = null;
    }
    for (const [_, timer] of this.reconnectTimers) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
  }

  public removePlayer(playerId: string): { roomEmpty: boolean } {
    const idx = this.state.players.findIndex((p) => p.id === playerId);
    if (idx === -1) return { roomEmpty: this.state.players.length === 0 };

    const removed = this.state.players.splice(idx, 1)[0];
    this.state.log.push(`🚪 ${removed.name} đã rời phòng.`);

    // Nếu người rời là chủ phòng, chuyển quyền chủ phòng cho người kế tiếp
    if (this.hostId === playerId) {
      const nextHuman = this.state.players.find((p) => !p.isBot);
      if (nextHuman) {
        this.hostId = nextHuman.id;
        this.state.log.push(`👑 ${nextHuman.name} trở thành chủ phòng mới!`);
      } else if (this.state.players.length > 0) {
        this.hostId = this.state.players[0].id;
      }
    }

    const remainingHumans = this.state.players.filter((p) => !p.isBot);
    if (remainingHumans.length === 0) {
      this.cleanup();
      return { roomEmpty: true };
    }

    this.broadcast();
    return { roomEmpty: false };
  }

  public handlePlayerLeave(playerId: string): { roomEmpty: boolean } {
    if (this.state.phase === 'WAITING') {
      return this.removePlayer(playerId);
    }

    const otherHumans = this.state.players.filter((p) => !p.isBot && p.id !== playerId);
    if (otherHumans.length === 0) {
      this.cleanup();
      return { roomEmpty: true };
    }

    const p = this.state.players.find((pl) => pl.id === playerId);
    if (p) {
      p.isBot = true;
      p.name = `${p.name} (Bot)`;
      this.state.log.push(`🤖 ${p.name} đã rời phòng, Bot tiếp quản ghế!`);

      // Nếu người rời là chủ phòng, chuyển quyền chủ phòng cho người thật kế tiếp
      if (this.hostId === playerId) {
        const nextHuman = this.state.players.find((pl) => !pl.isBot && pl.id !== playerId);
        if (nextHuman) {
          this.hostId = nextHuman.id;
          this.state.log.push(`👑 ${nextHuman.name} trở thành chủ phòng mới!`);
        }
      }

      if (this.state.phase === 'AUGMENT_SELECT' && this.state.augmentChoices[playerId]) {
        const picked = BotAI.pickAugment(this.state.augmentChoices[playerId], p.hand, p.totalPoints);
        this.selectAugment(playerId, picked.id);
      } else if (this.state.phase === 'PLAYING' && this.state.currentTurnPlayerId === playerId) {
        this.triggerBotTurnIfNeeded();
      }
      this.broadcast();
    }
    return { roomEmpty: false };
  }

  public handlePlayerDisconnect(playerId: string): { roomEmpty: boolean } {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || player.isBot) {
      return { roomEmpty: !this.hasAnyHuman() };
    }

    // Nếu đang ở phòng chờ, xóa người chơi ngay
    if (this.state.phase === 'WAITING') {
      return this.removePlayer(playerId);
    }

    // Nếu giữa ván: Cho khoảng chờ kết nối lại (30s)
    this.state.log.push(`⚠️ ${player.name} bị ngắt kết nối! Đang chờ kết nối lại (30s)...`);
    this.broadcast();

    if (this.reconnectTimers.has(playerId)) {
      clearTimeout(this.reconnectTimers.get(playerId)!);
    }

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(playerId);
      // Hết 30s mà chưa vào lại -> Bot tiếp quản ghế để ván không bị kẹt
      if (this.state.phase !== 'MATCH_OVER') {
        player.isBot = true;
        player.name = `${player.name} (Bot)`;
        this.state.log.push(`🤖 Hết thời gian chờ, Bot đã tiếp quản ghế của ${player.name}!`);

        // Nếu người rời là chủ phòng, chuyển quyền chủ phòng cho người thật kế tiếp
        if (this.hostId === playerId) {
          const nextHuman = this.state.players.find((pl) => !pl.isBot && pl.id !== playerId);
          if (nextHuman) {
            this.hostId = nextHuman.id;
            this.state.log.push(`👑 ${nextHuman.name} trở thành chủ phòng mới!`);
          }
        }

        if (this.state.phase === 'AUGMENT_SELECT' && this.state.augmentChoices[playerId]) {
          const picked = BotAI.pickAugment(this.state.augmentChoices[playerId], player.hand, player.totalPoints);
          this.selectAugment(playerId, picked.id);
        } else if (this.state.phase === 'PLAYING' && this.state.currentTurnPlayerId === playerId) {
          this.triggerBotTurnIfNeeded();
        }

        this.broadcast();
      }

      if (!this.hasAnyHuman()) {
        this.cleanup();
        if (this.onRoomEmpty) {
          this.onRoomEmpty(this.state.roomCode);
        }
      }
    }, 30000);

    this.reconnectTimers.set(playerId, timer);
    return { roomEmpty: false };
  }

  public handlePlayerReconnect(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    if (this.reconnectTimers.has(playerId)) {
      clearTimeout(this.reconnectTimers.get(playerId)!);
      this.reconnectTimers.delete(playerId);
    }

    if (player.isBot) {
      player.isBot = false;
      player.name = player.name.replace(/\s*\(Bot\)$/, '');
    }

    this.state.log.push(`🔌 ${player.name} đã kết nối lại ván đấu!`);
    this.broadcast();
    return true;
  }

  private async endRound() {
    this.state.phase = 'ROUND_END';
    this.state.currentTurnPlayerId = null;

    // Tìm người Top 1
    const top1Player = this.state.players.find((p) => p.rankInRound === 1) || this.state.players[0];
    this.state.roundLeaderPlayerId = top1Player.id;

    // Phạt thối heo/hàng cuối ván
    const thoiEvents = handleThoiPenalties(this.state.players, top1Player);
    for (const e of thoiEvents) {
      this.state.pointEvents.push(e);
      this.state.log.push(`⚠️ ${e.message}`);
    }

    // Tính điểm tổng kết round & Lõi điểm số
    const { roundPoints, notes, checkmateWinner } = finalizeRoundScores(this.state.players);

    for (const p of this.state.players) {
      const added = roundPoints[p.id] || 0;
      const playerNotes = notes[p.id]?.length ? ` (${notes[p.id].join(', ')})` : '';
      this.state.log.push(`${p.name} nhận +${added} điểm round này${playerNotes}. Tổng: ${p.totalPoints}đ`);
      if (p.isCheckmate && !checkmateWinner && p.totalPoints - added < 16) {
        this.state.log.push(`🔥 ${p.name} đã chạm mốc ${p.totalPoints}đ (≥ 16đ) -> ĐỦ ĐIỀU KIỆN CHECKMATE! Cần thêm 1 lần Top 1 ở các round sau để vô địch!`);
      }
    }

    // KIỂM TRA ĐIỀU KIỆN CHECKMATE KẾT THÚC TOÀN TRẬN
    if (checkmateWinner) {
      this.state.phase = 'MATCH_OVER';
      this.state.winnerId = checkmateWinner.id;
      this.state.log.push(`👑 CHECKMATE! ${checkmateWinner.name} (đã đủ điều kiện Checkmate) vừa giành Top 1 -> CHÍNH THỨC VÔ ĐỊCH TOÀN TRẬN!`);

      // Lưu kết quả trận đấu vào MySQL Database
      await this.saveMatchToDb();
    }

    this.broadcast();
  }

  private async saveMatchToDb() {
    try {
      console.log(`[DB] Saving match ${this.state.matchId} to MySQL...`);

      await this.prisma.match.create({
        data: {
          id: this.state.matchId,
          roomCode: this.state.roomCode,
          winnerId: this.state.winnerId,
          totalRounds: this.state.roundNumber,
          endedAt: new Date(),
          players: {
            create: this.state.players.map((p) => ({
              userId: p.isBot ? null : (p.id.startsWith('guest-') ? null : p.id),
              name: p.name,
              isBot: p.isBot,
              finalRank: p.id === this.state.winnerId ? 1 : (p.rankInRound || 4),
              points: p.totalPoints,
            })),
          },
        },
      });

      // Update stats for all registered human players (not bot, not guest)
      const registeredPlayers = this.state.players.filter(
        (p) => !p.isBot && !p.id.startsWith('guest-') && !p.id.startsWith('bot-')
      );

      for (const player of registeredPlayers) {
        const isWinner = player.id === this.state.winnerId;
        await this.prisma.userStats.upsert({
          where: { userId: player.id },
          create: {
            userId: player.id,
            matchesPlayed: 1,
            checkmateWins: isWinner ? 1 : 0,
            top1Count: player.rankInRound === 1 ? 1 : 0,
            totalPoints: player.totalPoints,
          },
          update: {
            matchesPlayed: { increment: 1 },
            checkmateWins: isWinner ? { increment: 1 } : undefined,
            top1Count: player.rankInRound === 1 ? { increment: 1 } : undefined,
            totalPoints: { increment: player.totalPoints },
          },
        });
      }
      console.log(`[DB] Match ${this.state.matchId} saved successfully for ${registeredPlayers.length} registered player(s).`);
    } catch (err: any) {
      console.error(`[DB ERROR] Failed to save match:`, err.message);
    }
  }

  public getRedactedState(forPlayerId: string): MatchState {
    return {
      ...this.state,
      players: this.state.players.map((p) => {
        const isSelf = p.id === forPlayerId;
        return {
          ...p,
          handCount: p.hand ? p.hand.length : (p.handCount ?? 0),
          hand: isSelf ? p.hand : [],
        };
      }),
      augmentChoices: {
        ...(this.state.augmentChoices && this.state.augmentChoices[forPlayerId]
          ? { [forPlayerId]: this.state.augmentChoices[forPlayerId] }
          : {}),
      },
      rerollCounts: {
        ...(this.rerollCounts[forPlayerId] !== undefined
          ? { [forPlayerId]: this.rerollCounts[forPlayerId] }
          : {}),
      },
      rerolledSlots: {
        ...(this.rerolledSlots[forPlayerId] !== undefined
          ? { [forPlayerId]: this.rerolledSlots[forPlayerId] }
          : { [forPlayerId]: [false, false, false] }),
      },
    };
  }

  private broadcast() {
    this.onStateChange(this.state);
  }
}
