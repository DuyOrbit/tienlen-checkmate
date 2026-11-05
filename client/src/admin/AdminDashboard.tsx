import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config.js';
import { Shield, Users, Trophy, Ban, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface UserRecord {
  id: string;
  username: string;
  email: string | null;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  createdAt: string;
  stats?: {
    matchesPlayed: number;
    checkmateWins: number;
    totalPoints: number;
  };
}

interface AdminDashboardProps {
  token: string;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onBack }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.ok && statsRes.ok) {
        const usersData = await usersRes.json();
        const statsData = await statsRes.json();
        setUsers(usersData.users || []);
        setStats(statsData);
      }
    } catch (e: any) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleToggleBan = async (user: UserRecord) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/ban`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isBanned: !user.isBanned }),
      });
      if (res.ok) {
        setMsg(`Cập nhật trạng thái khóa tài khoản ${user.username} thành công!`);
        loadData();
      }
    } catch (e: any) {
      alert('Lỗi cập nhật');
    }
  };

  const handleToggleRole = async (user: UserRecord) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Bạn có chắc muốn đổi quyền của ${user.username} thành ${newRole}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMsg(`Đã đổi quyền của ${user.username} thành ${newRole}!`);
        loadData();
      }
    } catch (e: any) {
      alert('Lỗi đổi quyền');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 transition"
            >
              <ArrowLeft className="w-5 h-5 text-cyan-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-400" />
                <h1 className="text-xl sm:text-2xl font-cyber font-black text-slate-100">
                  ADMIN COCKPIT (MYSQL QUẢN TRỊ)
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Quản lý người dùng, phân quyền RBAC và theo dõi dữ liệu MySQL WampServer
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-cyber hover:border-cyan-400 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>LÀM MỚI</span>
          </button>
        </div>

        {msg && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 text-xs flex justify-between items-center">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-cyber text-slate-400 uppercase">Tổng Người Dùng</div>
                <div className="text-xl font-cyber font-bold text-slate-100">{stats.totalUsers}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-cyber text-slate-400 uppercase">Trận Đấu Đã Lưu</div>
                <div className="text-xl font-cyber font-bold text-slate-100">{stats.totalMatches}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-cyber text-slate-400 uppercase">Tài Khoản Bị Khóa</div>
                <div className="text-xl font-cyber font-bold text-rose-400">{stats.bannedUsers}</div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="font-cyber font-bold text-sm uppercase text-slate-200">
              DANH SÁCH NGƯỜI DÙNG TRONG MYSQL
            </h2>
            <span className="text-xs text-slate-400 font-mono">Bảng: users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-cyber uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Tài Khoản</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Quyền (Role)</th>
                  <th className="p-3">Thắng Checkmate</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-cyber font-bold text-slate-200">{u.username}</td>
                    <td className="p-3 text-slate-400">{u.email || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-cyber font-bold border ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-cyber text-cyan-400">
                      {u.stats?.checkmateWins || 0} trận ({u.stats?.totalPoints || 0}đ)
                    </td>
                    <td className="p-3">
                      {u.isBanned ? (
                        <span className="text-rose-400 flex items-center gap-1 font-cyber text-[10px]">
                          <Ban className="w-3 h-3" /> ĐÃ KHÓA
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 font-cyber text-[10px]">
                          <CheckCircle className="w-3 h-3" /> HOẠT ĐỘNG
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleRole(u)}
                        className="px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-cyber text-slate-300 hover:border-cyan-400 hover:text-cyan-400 transition"
                      >
                        Đổi Role
                      </button>
                      <button
                        onClick={() => handleToggleBan(u)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-cyber transition ${
                          u.isBanned
                            ? 'border-emerald-500/50 text-emerald-300 hover:bg-emerald-950'
                            : 'border-rose-500/50 text-rose-300 hover:bg-rose-950'
                        }`}
                      >
                        {u.isBanned ? 'Mở Khóa' : 'Khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

