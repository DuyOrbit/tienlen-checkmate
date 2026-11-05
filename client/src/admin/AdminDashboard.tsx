import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config.js';
import { Shield, Users, Trophy, Ban, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { CuteAvatar } from '../components/CuteAvatar.js';

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
        setMsg(`Đã ${!user.isBanned ? 'khóa' : 'mở khóa'} tài khoản [${user.username}]`);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRole = async (user: UserRecord) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        setMsg(`Đã đổi quyền [${user.username}] thành ${nextRole}`);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#161c18] text-[#f1f5f9] p-4 sm:p-8 select-none">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-[#243328] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-full bg-[#202b23] border border-[#2d3d32] text-xs font-bold text-[#cbd5e1] hover:text-white transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Game</span>
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#fde047]" />
              <h1 className="text-xl sm:text-2xl font-heading font-black text-[#f8fafc]">
                Bảng Quản Trị Hệ Thống
              </h1>
            </div>
          </div>

          <button
            onClick={loadData}
            className="p-2.5 rounded-full btn-squish-gray flex items-center justify-center"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {msg && (
          <div className="p-3 rounded-2xl bg-[#14291e] border border-[#234533] text-xs font-bold text-[#86efac] flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="text-xs hover:underline">
              Đóng
            </button>
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-[#1c2721] border border-[#2b3a32] p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#86efac]" />
              <span className="text-xs font-bold text-[#94a3b8] uppercase">TỔNG NGƯỜI DÙNG</span>
            </div>
            <div className="text-3xl font-heading font-black text-[#f8fafc]">
              {stats?.totalUsers ?? users.length}
            </div>
          </div>

          <div className="rounded-3xl bg-[#1c2721] border border-[#2b3a32] p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-[#fde047]" />
              <span className="text-xs font-bold text-[#94a3b8] uppercase">VÁN ĐÃ ĐẤU</span>
            </div>
            <div className="text-3xl font-heading font-black text-[#fde047]">
              {stats?.totalMatches ?? 0}
            </div>
          </div>

          <div className="rounded-3xl bg-[#1c2721] border border-[#2b3a32] p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Ban className="w-5 h-5 text-[#f87171]" />
              <span className="text-xs font-bold text-[#94a3b8] uppercase">ĐANG BỊ KHÓA</span>
            </div>
            <div className="text-3xl font-heading font-black text-[#f87171]">
              {stats?.bannedUsers ?? users.filter((u) => u.isBanned).length}
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="rounded-3xl bg-[#1c2721] border border-[#2b3a32] overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-[#243328] flex items-center justify-between">
            <h2 className="text-base font-heading font-black text-[#f8fafc]">
              Danh Sách Tài Khoản
            </h2>
            <span className="text-xs text-[#94a3b8]">{users.length} người dùng</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141e18] text-[#94a3b8] uppercase font-bold border-b border-[#243328]">
                <tr>
                  <th className="p-3 sm:p-4">Người dùng</th>
                  <th className="p-3 sm:p-4">Quyền</th>
                  <th className="p-3 sm:p-4">Trận đã đấu</th>
                  <th className="p-3 sm:p-4">Checkmate Thắng</th>
                  <th className="p-3 sm:p-4">Trạng thái</th>
                  <th className="p-3 sm:p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243328]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1f2d24] transition">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2.5">
                        <CuteAvatar type={u.username} size="sm" />
                        <div>
                          <div className="font-bold text-[#f8fafc] text-sm">{u.username}</div>
                          <div className="text-[10px] text-[#64748b]">{u.email || 'Không có email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          u.role === 'ADMIN'
                            ? 'bg-[#78350f] text-[#fde047] border border-[#b45309]'
                            : 'bg-[#141e18] text-[#94a3b8] border border-[#233128]'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-sm font-bold text-[#cbd5e1]">
                      {u.stats?.matchesPlayed ?? 0}
                    </td>
                    <td className="p-3 sm:p-4 text-sm font-bold text-[#fde047]">
                      {u.stats?.checkmateWins ?? 0}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          u.isBanned
                            ? 'bg-[#450a0a] text-[#fca5a5] border border-[#ef4444]'
                            : 'bg-[#14291e] text-[#86efac] border border-[#234533]'
                        }`}
                      >
                        {u.isBanned ? 'ĐÃ KHÓA' : 'HOẠT ĐỘNG'}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className="px-2.5 py-1 rounded-full bg-[#202b23] border border-[#2d3d32] text-[10px] font-bold text-[#cbd5e1] hover:text-white transition"
                        >
                          {u.role === 'ADMIN' ? 'Hạ Quyền' : 'Thăng Admin'}
                        </button>
                        <button
                          onClick={() => handleToggleBan(u)}
                          className={`px-2.5 py-1 rounded-full border text-[10px] font-bold transition ${
                            u.isBanned
                              ? 'bg-[#14291e] border-[#234533] text-[#86efac] hover:bg-[#1e3d2c]'
                              : 'bg-[#450a0a] border-[#ef4444] text-[#fca5a5] hover:bg-[#5f1010]'
                          }`}
                        >
                          {u.isBanned ? 'Mở Khóa' : 'Khóa Nick'}
                        </button>
                      </div>
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
