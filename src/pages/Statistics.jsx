import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Statistics = () => {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [periodGroup, setPeriodGroup] = useState('week');
  
  const [overview, setOverview] = useState({ total: 0, approved: 0, rejected: 0, cancelled: 0 });
  const [roomStats, setRoomStats] = useState([]);
  const [trendStats, setTrendStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Mocking API requests for these statistics
      const [overviewRes, byRoomRes, byPeriodRes] = await Promise.all([
        api.get('/api/stats/overview', { params: { from: fromDate, to: toDate } }).catch(() => ({ data: { total: 0, approved: 0, rejected: 0, cancelled: 0 } })),
        api.get('/api/stats/by-room', { params: { from: fromDate, to: toDate } }).catch(() => ({ data: [] })),
        api.get('/api/stats/by-period', { params: { group: periodGroup, from: fromDate, to: toDate } }).catch(() => ({ data: [] }))
      ]);

      setOverview(overviewRes.data || { total: 0, approved: 0, rejected: 0, cancelled: 0 });
      setRoomStats(byRoomRes.data || []);
      setTrendStats(byPeriodRes.data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fromDate, toDate, periodGroup]);

  // Max value for bar chart scaling
  const maxRoomRequests = Math.max(...roomStats.map(r => r.total || 0), 1);
  const maxTrendRequests = Math.max(...trendStats.map(t => t.count || 0), 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-serif">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-paper-1)] border border-[var(--rule-hair)] text-xs font-mono text-[var(--color-ink-1)] mb-2">
            <span>BÁO CÁO &amp; PHÂN TÍCH DỮ LIỆU · HUST SINCE 1956</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
            Thống kê sử dụng giảng đường <span className="text-[var(--color-accent)]">HUST</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Báo cáo tần suất mượn, tỷ lệ phê duyệt và xu hướng sử dụng phòng học toàn trường
          </p>
        </div>

        {/* Date Filters */}
        <div className="glass-card p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3 font-sans">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">Từ ngày:</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)} 
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 text-xs bg-slate-50/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary-600" 
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">Đến ngày:</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 text-xs bg-slate-50/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary-600" 
            />
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-luxury relative overflow-hidden luxury-card-rim">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Tổng lượt mượn</p>
          <p className="text-3xl font-black text-primary-600 dark:text-primary-400 mt-1 font-mono">{overview.total}</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-luxury relative overflow-hidden luxury-card-rim">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Đã phê duyệt</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{overview.approved}</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-luxury relative overflow-hidden luxury-card-rim">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Từ chối</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">{overview.rejected}</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-luxury relative overflow-hidden luxury-card-rim">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Đã hủy</p>
          <p className="text-3xl font-black text-slate-500 dark:text-slate-400 mt-1 font-mono">{overview.cancelled}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Room */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury relative overflow-hidden luxury-card-rim">
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-4 tracking-tight font-header">
            Tần suất sử dụng theo giảng đường
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] font-black font-mono">
                <tr>
                  <th className="pb-3">Giảng đường</th>
                  <th className="pb-3">Số lượt</th>
                  <th className="pb-3 text-right">Tỷ lệ duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {roomStats.map((room, idx) => {
                  const percent = room.total ? Math.round((room.approved / room.total) * 100) : 0;
                  const width = `${(room.total / maxRoomRequests) * 100}%`;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-bold text-slate-800 dark:text-slate-200 font-serif">{room.room_name}</td>
                      <td className="py-3 font-mono">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 text-right font-black text-slate-700 dark:text-slate-300">{room.total}</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                            <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-rose-400 h-full rounded-full transition-all duration-500" style={{ width }} title={`Tổng: ${room.total}`}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${percent >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' : percent >= 50 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'}`}>
                          {percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {roomStats.length === 0 && (
                  <tr><td colSpan="3" className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Usage Trend */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight font-header">
              Xu hướng mượn phòng học
            </h2>
            <select 
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600 font-sans"
              value={periodGroup}
              onChange={e => setPeriodGroup(e.target.value)}
            >
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          </div>
          
          <div className="h-60 flex items-end justify-between space-x-2 mt-6 pb-2">
            {trendStats.map((stat, idx) => {
              const height = `${Math.max((stat.count / maxTrendRequests) * 100, 8)}%`;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="relative flex justify-center w-full h-full items-end">
                    <span className="absolute -top-6 text-[10px] font-black text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-xs border border-slate-200 dark:border-slate-700 font-mono">
                      {stat.count}
                    </span>
                    <div 
                      className="w-full bg-gradient-to-t from-primary-700 via-primary-600 to-rose-400 hover:from-primary-600 hover:to-rose-300 rounded-t-xl transition-all shadow-md shadow-primary-600/25"
                      style={{ height, maxWidth: '36px' }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 truncate w-full text-center font-mono" title={stat.label}>
                    {stat.label}
                  </span>
                </div>
              );
            })}
            {trendStats.length === 0 && (
              <div className="w-full text-center text-slate-400 dark:text-slate-500 my-auto font-sans">Chưa có dữ liệu thống kê</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
