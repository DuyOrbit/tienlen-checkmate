import React, { useState } from 'react';
import { AuthUser } from '../types.js';
import { API_BASE } from '../config.js';
import { User, Lock, Mail, Play, Shield, X } from 'lucide-react';
import { CuteAvatar } from '../components/CuteAvatar.js';

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
  const [guestName, setGuestName] = useState('Mèo Mập');
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

      sessionStorage.setItem('tienlen_token', data.token);
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1713]/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-[#1b2620] border-2 border-[#2b3a32] rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-[#141e18] text-[#94a3b8] hover:text-[#f8fafc] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <CuteAvatar type={username || guestName || 'cat'} size="lg" />
          </div>
          <h2 className="text-2xl font-heading font-black text-[#f8fafc]">
            {tab === 'login'
              ? 'Chào Mừng Trở Lại!'
              : tab === 'register'
              ? 'Tạo Tài Khoản Mới'
              : 'Chơi Nhanh Với Tên Tùy Chọn'}
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Đăng nhập để lưu tiến trình điểm & leo Bảng Vàng Checkmate
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#121915] p-1 rounded-2xl mb-5 border border-[#233128]">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 font-heading font-black text-xs uppercase tracking-wider text-center rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-[#86efac] text-[#143522] shadow'
                : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 font-heading font-black text-xs uppercase tracking-wider text-center rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-[#86efac] text-[#143522] shadow'
                : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            Đăng Ký
          </button>
          <button
            onClick={() => { setTab('guest'); setError(''); }}
            className={`flex-1 py-2 font-heading font-black text-xs uppercase tracking-wider text-center rounded-xl transition-all ${
              tab === 'guest'
                ? 'bg-[#86efac] text-[#143522] shadow'
                : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            Chơi Thử
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#450a0a]/80 border border-[#ef4444] text-[#fca5a5] text-xs font-bold text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'guest' ? (
            <div>
              <label className="block text-xs font-bold text-[#cbd5e1] mb-1">
                Tên hiển thị của bạn
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ví dụ: Mèo Mập, Cáo Nhỏ..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#141e18] border border-[#243328] text-sm text-[#f8fafc] focus:outline-none focus:border-[#86efac] transition"
                  required
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-[#cbd5e1] mb-1">
                  Tên tài khoản
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập username..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#141e18] border border-[#243328] text-sm text-[#f8fafc] focus:outline-none focus:border-[#86efac] transition"
                    required
                  />
                </div>
              </div>

              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-[#cbd5e1] mb-1">
                    Email (Tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#141e18] border border-[#243328] text-sm text-[#f8fafc] focus:outline-none focus:border-[#86efac] transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#cbd5e1] mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#141e18] border border-[#243328] text-sm text-[#f8fafc] focus:outline-none focus:border-[#86efac] transition"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-full btn-squish-green font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : tab === 'login' ? (
              <span>ĐĂNG NHẬP NGAY</span>
            ) : tab === 'register' ? (
              <span>TẠO TÀI KHOẢN</span>
            ) : (
              <span>VÀO BÀN CHƠI THỬ</span>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-[11px] text-[#64748b]">
            Tài khoản Admin mặc định: <strong>admin</strong> / <strong>admin123</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
