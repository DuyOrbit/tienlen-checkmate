import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, MatchState, PlayerState, AuthUser } from './types.js';
import { CardView } from './components/CardView.js';
import { ScoreProgress } from './components/ScoreProgress.js';
import { AugmentModal } from './components/AugmentModal.js';
import { RoundSummaryModal } from './components/RoundSummaryModal.js';
import { VictoryModal } from './components/VictoryModal.js';
import { AuthModal } from './auth/AuthModal.js';
import { AdminDashboard } from './admin/AdminDashboard.js';
import { API_BASE, SOCKET_URL } from './config.js';
import { Play, Shield, LogOut, User, RefreshCw, Zap, Volume2, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<MatchState | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tienlen_token'));
  const [guestName, setGuestName] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);
  const [actionError, setActionError] = useState('');

  // 1. Check logged in user profile if token exists
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem('tienlen_token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('tienlen_token');
          setToken(null);
        });
    }
  }, [token]);

  // 2. Connect to Socket.io
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => {
      console.log('Socket connected:', s.id);
    });

    s.on('game_state', (state: MatchState) => {
      setGameState(state);
      setActionError('');
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // 3. Start Game vs Bots
  const handleStartGame = () => {
    if (!socket) return;
    const playerId = currentUser?.id || `guest-${Date.now()}`;
    const name = currentUser?.username || guestName || 'Player 1';
    socket.emit('start_bot_game', { playerId, playerName: name });
  };

  // Human player seat (South)
  const humanPlayer = gameState?.players.find((p) => !p.isBot);
  const isHumanTurn =
    gameState?.phase === 'PLAYING' &&
    gameState.currentTurnPlayerId === humanPlayer?.id;

  // Toggle card selection
  const handleCardClick = (card: Card) => {
    if (selectedCardIds.includes(card.id)) {
      setSelectedCardIds(selectedCardIds.filter((id) => id !== card.id));
    } else {
      setSelectedCardIds([...selectedCardIds, card.id]);
    }
  };

  // Play cards
  const handlePlayCards = () => {
    if (!socket || selectedCardIds.length === 0) return;
    setActionError('');
    socket.emit('play_cards', { cardIds: selectedCardIds }, (res: any) => {
      if (!res.success) {
        setActionError(res.message);
      } else {
        setSelectedCardIds([]);
      }
    });
  };

  // Pass turn
  const handlePassTurn = () => {
    if (!socket) return;
    setActionError('');
    socket.emit('pass_turn', (res: any) => {
      if (!res.success) {
        setActionError(res.message);
      }
    });
  };

  // Augment Select
  const handleAugmentSelect = (augmentId: string) => {
    if (!socket) return;
    socket.emit('select_augment', { augmentId });
  };

  // Next round
  const handleNextRound = () => {
    if (!socket) return;
    socket.emit('next_round');
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('tienlen_token');
    setToken(null);
    setCurrentUser(null);
    setShowAdminView(false);
  };

  // If Admin View is active
  if (showAdminView && token) {
    return <AdminDashboard token={token} onBack={() => setShowAdminView(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between select-none">
      {/* Top Navbar */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-cyber font-black text-sm text-slate-950 shadow-neon-cyan">
            TL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber font-black text-sm sm:text-base tracking-wider text-slate-100">
                TIẾN LÊN CHECKMATE 16
              </span>
              <span className="text-[10px] font-cyber px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                CYBER ARCADE
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Đua 16 điểm • Chặn lõi 12 điểm • Roguelike Augments
            </div>
          </div>
        </div>

        {/* Right Auth & Controls */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-cyber">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-200">{currentUser.username}</span>
                {currentUser.role === 'ADMIN' && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-500/40">
                    ADMIN
                  </span>
                )}
              </div>

              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => setShowAdminView(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 font-cyber text-xs flex items-center gap-1 hover:bg-amber-900 transition"
                  title="Mở Admin Quản trị Người Dùng"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">QUẢN TRỊ</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 transition"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-cyber text-xs hover:bg-cyan-500 hover:text-slate-950 shadow-neon-cyan transition"
            >
              ĐĂNG NHẬP / QUẢN TRỊ
            </button>
          )}

          {!gameState && (
            <button
              onClick={handleStartGame}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-cyber font-black text-xs sm:text-sm hover:brightness-110 shadow-neon-cyan transition flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>VÀO BÀN CHƠI BOT</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Game Table Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col justify-between relative overflow-hidden">
        {!gameState ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-amber-400 to-pink-500" />
              <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-neon-cyan">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-cyber font-black text-slate-100 mb-3">
                TIẾN LÊN CHECKMATE 16
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed mb-6 font-sans">
                Trò chơi bài Tiến Lên Miền Nam phong cách Cyberpunk kết hợp cơ chế{' '}
                <strong className="text-cyan-400">Chọn Lõi Điểm Số</strong> và{' '}
                <strong className="text-amber-400">Luật Checkmate 16 Điểm</strong>.
                Người vượt 12 điểm bị tước lõi và đánh chay; ai chạm mốc 16 điểm và giành Top 1 sẽ đoạt cúp vô địch!
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleStartGame}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-cyber font-black text-sm uppercase tracking-wider hover:brightness-110 shadow-neon-cyan transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>BẮT ĐẦU TRẬN ĐẤU NGAY</span>
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 font-cyber text-sm hover:border-cyan-400 transition flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>ĐĂNG NHẬP ADMIN / TÀI KHOẢN</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Playing Board */
          <div className="flex-1 flex flex-col justify-between relative min-h-[580px]">
            {/* North Seat (Opponent 2) */}
            <div className="w-full flex justify-center">
              <div className="w-64 sm:w-80">
                <ScoreProgress
                  player={gameState.players[1]}
                  isCurrentTurn={gameState.currentTurnPlayerId === gameState.players[1].id}
                  position="north"
                />
              </div>
            </div>

            {/* Middle Row: West Seat, Center Trick Arena, East Seat */}
            <div className="flex items-center justify-between gap-2 my-2 sm:my-4">
              {/* West Seat (Opponent 1) */}
              <div className="w-48 sm:w-60">
                <ScoreProgress
                  player={gameState.players[2]}
                  isCurrentTurn={gameState.currentTurnPlayerId === gameState.players[2].id}
                  position="west"
                />
              </div>

              {/* CENTER TRICK PILE & LOG */}
              <div className="flex-1 max-w-lg min-h-[160px] sm:min-h-[200px] rounded-3xl bg-slate-950/70 border border-slate-800/80 p-3 sm:p-4 flex flex-col items-center justify-center relative shadow-inner">
                {/* Round Badge */}
                <div className="absolute top-2.5 left-4 text-[11px] font-cyber text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>ROUND {gameState.roundNumber}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-cyan-400">{gameState.phase}</span>
                </div>

                {/* Last Valid Move Display */}
                {gameState.lastValidMove ? (
                  <div className="flex flex-col items-center animate-fade-in">
                    <span className="text-[11px] font-cyber text-slate-400 mb-2">
                      {gameState.lastValidMove.playerName} vừa đánh ({gameState.lastValidMove.combo.type}):
                    </span>
                    <div className="flex -space-x-4 sm:-space-x-6 justify-center">
                      {gameState.lastValidMove.cards.map((c) => (
                        <CardView key={c.id} card={c} small={false} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-cyber text-slate-500 uppercase tracking-widest text-center">
                    {gameState.phase === 'PLAYING'
                      ? '--- BÀN TRỐNG • BẮT ĐẦU VÒNG ĐÁNH MỚI ---'
                      : 'Đang chuẩn bị round...'}
                  </div>
                )}

                {/* Point Steal Notification Banner */}
                {gameState.pointEvents.length > 0 && (
                  <div className="absolute bottom-2 left-4 right-4 text-center">
                    <span className="text-[11px] font-cyber text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 rounded-full shadow-neon-gold">
                      💥 {gameState.pointEvents[gameState.pointEvents.length - 1].message}
                    </span>
                  </div>
                )}
              </div>

              {/* East Seat (Opponent 3) */}
              <div className="w-48 sm:w-60">
                <ScoreProgress
                  player={gameState.players[3]}
                  isCurrentTurn={gameState.currentTurnPlayerId === gameState.players[3].id}
                  position="east"
                />
              </div>
            </div>

            {/* South Seat (Human Player) */}
            <div className="w-full flex flex-col items-center gap-2">
              {/* Score bar */}
              {humanPlayer && (
                <div className="w-full max-w-md">
                  <ScoreProgress
                    player={humanPlayer}
                    isCurrentTurn={isHumanTurn}
                    position="south"
                  />
                </div>
              )}

              {/* Action Error Warning */}
              {actionError && (
                <div className="text-xs font-cyber text-rose-400 bg-rose-950/80 border border-rose-500/40 px-3 py-1 rounded-full animate-shake">
                  ⚠️ {actionError}
                </div>
              )}

              {/* Action Buttons Row */}
              {isHumanTurn && (
                <div className="flex items-center gap-2 sm:gap-3 py-1">
                  <button
                    onClick={handlePlayCards}
                    disabled={selectedCardIds.length === 0}
                    className={`px-5 py-2.5 rounded-xl font-cyber font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      selectedCardIds.length > 0
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-neon-cyan hover:brightness-110'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>ĐÁNH BÀI ({selectedCardIds.length})</span>
                  </button>

                  <button
                    onClick={handlePassTurn}
                    disabled={!gameState.lastValidMove}
                    className={`px-4 py-2.5 rounded-xl font-cyber font-bold text-xs uppercase tracking-wider transition ${
                      gameState.lastValidMove
                        ? 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-rose-400 hover:text-rose-400'
                        : 'bg-slate-950 border border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    BỎ LƯỢT
                  </button>

                  {selectedCardIds.length > 0 && (
                    <button
                      onClick={() => setSelectedCardIds([])}
                      className="px-3 py-2.5 rounded-xl text-xs font-cyber text-slate-400 hover:text-slate-200"
                    >
                      BỎ CHỌN
                    </button>
                  )}
                </div>
              )}

              {/* Hand of Cards */}
              {humanPlayer && (
                <div className="flex -space-x-3 sm:-space-x-5 justify-center py-2 overflow-x-auto max-w-full px-2">
                  {humanPlayer.hand.map((card) => (
                    <CardView
                      key={card.id}
                      card={card}
                      isSelected={selectedCardIds.includes(card.id)}
                      onClick={() => handleCardClick(card)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {/* 1. Augment Selection Modal */}
      {gameState?.phase === 'AUGMENT_SELECT' &&
        humanPlayer &&
        gameState.augmentChoices[humanPlayer.id] && (
          <AugmentModal
            augments={gameState.augmentChoices[humanPlayer.id]}
            hand={humanPlayer.hand}
            onSelect={handleAugmentSelect}
          />
        )}

      {/* 2. Round Summary Modal */}
      {gameState?.phase === 'ROUND_END' && (
        <RoundSummaryModal state={gameState} onNextRound={handleNextRound} />
      )}

      {/* 3. Victory Match Over Modal */}
      {gameState?.phase === 'MATCH_OVER' && (
        <VictoryModal state={gameState} onRestart={handleStartGame} />
      )}

      {/* 4. Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onSuccess={(user, tok) => {
            setCurrentUser(user);
            setToken(tok);
            setShowAuthModal(false);
          }}
          onPlayAsGuest={(name) => {
            setGuestName(name);
            setShowAuthModal(false);
            handleStartGame();
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

