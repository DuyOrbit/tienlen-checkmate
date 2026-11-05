import React, { useState } from 'react';
import { AuthUser } from '../types.js';
import { API_BASE } from '../config.js';
import { User, Lock, Mail, Play, Shield } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: AuthUser, token: string) => void;
  onPlayAsGuest: (guestName: string) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onPlayAsGuest, onClose }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'guest'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [guestName, setGuestName] = useState('CyberGuest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'guest') {
      if (!guestName.trim()) {
        setError('Vui lòng nhập tên hiển thị');
        return;
      }
      onPlayAsGuest(guestName.trim());
      return;
    }

    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ...(tab === 'register' ? { email } : {}) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thao tác không thành công');
      }

      localStorage.setItem('tienlen_token', data.token);
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-neon-cyan relative">
        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 pb-3 mb-5">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 pb-2 font-cyber text-xs uppercase tracking-wider text-center border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 pb-2 font-cyber text-xs uppercase tracking-wider text-center border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng Ký
          </button>
          <button
            onClick={() => { setTab('guest'); setError(''); }}
            className={`flex-1 pb-2 font-cyber text-xs uppercase tracking-wider text-center border-b-2 transition-colors ${
              tab === 'guest'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Chơi Thử (Khách)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'guest' ? (
            <div>
              <label className="block text-xs font-cyber text-slate-400 mb-1">
                TÊN HIỂN THỊ CỦA BẠN
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nhập tên..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Chế độ khách cho phép chơi nhanh với Bot mà không lưu điểm vào MySQL Database.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-cyber text-slate-400 mb-1">
                  TÊN ĐĂNG NHẬP
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tên tài khoản (ví dụ: admin)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-cyber text-slate-400 mb-1">
                    EMAIL (TÙY CHỌN)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-cyber text-slate-400 mb-1">
                  MẬT KHẨU
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {tab === 'login' && (
                <div className="text-[11px] text-slate-400">
                  Tài khoản Admin mặc định hệ thống: <span className="text-cyan-400 font-mono">admin / admin123</span>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-cyber text-xs hover:bg-slate-800 transition"
            >
              HỦY
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 shadow-neon-cyan transition"
            >
              {loading ? 'ĐANG XỬ LÝ...' : tab === 'login' ? 'ĐĂNG NHẬP' : tab === 'register' ? 'TẠO TÀI KHOẢN' : 'VÀO BÀN CHƠI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

