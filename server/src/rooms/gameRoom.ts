import { PrismaClient } from '@prisma/client';
import { Card, Combo, MatchState, PlayerState, TrickMove } from '../engine/types.js';
import { createDeck, shuffleDeck, dealHands, sortCards } from '../engine/cardUtils.js';
import { evaluateCombo, canBeat, checkToiTrang } from '../engine/evaluator.js';
import { getRandomAugments } from '../engine/augments.js';
import { handleChopPointTransfer, handleThoiPenalties, finalizeRoundScores } from '../engine/scoring.js';
import { BotAI } from '../bot/botAI.js';

export class GameRoom {
  public state: MatchState;
  private prisma: PrismaClient;
  private onStateChange: (state: MatchState) => void;

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
        this.state.log.push(`🎉 ${p.name} ĂN TRẮNG (${toiTrang})! Tự động giành TOP 1 (+5 điểm)!`);
        p.rankInRound = 1;
        this.state.finishOrder.push(p.id);
        break;
      }
    }

    // 2. Chuyển sang giai đoạn Chọn Lõi (Augment Selection)
    this.state.phase = 'AUGMENT_SELECT';
    for (const p of this.state.players) {
      if (p.canPickAugment) {
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

    // Nếu tất cả người khác đã pass (chỉ còn lại người đánh nước cuối cùng)
    if (nonPassedActive.length <= 1) {
      // Vòng mới! Xóa bài trên bàn, reset hasPassed
      const trickWinner = nonPassedActive.length === 1 ? nonPassedActive[0] : activePlayers[0];
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

    // Chuyển lượt sang người tiếp theo theo chiều kim đồng hồ
    const currentIndex = this.state.players.findIndex((p) => p.id === this.state.currentTurnPlayerId);
    let nextIndex = (currentIndex + 1) % 4;

    while (this.state.players[nextIndex].hand.length === 0 || this.state.players[nextIndex].hasPassed) {
      nextIndex = (nextIndex + 1) % 4;
    }

    this.state.currentTurnPlayerId = this.state.players[nextIndex].id;
    this.broadcast();
    this.triggerBotTurnIfNeeded();
  }

  private triggerBotTurnIfNeeded() {
    if (this.state.phase !== 'PLAYING') return;
    const currentP = this.state.players.find((p) => p.id === this.state.currentTurnPlayerId);
    if (!currentP || !currentP.isBot) return;

    // Delay 750ms để người chơi nhìn rõ nhịp độ trận đấu
    setTimeout(() => {
      if (this.state.phase !== 'PLAYING' || this.state.currentTurnPlayerId !== currentP.id) return;
      const lastCombo = this.state.lastValidMove ? this.state.lastValidMove.combo : null;
      const chosenCards = BotAI.makeMove(currentP.hand, lastCombo);

      if (chosenCards && chosenCards.length > 0) {
        this.playCards(currentP.id, chosenCards.map((c) => c.id));
      } else {
        this.passTurn(currentP.id);
      }
    }, 750);
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
    }

    // KIỂM TRA ĐIỀU KIỆN CHECKMATE KẾT THÚC TOÀN TRẬN
    if (checkmateWinner) {
      this.state.phase = 'MATCH_OVER';
      this.state.winnerId = checkmateWinner.id;
      this.state.log.push(`👑 CHECKMATE! ${checkmateWinner.name} đã chạm mốc 16 điểm và giành Top 1 -> VÔ ĐỊCH TOÀN TRẬN!`);

      // Lưu kết quả trận đấu vào MySQL Database
      await this.saveMatchToDb();
    }

    this.broadcast();
  }

  private async saveMatchToDb() {
    try {
      console.log(`[DB] Saving match ${this.state.matchId} to MySQL...`);
      const human = this.state.players.find((p) => !p.isBot);

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

      // Update human player stats if authenticated user
      if (human && !human.id.startsWith('guest-') && !human.id.startsWith('bot-')) {
        const isWinner = human.id === this.state.winnerId;
        await this.prisma.userStats.upsert({
          where: { userId: human.id },
          create: {
            userId: human.id,
            matchesPlayed: 1,
            checkmateWins: isWinner ? 1 : 0,
            top1Count: human.rankInRound === 1 ? 1 : 0,
            totalPoints: human.totalPoints,
          },
          update: {
            matchesPlayed: { increment: 1 },
            checkmateWins: isWinner ? { increment: 1 } : undefined,
            top1Count: human.rankInRound === 1 ? { increment: 1 } : undefined,
            totalPoints: { increment: human.totalPoints },
          },
        });
      }
      console.log(`[DB] Match ${this.state.matchId} saved successfully.`);
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
    };
  }

  private broadcast() {
    this.onStateChange(this.state);
  }
}
