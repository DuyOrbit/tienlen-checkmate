import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, MatchState, PlayerState, AuthUser } from './types.js';
import { CardView } from './components/CardView.js';
import { CuteAvatar } from './components/CuteAvatar.js';
import { CheckmateTrack } from './components/CheckmateTrack.js';
import { PlayerSeat } from './components/PlayerSeat.js';
import { WaitingRoom } from './components/WaitingRoom.js';
import { AugmentModal } from './components/AugmentModal.js';
import { RoundSummaryModal } from './components/RoundSummaryModal.js';
import { VictoryModal } from './components/VictoryModal.js';
import { AuthModal } from './auth/AuthModal.js';
import { AdminDashboard } from './admin/AdminDashboard.js';
import { API_BASE, SOCKET_URL } from './config.js';
import {
  ArrowLeft,
  Music,
  HelpCircle,
  MoreHorizontal,
  ArrowRight,
  Shield,
  LogOut,
  User,
  Sparkles,
  KeyRound,
  X,
  Wifi,
  WifiOff,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gameState, setGameState] = useState<MatchState | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('tienlen_token'));
  const [guestName, setGuestName] = useState<string | null>(() => {
    const urlParam = new URLSearchParams(window.location.search).get('name');
    if (urlParam) return urlParam;
    return sessionStorage.getItem('tienlen_guest_name') || localStorage.getItem('tienlen_guest_name');
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'week' | 'month' | 'all'>('week');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [actionError, setActionError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [serverAssignedId, setServerAssignedId] = useState<string | null>(null);

  const [sessionGuestId] = useState(() => {
    let id = sessionStorage.getItem('tienlen_guest_id');
    if (!id) {
      id = `guest-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('tienlen_guest_id', id);
    }
    return id;
  });

  const getPlayerId = () => currentUser?.id || serverAssignedId || sessionGuestId;
  const getPlayerName = () => currentUser?.username || guestName || 'Mèo Mập';

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
            sessionStorage.removeItem('tienlen_token');
            setToken(null);
          }
        })
        .catch(() => {
          sessionStorage.removeItem('tienlen_token');
          setToken(null);
        });
    }
  }, [token]);

  // 2. Connect to Socket.io
  useEffect(() => {
    const s = io(SOCKET_URL, {
      auth: (cb: (data: { token?: string; guestToken?: string }) => void) => {
        const curToken = sessionStorage.getItem('tienlen_token');
        const guestToken = sessionStorage.getItem('tienlen_guest_token');
        cb({
          token: curToken || undefined,
          guestToken: guestToken || undefined,
        });
      },
      reconnectionAttempts: 10,
      timeout: 3000,
    });
    setSocket(s);
    (window as any).__tienlen_socket = s;

    s.on('connect', () => {
      console.log('Socket connected:', s.id);
      setIsConnected(true);
      setActionError('');
    });

    s.on('session_init', (data: { playerId: string; playerName: string; isGuest: boolean; guestToken?: string }) => {
      setServerAssignedId(data.playerId);
      if (data.isGuest) {
        sessionStorage.setItem('tienlen_guest_id', data.playerId);
        if (data.guestToken) {
          sessionStorage.setItem('tienlen_guest_token', data.guestToken);
        }
      }
    });

    s.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    s.on('connect_error', () => {
      setIsConnected(false);
    });

    s.on('game_state', (state: MatchState) => {
      (window as any).__tienlen_state = state;
      setGameState(state);
      setActionError('');
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Cập nhật xác thực Socket khi token đăng nhập thay đổi
  useEffect(() => {
    if (socket) {
      const curToken = sessionStorage.getItem('tienlen_token');
      const guestToken = sessionStorage.getItem('tienlen_guest_token');
      socket.auth = {
        token: curToken || undefined,
        guestToken: guestToken || undefined,
      };
      socket.disconnect().connect();
    }
  }, [token]);

  // 3. Start Game vs Bots
  const handleStartBotGame = () => {
    if (!socket || !isConnected) {
      alert('⚠️ Đang kết nối tới máy chủ (port 3001)...\nVui lòng đợi vài giây và thử lại!');
      return;
    }
    const name = getPlayerName();
    socket.emit('start_bot_game', { playerName: name });
  };

  // 4. Create Custom Room
  const handleCreateCustomRoom = () => {
    const name = getPlayerName();

    if (socket && isConnected) {
      socket.emit('create_custom_room', { playerName: name }, (res: any) => {
        if (!res?.success) {
          alert(res?.message || 'Lỗi khi tạo phòng');
        }
      });
    } else {
      // Local fallback nếu backend chưa kết nối
      const code = `CM${Math.floor(1000 + Math.random() * 9000)}`;
      setGameState({
        matchId: `custom-${Date.now()}`,
        roomCode: code,
        roundNumber: 0,
        phase: 'WAITING',
        players: [
          {
            id: getPlayerId(),
            name,
            isBot: false,
            avatarSeed: name,
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
        ],
        currentTurnPlayerId: null,
        lastValidMove: null,
        roundLeaderPlayerId: null,
        finishOrder: [],
        log: ['Đã tạo phòng chờ bạn bè!'],
        pointEvents: [],
        augmentChoices: {},
        winnerId: null,
      });
    }
  };

  // 5. Join Room by Code
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomCode.trim()) return;
    const name = getPlayerName();

    if (socket && isConnected) {
      socket.emit(
        'join_custom_room',
        { roomCode: inputRoomCode.trim(), playerName: name },
        (res: any) => {
          if (!res?.success) {
            alert(res?.message || 'Không tìm thấy phòng với mã này!');
          } else {
            setShowJoinModal(false);
            setInputRoomCode('');
          }
        }
      );
    } else {
      // Offline fallback: tạo phòng giả lập
      const code = inputRoomCode.trim().toUpperCase();
      setShowJoinModal(false);
      setInputRoomCode('');
      setGameState({
        matchId: `custom-${Date.now()}`,
        roomCode: code,
        roundNumber: 0,
        phase: 'WAITING',
        players: [
          {
            id: 'host-1',
            name: 'Chủ Phòng',
            isBot: false,
            avatarSeed: 'host',
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
            id: getPlayerId(),
            name,
            isBot: false,
            avatarSeed: name,
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
        ],
        currentTurnPlayerId: null,
        lastValidMove: null,
        roundLeaderPlayerId: null,
        finishOrder: [],
        log: [`${name} đã tham gia phòng ${code}!`],
        pointEvents: [],
        augmentChoices: {},
        winnerId: null,
      });
    }
  };

  // 6. Start Match from Waiting Room
  const handleStartCustomGame = () => {
    if (socket && isConnected) {
      socket.emit('start_custom_game', (res: any) => {
        if (res && !res.success) {
          alert(res.message);
        }
      });
    } else {
      handleStartBotGame();
    }
  };

  // 7. Add Bot into Waiting Room
  const handleAddBotToRoom = () => {
    if (socket && isConnected) {
      socket.emit('add_bot_to_room', (res: any) => {
        if (res && !res.success) {
          alert(res.message);
        }
      });
    } else {
      setGameState((prev) => {
        if (!prev || prev.players.length >= 4) return prev;
        const defaultBots = [
          { name: 'Bắp Rang', seed: 'bear' },
          { name: 'Cáo Nhỏ', seed: 'fox' },
          { name: 'Thỏ Chill', seed: 'rabbit' },
        ];
        const existing = prev.players.map((p) => p.name);
        const bot = defaultBots.find((b) => !existing.includes(b.name)) || {
          name: `Bot ${prev.players.length}`,
          seed: 'robot',
        };
        const newP: PlayerState = {
          id: `bot-${Date.now()}`,
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
        };
        return { ...prev, players: [...prev.players, newP] };
      });
    }
  };

  // 8. Leave Room
  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave_room');
    }
    setGameState(null);
    setShowMoreMenu(false);
  };

  // Keyboard shortcut: Enter to Play, Space to Pass
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter') {
        handlePlayCards();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handlePassTurn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardIds, gameState, socket]);

  // Human player seat (South) - Lấy đúng người chơi có id trùng với chính mình
  const humanPlayer = gameState?.players.find((p) => p.id === getPlayerId()) || null;
  const isHumanTurn =
    gameState?.phase === 'PLAYING' &&
    Boolean(humanPlayer && gameState.currentTurnPlayerId === humanPlayer.id);

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

  // Augment Reroll theo từng thẻ riêng lẻ
  const handleRerollAugmentSlot = (slotIndex: number) => {
    if (!socket) return;
    setActionError('');
    socket.emit('reroll_augment_slot', { slotIndex }, (res: any) => {
      if (res && !res.success && res.message) {
        setActionError(res.message);
      }
    });
  };

  // Next round
  const handleNextRound = () => {
    if (!socket) return;
    socket.emit('next_round', (res: any) => {
      if (res && !res.success) {
        setActionError(res.message);
      }
    });
  };

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem('tienlen_token');
    setToken(null);
    setCurrentUser(null);
    setShowAdminView(false);
  };

  // Dữ liệu Bảng Vàng theo từng mốc lọc
  const getLeaderboardData = () => {
    switch (leaderboardFilter) {
      case 'month':
        return [
          { rank: '01', name: 'Mèo Mập', role: 'Bạn đó!', points: '8.450', type: 'cat', highlight: true },
          { rank: '02', name: 'Bắp Rang', role: 'Cao thủ lật kèo', points: '7.890', type: 'bear' },
          { rank: '03', name: 'Gấu Nâu', role: 'Chiến thần sảnh', points: '6.920', type: 'bear' },
          { rank: '04', name: 'Cáo Nhỏ', role: 'Chuyên gia bắt bài', points: '6.320', type: 'fox' },
          { rank: '05', name: 'Thỏ Chill', role: 'Chill là chính', points: '5.810', type: 'rabbit' },
        ];
      case 'all':
        return [
          { rank: '01', name: 'Mèo Mập', role: 'Đại tướng Checkmate', points: '24.120', type: 'cat', highlight: true },
          { rank: '02', name: 'Gấu Nâu', role: 'Huyền thoại lật kèo', points: '21.050', type: 'bear' },
          { rank: '03', name: 'Bắp Rang', role: 'Bậc thầy chặt heo', points: '19.840', type: 'bear' },
          { rank: '04', name: 'Cáo Nhỏ', role: 'Cáo già làng', points: '17.200', type: 'fox' },
          { rank: '05', name: 'Thỏ Chill', role: 'Thần tài may mắn', points: '15.930', type: 'rabbit' },
        ];
      case 'week':
      default:
        return [
          { rank: '01', name: 'Bắp Rang', role: 'Cao thủ lật kèo', points: '2.480', type: 'bear' },
          { rank: '02', name: 'Gấu Nâu', role: 'Cao thủ lật kèo', points: '2.160', type: 'bear' },
          { rank: '03', name: 'Mèo Mập', role: 'Bạn đó!', points: '1.920', type: 'cat', highlight: true },
          { rank: '04', name: 'Cáo Nhỏ', role: 'Cao thủ lật kèo', points: '1.840', type: 'fox' },
          { rank: '05', name: 'Thỏ Chill', role: 'Cao thủ lật kèo', points: '1.720', type: 'rabbit' },
        ];
    }
  };

  // If Admin View is active
  if (showAdminView && token) {
    return <AdminDashboard token={token} onBack={() => setShowAdminView(false)} />;
  }

  // -------------------------------------------------------------
  // VIEW 1: SẢNH CHỜ PHÒNG RIÊNG (Waiting Room)
  // -------------------------------------------------------------
  if (gameState && gameState.phase === 'WAITING') {
    return (
      <WaitingRoom
        state={gameState}
        currentUserId={getPlayerId()}
        onStartGame={handleStartCustomGame}
        onAddBot={handleAddBotToRoom}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: GAME LOBBY (Sảnh chính)
  // -------------------------------------------------------------
  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#161c18] text-[#f1f5f9] flex flex-col justify-between select-none">
        {/* Top Navbar */}
        <header className="h-16 px-4 sm:px-8 border-b border-[#243128] bg-[#121814]/90 backdrop-blur-md flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fefdfa] border border-[#d6d3d1] flex items-center justify-center text-xl text-[#0f172a] shadow-sm font-black">
              ♠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base sm:text-lg tracking-wide text-[#f8fafc]">
                  TIẾN LÊN
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#fde047] text-[#78350f]">
                  CHECKMATE 16
                </span>
              </div>
            </div>
          </div>

          {/* Center Online Stats & Rules & Server Status */}
          <div className="hidden md:flex items-center gap-4 text-xs text-[#94a3b8]">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${
                isConnected
                  ? 'bg-[#14291e] border-[#234533] text-[#86efac]'
                  : 'bg-[#450a0a]/80 border-[#ef4444] text-[#fca5a5] animate-pulse'
              }`}
            >
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isConnected ? 'Máy chủ: Trực tuyến' : 'Đang kết nối...'}</span>
            </div>

            <button
              onClick={() => setShowRulesModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#202b23] border border-[#2d3d32] text-[#cbd5e1] hover:text-white transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#fde047]" />
              <span>Luật chơi</span>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#1b3325] border border-[#2d5c41] text-[#86efac] font-bold hover:bg-[#224431] transition flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Nhập mã vào bàn</span>
            </button>
          </div>

          {/* Right Profile Pill & Auth */}
          <div className="flex items-center gap-3">
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setShowAdminView(true)}
                className="px-3 py-1.5 rounded-xl bg-[#78350f]/80 border border-[#b45309] text-[#fde047] font-bold text-xs flex items-center gap-1 hover:bg-[#78350f] transition"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">QUẢN TRỊ</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#202b23] border border-[#2d3d32]">
                <CuteAvatar type={currentUser.username} size="sm" />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-[#f8fafc] leading-tight">
                    {currentUser.username}
                  </div>
                  <div className="text-[10px] text-[#94a3b8]">Sẵn sàng quẩy chưa?</div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-[#78350f] text-[#fde047] text-[11px] font-black flex items-center gap-1 ml-1">
                  <span>🪙</span>
                  <span>12.480</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-[#94a3b8] hover:text-[#f87171] ml-1"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-5 py-2 rounded-full btn-squish-gray text-xs font-bold flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>ĐĂNG NHẬP</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Lobby Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Hero Banner + Play Modes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Big Hero Banner */}
            <div className="rounded-3xl bg-[#1c382a] border-2 border-[#2b513d] p-6 sm:p-8 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[260px]">
              <div className="absolute right-4 -top-8 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[#244b38] opacity-60 pointer-events-none" />

              {/* Fanned 3 Cards Illustration */}
              <div className="absolute right-4 sm:right-12 bottom-4 sm:bottom-6 pointer-events-none hidden sm:flex items-end -space-x-8">
                <div className="w-20 h-28 rounded-2xl bg-[#fdfbf7] border border-[#e5e7eb] shadow-2xl transform -rotate-15 p-2 flex flex-col justify-between">
                  <span className="font-black text-sm text-[#0f172a]">A♠</span>
                  <span className="text-center text-xl text-[#0f172a]">♠</span>
                  <span className="font-black text-sm text-[#0f172a] rotate-180 self-end">A♠</span>
                </div>
                <div className="w-22 h-32 rounded-2xl bg-[#fdfbf7] border-2 border-[#fde047] shadow-2xl transform rotate-0 -translate-y-3 p-2 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-center text-xs font-black text-[#e11d48]">
                    <span>2♥</span>
                    <span>👑</span>
                  </div>
                  <span className="text-center text-3xl text-[#e11d48]">♥</span>
                  <span className="font-black text-xs text-[#e11d48] rotate-180 self-end">2♥</span>
                </div>
                <div className="w-20 h-28 rounded-2xl bg-[#fdfbf7] border border-[#e5e7eb] shadow-2xl transform rotate-15 p-2 flex flex-col justify-between">
                  <span className="font-black text-sm text-[#0f172a]">K♣</span>
                  <span className="text-center text-xl text-[#0f172a]">♣</span>
                  <span className="font-black text-sm text-[#0f172a] rotate-180 self-end">K♣</span>
                </div>
              </div>

              <div className="relative z-10 max-w-md">
                <span className="text-[11px] font-black text-[#86efac] tracking-widest uppercase">
                  BÀI ĐẸP CHƯA CHẮC THẮNG. VUI LÀ CHẮC!
                </span>
                <div className="flex items-center gap-3 my-2">
                  <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#f8fafc] leading-tight">
                    TIẾN LÊN <br /> CHECKMATE
                  </h1>
                  <span className="w-12 h-12 rounded-2xl bg-[#fde047] text-[#78350f] font-heading font-black text-xl flex items-center justify-center shadow-lg">
                    16
                  </span>
                </div>
                <p className="text-sm text-[#cbd5e1] font-medium leading-relaxed mb-4">
                  Một bàn bài. Bốn đứa bạn. Vô vàn pha lật kèo.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14291e] border border-[#234533] text-xs font-bold text-[#86efac]">
                  <span>✦ 4 người · 16 điểm · 1 vương miện</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-heading font-black text-[#f8fafc]">
                Hôm nay, mình chơi gì?
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Chọn một bàn, kéo ghế vào nào.
              </p>
            </div>

            {/* 2 Big Play Mode Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleStartBotGame}
                className="text-left w-full group rounded-3xl bg-[#1d2721] border-2 border-[#2b3a32] hover:border-[#86efac] p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-md focus:outline-none"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0284c7]/20 border border-[#38bdf8]/40 flex items-center justify-center text-2xl">
                      🤖
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#94a3b8] tracking-wider block">
                        KHỞI ĐỘNG NHẸ NHÀNG
                      </span>
                      <h3 className="text-lg font-heading font-black text-[#f8fafc] group-hover:text-[#86efac] transition">
                        Chơi Với Bot
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    Tập lật kèo, không lo bị giục.
                  </p>
                  <span className="text-[11px] text-[#64748b] block mt-1">1 người + 3 bot thông minh</span>
                </div>

                <div className="flex justify-end mt-4">
                  <div className="w-10 h-10 rounded-full btn-squish-green flex items-center justify-center group-hover:scale-110 transition">
                    <ArrowRight className="w-5 h-5 text-[#143522] stroke-[3]" />
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleCreateCustomRoom}
                className="text-left w-full group rounded-3xl bg-[#1a3828] border-2 border-[#28553d] hover:border-[#86efac] p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-md focus:outline-none"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0d9488]/20 border border-[#2dd4bf]/40 flex items-center justify-center text-2xl">
                      👥
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#86efac] tracking-wider block">
                        BẠN BÈ LÀ TRÊN HẾT
                      </span>
                      <h3 className="text-lg font-heading font-black text-[#f8fafc] group-hover:text-[#86efac] transition">
                        Tạo Phòng
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed">
                    Rủ hội bạn vào, chia bài thôi!
                  </p>
                  <span className="text-[11px] text-[#86efac]/80 block mt-1">Sảnh chờ riêng tư · Mời bạn qua mã</span>
                </div>

                <div className="flex justify-end mt-4">
                  <div className="w-10 h-10 rounded-full btn-squish-green flex items-center justify-center group-hover:scale-110 transition">
                    <ArrowRight className="w-5 h-5 text-[#143522] stroke-[3]" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column: Bảng Vàng Checkmate */}
          <div className="rounded-3xl bg-[#2a1d15] border-4 border-[#784f30] p-6 shadow-2xl relative">
            <div className="text-center mb-4">
              <span className="text-3xl inline-block mb-1">🏆</span>
              <h3 className="text-xl font-heading font-black text-[#fde047]">
                Bảng Vàng
              </h3>
              <span className="text-xs font-bold text-[#b45309] uppercase tracking-widest">
                CHECKMATE
              </span>

              {/* Dropdown Lọc tuần / tháng / tất cả */}
              <div className="mt-3 flex justify-center relative">
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="px-4 py-1 rounded-full bg-[#1d140e] border border-[#523521] text-xs font-bold text-[#fef08a] flex items-center gap-1.5 shadow-inner hover:border-[#86efac]"
                >
                  <span>
                    {leaderboardFilter === 'week'
                      ? 'Tuần này'
                      : leaderboardFilter === 'month'
                      ? 'Tháng này'
                      : 'Tất cả'}
                  </span>
                  <span className="text-[10px]">▾</span>
                </button>

                {showFilterDropdown && (
                  <div className="absolute top-8 z-30 bg-[#1d140e] border border-[#523521] rounded-xl shadow-xl overflow-hidden py-1 w-32 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => { setLeaderboardFilter('week'); setShowFilterDropdown(false); }}
                      className={`w-full py-1.5 text-xs font-bold ${leaderboardFilter === 'week' ? 'text-[#86efac] bg-[#291b13]' : 'text-[#fef08a] hover:bg-[#291b13]'}`}
                    >
                      Tuần này
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLeaderboardFilter('month'); setShowFilterDropdown(false); }}
                      className={`w-full py-1.5 text-xs font-bold ${leaderboardFilter === 'month' ? 'text-[#86efac] bg-[#291b13]' : 'text-[#fef08a] hover:bg-[#291b13]'}`}
                    >
                      Tháng này
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLeaderboardFilter('all'); setShowFilterDropdown(false); }}
                      className={`w-full py-1.5 text-xs font-bold ${leaderboardFilter === 'all' ? 'text-[#86efac] bg-[#291b13]' : 'text-[#fef08a] hover:bg-[#291b13]'}`}
                    >
                      Tất cả
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5 my-4">
              {getLeaderboardData().map((item) => (
                <div
                  key={item.rank}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    item.highlight
                      ? 'bg-[#18291f] border-2 border-[#86efac] shadow-md'
                      : 'bg-[#1d140e] border-[#3e2718]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-heading font-black text-xs w-5 ${
                        item.highlight ? 'text-[#86efac]' : 'text-[#fde047]'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <CuteAvatar type={item.type} size="sm" />
                    <div>
                      <div className={`text-xs font-bold ${item.highlight ? 'text-[#86efac]' : 'text-[#f8fafc]'}`}>
                        {item.name}
                      </div>
                      <div className="text-[9px] text-[#94a3b8]">{item.role}</div>
                    </div>
                  </div>
                  <span className={`font-heading font-black text-sm ${item.highlight ? 'text-[#86efac]' : 'text-[#fde047]'}`}>
                    {item.points}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center text-[10px] text-[#b45309] font-medium pt-2">
              Làm mới sau 02 ngày 14 giờ
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 px-6 border-t border-[#243128] bg-[#121814] flex items-center justify-between text-xs text-[#64748b]">
          <div className="flex items-center gap-2">
            <span>☕ Chơi vui thôi, đừng căng nhé!</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowJoinModal(true)} className="hover:text-[#86efac] transition">
              Vào phòng bằng mã
            </button>
            <span>•</span>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="hover:text-[#86efac] flex items-center gap-1 transition">
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#86efac]" /> : <VolumeX className="w-3.5 h-3.5 text-[#f87171]" />}
              <span>Âm thanh: {soundEnabled ? 'Bật' : 'Tắt'}</span>
            </button>
            <span>•</span>
            <span>v1.6</span>
          </div>
        </footer>

        {/* Modal: Nhập mã phòng để vào bàn */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 bg-[#0f1713]/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-[#1b2620] border-2 border-[#2b3a32] rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setShowJoinModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-[#141e18] text-[#94a3b8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#14291e] border border-[#234533] flex items-center justify-center text-2xl mx-auto mb-2">
                  🔑
                </div>
                <h3 className="text-lg font-heading font-black text-[#f8fafc]">
                  Vào Phòng Bạn Bè
                </h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Nhập mã phòng (ví dụ: CM8899) để tham gia sảnh chờ
                </p>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <input
                  type="text"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value)}
                  placeholder="Ví dụ: CM1616..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#141e18] border-2 border-[#2b3a32] text-center font-heading font-black text-lg text-[#86efac] tracking-widest uppercase focus:outline-none focus:border-[#86efac]"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full btn-squish-green font-heading font-black text-xs uppercase tracking-wider shadow"
                >
                  VÀO BÀN NGAY
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Luật Chơi Chi Tiết */}
        {showRulesModal && (
          <div className="fixed inset-0 z-50 bg-[#0f1713]/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
            <div className="max-w-xl w-full bg-[#1b2620] border-2 border-[#2b3a32] rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowRulesModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-[#141e18] text-[#94a3b8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center mb-4">
                <span className="text-3xl inline-block mb-1">📜</span>
                <h3 className="text-xl font-heading font-black text-[#f8fafc]">
                  Luật Chơi Tiến Lên Checkmate 16
                </h3>
                <p className="text-xs text-[#86efac]">
                  Phong cách Cyberpunk Party Game độc đáo
                </p>
              </div>

              <div className="space-y-3.5 text-xs text-[#cbd5e1] leading-relaxed">
                <div className="p-3 rounded-2xl bg-[#141e18] border border-[#233329]">
                  <div className="font-heading font-black text-sm text-[#fde047] mb-1 flex items-center gap-1.5">
                    <span>👑 1. Luật Checkmate 16 Điểm</span>
                  </div>
                  <p>Mỗi ván bài kết thúc: Top 1 (+4đ), Top 2 (+2đ), Top 3 (+1đ), Top 4 (0đ). Khi có người đạt <strong>≥ 16 điểm</strong>, ván đấu bước vào trạng thái <strong>MATCH POINT</strong>. Trận đấu chỉ kết thúc khi một người ≥ 16 điểm giành chiến thắng <strong>Top 1</strong>!</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#141e18] border border-[#233329]">
                  <div className="font-heading font-black text-sm text-[#f87171] mb-1 flex items-center gap-1.5">
                    <span>⚡ 2. Luật Cân Bằng 12 Điểm (Đánh Chay)</span>
                  </div>
                  <p>Khi người chơi đạt <strong>≥ 12 điểm</strong>: Toàn bộ Lõi tích lũy sẽ bị tước sạch, từ đó về sau không được chọn Lõi nữa mà phải đánh chay để người khác có cơ hội lội ngược dòng.</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#141e18] border border-[#233329]">
                  <div className="font-heading font-black text-sm text-[#86efac] mb-1 flex items-center gap-1.5">
                    <span>🐷 3. Quy Tắc Chặt Heo Chuẩn</span>
                  </div>
                  <p>Heo lớn đè Heo nhỏ là nước đi bình thường (không tính chặt). <strong>Chặt Heo</strong> chỉ xảy ra khi dùng <strong>3 Đôi Thông</strong>, <strong>Tứ Quý</strong> hoặc <strong>4 Đôi Thông</strong> chặt Heo và cướp điểm trực tiếp!</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#141e18] border border-[#233329]">
                  <div className="font-heading font-black text-sm text-[#38bdf8] mb-1 flex items-center gap-1.5">
                    <span>🍀 4. Bùa Phép Màu (Lõi Augment)</span>
                  </div>
                  <p>Sau khi chia bài mỗi round, người chơi được chọn 1 trong 3 Bùa (Tên lửa về nhất, Thợ săn heo, Khiên bong bóng...). Bạn có thể xem trước 13 lá bài của mình để chọn Bùa tối ưu!</p>
                </div>
              </div>

              <div className="mt-5 text-center">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="px-8 py-2.5 rounded-full btn-squish-green font-heading font-black text-xs uppercase tracking-wider"
                >
                  ĐÃ HIỂU LUẬT CHƠI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Modal */}
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
              handleStartBotGame();
            }}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: MAIN GAME ARENA (Bàn đấu bài)
  // -------------------------------------------------------------
  // Xoay mảng người chơi theo chiều ngược kim đồng hồ chuẩn Tiến Lên Miền Nam:
  // Mình (Dưới) -> Người bên Phải (đi sau mình) -> Người đối diện (Top) -> Người bên Trái (đi trước mình)
  const myPlayerId = getPlayerId();
  const myIndex = gameState.players.findIndex((p) => p.id === myPlayerId);
  const activeMyIndex = myIndex !== -1 ? myIndex : 0;
  const numPlayers = gameState.players.length;

  const rightOpponent = numPlayers > 1 ? gameState.players[(activeMyIndex + 1) % numPlayers] : gameState.players[0];
  const topOpponent = numPlayers > 2 ? gameState.players[(activeMyIndex + 2) % numPlayers] : gameState.players[0];
  const leftOpponent = numPlayers > 3 ? gameState.players[(activeMyIndex + 3) % numPlayers] : gameState.players[0];

  return (
    <div className="min-h-screen bg-[#161c18] text-[#f1f5f9] flex flex-col justify-between select-none overflow-x-hidden">
      {/* Top Arena Header */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 border-b border-[#243128] bg-[#121814]/90 backdrop-blur-md flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeaveRoom}
            className="px-3.5 py-1.5 rounded-full bg-[#202b23] border border-[#2d3d32] text-xs font-bold text-[#cbd5e1] hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sảnh</span>
          </button>
          <div>
            <div className="font-heading font-black text-sm sm:text-base text-[#f8fafc]">
              CHECKMATE 16
            </div>
            <div className="text-[10px] text-[#94a3b8]">
              PHÒNG #{gameState.roomCode}
            </div>
          </div>
        </div>

        {/* Center Round Badge */}
        <div className="px-4 py-1 rounded-full bg-[#1e2a22] border border-[#2c3d32] text-xs font-black text-[#86efac] flex items-center gap-2">
          <span>VÁN 0{gameState.roundNumber} / ĐUA 16 ĐIỂM</span>
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-full bg-[#202b23] border border-[#2d3d32] text-[#cbd5e1] hover:text-white transition"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#86efac]" /> : <VolumeX className="w-4 h-4 text-[#f87171]" />}
          </button>
          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 rounded-full bg-[#202b23] border border-[#2d3d32] text-[#cbd5e1] hover:text-white transition"
            title="Xem luật chơi"
          >
            <HelpCircle className="w-4 h-4 text-[#fde047]" />
          </button>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 rounded-full bg-[#202b23] border border-[#2d3d32] text-[#cbd5e1] hover:text-white transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* More Menu Dropdown */}
          {showMoreMenu && (
            <div className="absolute right-0 top-11 bg-[#1b2620] border border-[#2d3d32] rounded-2xl shadow-2xl p-2 w-48 z-50 text-xs space-y-1">
              <button
                onClick={() => { setShowRulesModal(true); setShowMoreMenu(false); }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#233529] text-[#cbd5e1] flex items-center gap-2 font-bold"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#fde047]" />
                <span>Xem luật chơi</span>
              </button>
              <button
                onClick={() => { handleStartBotGame(); setShowMoreMenu(false); }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#233529] text-[#86efac] flex items-center gap-2 font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Chơi lại ván mới</span>
              </button>
              <button
                onClick={handleLeaveRoom}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#450a0a] text-[#fca5a5] flex items-center gap-2 font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Rời phòng về sảnh</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Checkmate HUD Track */}
      <div className="w-full px-4 pt-2">
        <CheckmateTrack
          players={gameState.players}
          currentTurnPlayerId={gameState.currentTurnPlayerId}
        />
      </div>

      {/* Main Oval Table Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-2 sm:p-4 flex flex-col justify-center relative">
        <div className="relative w-full h-[280px] sm:h-[340px] rounded-[100px] sm:rounded-[160px] felt-table felt-table-inner-stitch flex items-center justify-between px-6 sm:px-14">
          {/* Top Seat: Bắp Rang */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <PlayerSeat
              player={topOpponent}
              isCurrentTurn={gameState.currentTurnPlayerId === topOpponent.id}
              position="top"
            />
          </div>

          {/* Left Seat */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <PlayerSeat
              player={leftOpponent}
              isCurrentTurn={gameState.currentTurnPlayerId === leftOpponent.id}
              position="left"
              lastActionText={leftOpponent.hasPassed ? 'Đã bỏ lượt' : undefined}
            />
          </div>

          {/* Center Table Trick Pile & Alert Toast */}
          <div className="flex-1 flex flex-col items-center justify-center pointer-events-none z-10 px-4">
            {gameState.lastValidMove ? (
              <div className="flex flex-col items-center">
                <div className="flex -space-x-4 sm:-space-x-5 justify-center drop-shadow-xl animate-fade-in">
                  {gameState.lastValidMove.cards.map((c) => (
                    <CardView key={c.id} card={c} small={false} />
                  ))}
                </div>
                <span className="mt-2 text-xs font-bold text-[#fef08a] bg-[#14261d]/90 px-3 py-0.5 rounded-full border border-[#2b513d]">
                  {gameState.lastValidMove.combo.type} · {gameState.lastValidMove.playerName}
                </span>
              </div>
            ) : (
              <div className="text-xs font-bold text-[#86efac]/80 uppercase tracking-widest bg-[#12241b]/80 px-4 py-1.5 rounded-full border border-[#234533]">
                ✦ BÀN TRỐNG · BẮT ĐẦU VÒNG ĐÁNH MỚI ✦
              </div>
            )}

            {/* Chặt Heo Notification Toast */}
            {gameState.pointEvents.length > 0 && (
              <div className="mt-3 px-4 py-2 rounded-2xl bg-[#fef08a] border-2 border-[#fde047] text-[#78350f] shadow-xl flex items-center gap-2 animate-bounce">
                <span className="text-xl">🐷</span>
                <div>
                  <div className="text-xs font-black uppercase">CHẶT HEO!</div>
                  <div className="text-[10px] font-bold">
                    {gameState.pointEvents[gameState.pointEvents.length - 1].message}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Seat */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <PlayerSeat
              player={rightOpponent}
              isCurrentTurn={gameState.currentTurnPlayerId === rightOpponent.id}
              position="right"
              lastActionText={rightOpponent.hasPassed ? 'Đã bỏ lượt' : undefined}
            />
          </div>
        </div>
      </div>

      {/* 🌟 TẦNG ĐIỀU KHIỂN & TAY BÀI CỦA NGƯỜI CHƠI */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col items-center gap-1 z-30 pb-3 px-2">
        {actionError && (
          <div className="text-xs font-bold text-[#f87171] bg-[#450a0a]/90 border border-[#ef4444] px-4 py-1 rounded-full shadow animate-shake mb-1">
            ⚠️ {actionError}
          </div>
        )}

        {/* 1. HÀNG BÀI 13 LÁ - Căn giữa trọn vẹn, không scrollbar */}
        {humanPlayer && (
          <div className="w-full flex justify-center -space-x-4 sm:-space-x-5 pt-8 pb-1 px-4 overflow-visible">
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

        {/* 2. THANH THÔNG TIN VÀ NÚT ĐÁNH */}
        <div className="w-full flex items-center justify-between gap-4 mt-2 px-2 sm:px-6">
          {humanPlayer && (
            <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-[#1b2721] border-2 border-[#86efac] shadow-lg">
              <CuteAvatar type={humanPlayer.name} size="md" />
              <div>
                <div className="font-heading font-black text-xs sm:text-sm text-[#f8fafc] leading-tight">
                  {humanPlayer.name}
                </div>
                <div className="text-[11px] font-bold text-[#86efac]">
                  {humanPlayer.totalPoints} điểm
                </div>
              </div>

              {humanPlayer.activeAugments && humanPlayer.activeAugments.length > 0 && (
                <div className="flex items-center gap-1 pl-1 border-l border-[#2e4235]">
                  {humanPlayer.activeAugments.map((a, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full bg-[#163827] border border-[#86efac] flex items-center justify-center text-xs shadow cursor-pointer"
                      title={`${a.augment.name}: ${a.augment.description} (còn ${a.roundsRemaining} ván)`}
                    >
                      <span>
                        {a.augment.name.toLowerCase().includes('về nhất')
                          ? '🚀'
                          : a.augment.name.toLowerCase().includes('săn')
                          ? '🐷'
                          : a.augment.name.toLowerCase().includes('khiên')
                          ? '🛡️'
                          : '⚡'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {humanPlayer.totalPoints >= 12 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#f87171]/20 text-[#fca5a5] font-bold border border-[#f87171]/40">
                  Đánh chay
                </span>
              )}
            </div>
          )}

          {/* Center / Right: Action Buttons Row */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút Bỏ chọn bài nếu có bài đang chọn */}
            {selectedCardIds.length > 0 && (
              <button
                onClick={() => setSelectedCardIds([])}
                className="px-3 py-2 rounded-full bg-[#202b23] border border-[#2d3d32] text-xs font-bold text-[#94a3b8] hover:text-white transition"
                title="Hủy chọn tất cả lá bài"
              >
                HỦY ({selectedCardIds.length})
              </button>
            )}

            <button
              onClick={handlePassTurn}
              disabled={!isHumanTurn || !gameState.lastValidMove}
              className={`px-5 py-2.5 rounded-full font-heading font-black text-xs uppercase tracking-wider ${
                isHumanTurn && gameState.lastValidMove
                  ? 'btn-squish-gray'
                  : 'bg-[#242f29] text-[#64748b] cursor-not-allowed'
              }`}
            >
              BỎ LƯỢT
            </button>

            <button
              onClick={handlePlayCards}
              disabled={!isHumanTurn || selectedCardIds.length === 0}
              className={`px-7 py-2.5 rounded-full font-heading font-black text-xs sm:text-sm uppercase tracking-wider ${
                isHumanTurn && selectedCardIds.length > 0
                  ? 'btn-squish-green'
                  : 'bg-[#242f29] text-[#64748b] cursor-not-allowed'
              }`}
            >
              ĐÁNH BÀI {selectedCardIds.length > 0 && `(${selectedCardIds.length})`}
            </button>

            <div className="flex items-center gap-1.5 pl-1">
              <div className="w-9 h-9 rounded-full bg-[#1b251f] border-2 border-[#fde047] flex items-center justify-center font-heading font-black text-xs text-[#fde047] shadow">
                15s
              </div>
              {isHumanTurn && (
                <span className="text-[10px] font-bold text-[#86efac] hidden md:inline">
                  Đến lượt của bạn!
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-[#64748b] mt-0.5">
          Enter để đánh • Space để bỏ lượt
        </div>
      </footer>

      {/* Modals */}
      {gameState.phase === 'AUGMENT_SELECT' &&
        humanPlayer &&
        gameState.augmentChoices[humanPlayer.id] && (
          <AugmentModal
            augments={gameState.augmentChoices[humanPlayer.id]}
            hand={humanPlayer.hand}
            rerolledSlots={gameState.rerolledSlots?.[humanPlayer.id] || [false, false, false]}
            onSelect={handleAugmentSelect}
            onRerollSlot={handleRerollAugmentSlot}
          />
        )}

      {gameState.phase === 'ROUND_END' && (
        <RoundSummaryModal state={gameState} onNextRound={handleNextRound} />
      )}

      {gameState.phase === 'MATCH_OVER' && (
        <VictoryModal
          state={gameState}
          onRestart={handleStartBotGame}
          onGoLobby={handleLeaveRoom}
        />
      )}
    </div>
  );
};
