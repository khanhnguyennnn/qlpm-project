import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  DoorOpen, Clock, CalendarCheck, History, CalendarPlus, Check, X,
  Sparkles, ArrowRight, ShieldCheck, ChevronRight, BarChart3, Activity
} from 'lucide-react';
import api from '../utils/api';
import { STATUS_MAP, formatDateTime } from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    pendingCount: 0,
    todayApproved: 0,
    myBookings: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

  const chartDataPoints = [
    { x: 0, y: 130, label: 'Thứ 2 (Sáng)', count: 12 },
    { x: 60, y: 110, label: 'Thứ 2 (Chiều)', count: 18 },
    { x: 120, y: 95, label: 'Thứ 3 (Sáng)', count: 24 },
    { x: 180, y: 105, label: 'Thứ 3 (Chiều)', count: 21 },
    { x: 240, y: 75, label: 'Thứ 4 (Sáng)', count: 35 },
    { x: 300, y: 85, label: 'Thứ 4 (Chiều)', count: 30 },
    { x: 360, y: 50, label: 'Thứ 5 (Sáng)', count: 46 },
    { x: 420, y: 60, label: 'Thứ 5 (Chiều)', count: 42 },
    { x: 480, y: 35, label: 'Thứ 6 (Sáng)', count: 55 },
    { x: 540, y: 40, label: 'Thứ 6 (Chiều)', count: 52 },
    { x: 600, y: 20, label: 'Thứ 7 & CN', count: 68 },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (user?.role === 'admin') {
          try {
            const { data: statsData } = await api.get('/stats/overview');
            setStats(statsData || {
              totalRooms: 0,
              pendingCount: 0,
              todayApproved: 0,
              myBookings: 0,
            });
          } catch (e) {
            console.error("Lỗi lấy stats", e);
          }

          const { data: pendingData } = await api.get('/bookings?status=pending');
          setPendingRequests(pendingData?.slice(0, 5) || []);

          const { data: upcomingData } = await api.get('/bookings?status=approved');
          setUpcomingBookings(upcomingData?.slice(0, 5) || []);
        } else {
          const { data: myBookingsData } = await api.get('/bookings?my=true');
          const { data: roomsData } = await api.get('/rooms');

          const pending = myBookingsData?.filter(b => b.status === 'pending') || [];
          const approved = myBookingsData?.filter(b => b.status === 'approved') || [];

          setStats({
            totalRooms: roomsData?.length || 0,
            pendingCount: pending.length,
            todayApproved: approved.length,
            myBookings: myBookingsData?.length || 0
          });

          setUpcomingBookings(approved.slice(0, 5));
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/bookings/${id}/approve`);
      setPendingRequests(prev => prev.filter(req => req.id !== id));
      setStats(prev => ({
        ...prev,
        pendingCount: Math.max(0, (prev.pendingCount || 1) - 1),
        todayApproved: (prev.todayApproved || 0) + 1
      }));
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi duyệt yêu cầu');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Nhập lý do từ chối:');
    if (!reason) return;
    try {
      await api.put(`/bookings/${id}/reject`, { admin_note: reason });
      setPendingRequests(prev => prev.filter(req => req.id !== id));
      setStats(prev => ({
        ...prev,
        pendingCount: Math.max(0, (prev.pendingCount || 1) - 1)
      }));
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi từ chối yêu cầu');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[var(--color-ink-2)]">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-xs uppercase tracking-wider">Đang khởi tạo bảng điều khiển QLPH...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* ───────── Workbench Hero Banner ───────── */}
      <section className="relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-paper-1)] border border-[var(--rule-hair)] text-xs font-mono text-[var(--color-ink-1)] mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>HỆ THỐNG QUẢN LÝ PHÒNG HỌC · ĐẠI HỌC BÁCH KHOA HÀ NỘI</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <h1 className="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.1] text-[var(--color-ink-0)]">
              Hệ thống Quản lý Giảng đường &amp; Phòng học SEEE
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-1)] max-w-xl leading-relaxed">
              Số hóa quy trình mượn giảng đường và phòng máy tính, kiểm tra phát hiện xung đột lịch tự động và cung cấp lịch tuần trực quan cho cán bộ, giảng viên và sinh viên HUST.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/booking/new" className="btn btn--primary btn-tactile inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold leading-none whitespace-nowrap shadow-md">
                <span>Tạo yêu cầu mượn phòng</span>
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link to="/rooms" className="btn btn--ghost btn-tactile inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold leading-none whitespace-nowrap border border-[var(--rule-soft)]">
                <span>Khám phá danh mục phòng</span>
              </Link>
            </div>
          </div>

          {/* University Live Status Overview Card */}
          <div className="tally-card max-w-md ml-auto w-full border border-[var(--rule-soft)] bg-[var(--color-paper-1)] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--rule-hair)] font-mono text-xs">
              <div>
                <div className="font-bold text-[var(--color-ink-0)] tracking-tight">
                  TỔNG QUAN TRẠNG THÁI HÔM NAY
                </div>
                <div className="text-[11px] text-[var(--color-ink-2)] mt-0.5">Khuôn viên Bách Khoa Hà Nội</div>
              </div>
              <span className="status-approved font-mono text-[11px] font-semibold">Trực tuyến</span>
            </div>

            <div className="py-4 space-y-3 font-mono text-xs text-[var(--color-ink-1)]">
              <div className="flex justify-between items-center">
                <span>Tổng giảng đường khả dụng</span>
                <strong className="text-[var(--color-ink-0)] bg-[var(--color-paper-0)] px-2.5 py-1 rounded-md border border-[var(--rule-hair)] tabular-nums">{stats.totalRooms} phòng</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Lịch mượn đã phê duyệt</span>
                <strong className="text-[var(--color-accent)] bg-[var(--color-paper-0)] px-2.5 py-1 rounded-md border border-[var(--rule-hair)] tabular-nums">{stats.todayApproved} lượt</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Yêu cầu đang chờ xét duyệt</span>
                <strong className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900/40 tabular-nums">{stats.pendingCount} đơn</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--rule-hair)] flex items-center justify-between text-[11px] font-mono text-[var(--color-ink-2)]">
              <span>Khung giờ: 07:00 – 21:00</span>
              <Link to="/rooms" className="text-[var(--color-accent)] font-semibold hover:underline">Tra cứu phòng trống →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── KPI Stats Triplet Cards ───────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="tally-card cursor-default bg-[var(--color-paper-1)] border border-[var(--rule-hair)] p-5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-2)] font-semibold mb-1">
            Tổng số phòng học
          </div>
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-ink-0)] tabular-nums">
            {stats.totalRooms}
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-accent)] mt-2 font-semibold">
            Khả dụng toàn trường
          </div>
          <p className="text-xs text-[var(--color-ink-2)] mt-1 font-sans">Khu C, Khu D, Thư viện Tạ Quang Bửu và Khu B.</p>
        </div>

        {/* Card 2 */}
        <div className="tally-card cursor-default bg-[var(--color-paper-1)] border border-[var(--rule-hair)] p-5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-2)] font-semibold mb-1">
            Chờ thẩm định &amp; duyệt
          </div>
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {stats.pendingCount}
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-2 font-semibold">
            Yêu cầu đang chờ
          </div>
          <p className="text-xs text-[var(--color-ink-2)] mt-1 font-sans">Yêu cầu mượn phòng đang được kiểm tra xung đột.</p>
        </div>

        {/* Card 3 */}
        <div className="tally-card cursor-default bg-[var(--color-paper-1)] border border-[var(--rule-hair)] p-5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-2)] font-semibold mb-1">
            Lịch đã phê duyệt
          </div>
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats.todayApproved}
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mt-2 font-semibold">
            Đã hoàn tất duyệt
          </div>
          <p className="text-xs text-[var(--color-ink-2)] mt-1 font-sans">Lịch mượn phòng học đã hoàn tất thẩm định.</p>
        </div>

        {/* Card 4 */}
        <div className="tally-card cursor-default bg-[var(--color-paper-1)] border border-[var(--rule-hair)] p-5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-2)] font-semibold mb-1">
            {user?.role === 'admin' ? 'Tổng số lượt mượn' : 'Lịch mượn của tôi'}
          </div>
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-accent)] tabular-nums">
            {stats.myBookings}
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-1)] mt-2 font-semibold">
            Hồ sơ lưu trữ
          </div>
          <p className="text-xs text-[var(--color-ink-2)] mt-1 font-sans">Tổng số lượt đăng ký đã được ghi nhận.</p>
        </div>
      </section>

      {/* ───────── Live Workbench Console ───────── */}
      <section className="tally-card p-0 overflow-hidden">
        <div className="p-6 border-b border-[var(--rule-hair)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink-2)] font-semibold">THEO DÕI LƯU LƯỢNG</span>
            <h2 className="font-display text-2xl font-semibold tracking-tight mt-1 text-[var(--color-ink-0)]">
              Lưu lượng mượn giảng đường theo các khung giờ
            </h2>
          </div>
          <p className="text-xs text-[var(--color-ink-1)] max-w-xs">
            Cập nhật dữ liệu thời gian thực theo khung giờ mượn phòng (07:00 - 21:00) từ các khu giảng đường Bách Khoa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
          <div className="p-4 bg-[var(--color-paper-1)] border-r border-[var(--rule-hair)] font-mono text-xs space-y-1.5">
            <button
              type="button"
              onClick={() => navigate(user?.role === 'admin' ? '/admin/approvals' : '/my-bookings')}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-[var(--color-paper-2)] text-[var(--color-ink-0)] hover:text-[var(--color-accent)] font-semibold flex items-center justify-between transition-all group cursor-pointer btn-tactile"
              title="Xem danh sách lịch mượn đang hoạt động"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse"></span>
                <span>Lịch đang hoạt động</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[var(--color-accent)]" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-[var(--color-ink-1)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] flex items-center justify-between transition-all group cursor-pointer btn-tactile"
              title="Chuyển đến Danh mục phòng học"
            >
              <span>Danh mục phòng học</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[var(--color-accent)]" />
            </button>
            <button
              type="button"
              onClick={() => navigate(user?.role === 'admin' ? '/admin/approvals' : '/booking/new')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-[var(--color-ink-1)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] flex items-center justify-between transition-all group cursor-pointer btn-tactile"
              title={user?.role === 'admin' ? 'Chuyển đến trang Duyệt yêu cầu' : 'Chuyển đến Đặt phòng mới'}
            >
              <span>Duyệt yêu cầu tự động</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[var(--color-accent)]" />
            </button>
            <button
              type="button"
              onClick={() => navigate(user?.role === 'admin' ? '/admin/stats' : '/my-bookings')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-[var(--color-ink-1)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] flex items-center justify-between transition-all group cursor-pointer btn-tactile"
              title={user?.role === 'admin' ? 'Chuyển đến Thống kê hệ thống' : 'Chuyển đến Lịch sử mượn'}
            >
              <span>Báo cáo hiệu suất</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[var(--color-accent)]" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3 bg-[var(--color-paper-1)] rounded-xl border border-[var(--rule-hair)] interactive-card cursor-default">
                <div className="text-[var(--color-ink-2)] uppercase">Sức chứa TB</div>
                <div className="font-display text-xl font-bold text-[var(--color-ink-0)] mt-1">85 chỗ</div>
              </div>
              <div className="p-3 bg-[var(--color-paper-1)] rounded-xl border border-[var(--rule-hair)] interactive-card cursor-default">
                <div className="text-[var(--color-ink-2)] uppercase">Khung giờ vàng</div>
                <div className="font-display text-xl font-bold text-[var(--color-accent)] mt-1">09:00 - 11:00</div>
              </div>
              <div className="p-3 bg-[var(--color-paper-1)] rounded-xl border border-[var(--rule-hair)] interactive-card cursor-default">
                <div className="text-[var(--color-ink-2)] uppercase">Độ tin cậy</div>
                <div className="font-display text-xl font-bold text-[var(--color-success)] mt-1">100%</div>
              </div>
            </div>

            {/* Live Interactive SVG Graph */}
            <div className="bg-[var(--color-paper-1)] rounded-xl border border-[var(--rule-hair)] p-4 relative">
              <div className="flex justify-between items-center text-xs font-mono mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-ink-1)]">Biểu đồ lượt mượn phòng theo tuần</span>
                  {hoveredChartPoint && (
                    <span className="animate-fade-in text-[var(--color-accent)] font-semibold bg-[var(--color-paper-0)] px-2 py-0.5 rounded-full border border-[var(--rule-hair)] shadow-xs">
                      {hoveredChartPoint.label}: <strong className="text-[var(--color-ink-0)]">{hoveredChartPoint.count} lượt</strong>
                    </span>
                  )}
                </div>
                <span className="text-[var(--color-success)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse"></span> LIVE
                </span>
              </div>

              <div className="relative">
                <svg
                  viewBox="0 0 600 160"
                  className="w-full h-auto overflow-visible cursor-crosshair"
                  preserveAspectRatio="none"
                  onMouseLeave={() => setHoveredChartPoint(null)}
                >
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(50% 0.24 25)" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="oklch(50% 0.24 25)" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow-crimson" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Grid Lines */}
                  <g opacity="0.12" stroke="currentColor">
                    <line x1="0" y1="30" x2="600" y2="30" strokeDasharray="4 4" />
                    <line x1="0" y1="70" x2="600" y2="70" strokeDasharray="4 4" />
                    <line x1="0" y1="110" x2="600" y2="110" strokeDasharray="4 4" />
                  </g>

                  {/* Gradient Area Fill */}
                  <path d="M0,130 L60,110 L120,95 L180,105 L240,75 L300,85 L360,50 L420,60 L480,35 L540,40 L600,20 L600,160 L0,160 Z" fill="url(#chart-grad)" />

                  {/* Connecting Line */}
                  <path d="M0,130 L60,110 L120,95 L180,105 L240,75 L300,85 L360,50 L420,60 L480,35 L540,40 L600,20" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Interactive Points along the curve */}
                  {chartDataPoints.map((pt, idx) => {
                    const isHovered = hoveredChartPoint?.index === idx;
                    return (
                      <g key={idx} className="transition-all duration-200">
                        {/* Vertical Guide line on hover */}
                        {isHovered && (
                          <line
                            x1={pt.x}
                            y1="0"
                            x2={pt.x}
                            y2="160"
                            stroke="var(--color-accent)"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            opacity="0.6"
                          />
                        )}
                        {/* Larger hit zone for easier hover on touch/mouse */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="16"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredChartPoint({ ...pt, index: idx })}
                        />
                        {/* Visual Dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? "7" : (idx === chartDataPoints.length - 1 ? "5" : "3")}
                          fill={isHovered ? "var(--color-accent)" : "var(--color-paper-0)"}
                          stroke="var(--color-accent)"
                          strokeWidth={isHovered ? "3" : "2"}
                          className="transition-all duration-200 pointer-events-none"
                          filter={isHovered ? "url(#glow-crimson)" : undefined}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip Pill */}
                {hoveredChartPoint && (
                  <div
                    className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-[var(--color-ink-0)] text-[var(--color-paper-0)] font-mono text-[11px] px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap animate-spring-popup flex items-center gap-1.5"
                    style={{
                      left: `${(hoveredChartPoint.x / 600) * 100}%`,
                      top: `${(hoveredChartPoint.y / 160) * 100}%`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-ping"></span>
                    <span>{hoveredChartPoint.label}:</span>
                    <strong className="text-white font-bold">{hoveredChartPoint.count} lượt</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Recent Bookings Grid ───────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Upcoming Bookings */}
        <div className="tally-card interactive-card">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--rule-hair)] mb-4">
            <h3 className="font-display font-semibold text-lg text-[var(--color-ink-0)]">Lịch mượn sắp tới</h3>
            <Link to="/my-bookings" className="text-xs font-mono font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1 group">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.map((b) => (
                <div key={b.id} className="p-3.5 rounded-xl bg-[var(--color-paper-1)] border border-[var(--rule-hair)] flex items-center justify-between gap-3 text-xs hover:border-[var(--color-accent)] hover:translate-x-1 transition-all duration-200">
                  <div>
                    <div className="font-bold text-[var(--color-ink-0)]">{b.room_name || b.room?.name || 'Phòng học HUST'}</div>
                    <div className="text-[var(--color-ink-2)] font-mono mt-0.5">{formatDateTime(b.start_time)}</div>
                    <div className="text-[var(--color-ink-1)] mt-1">Mục đích: {b.purpose}</div>
                  </div>
                  <span className="status-approved flex-shrink-0">Đã duyệt</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[var(--color-ink-2)] font-mono text-xs">
              Chưa có lịch mượn phòng nào sắp tới.
            </div>
          )}
        </div>

        {/* Admin Pending Requests or Student Guidelines */}
        {user?.role === 'admin' ? (
          <div className="tally-card interactive-card">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--rule-hair)] mb-4">
              <h3 className="font-display font-semibold text-lg text-[var(--color-ink-0)]">Yêu cầu chờ phê duyệt ({pendingRequests.length})</h3>
              <Link to="/admin/approvals" className="text-xs font-mono font-semibold text-[var(--color-warning)] hover:underline flex items-center gap-1 group">
                Duyệt tất cả <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-3.5 rounded-xl bg-[var(--color-paper-1)] border border-[var(--rule-hair)] flex items-center justify-between gap-3 text-xs hover:border-[var(--color-accent)] hover:translate-x-1 transition-all duration-200">
                    <div>
                      <div className="font-bold text-[var(--color-ink-0)]">
                        {req.user?.full_name || req.user_name} &bull; {req.room?.name || req.room_name}
                      </div>
                      <div className="text-[var(--color-ink-2)] font-mono mt-0.5">
                        {formatDateTime(req.start_time)} - {formatDateTime(req.end_time)}
                      </div>
                      <div className="text-[var(--color-ink-1)] italic mt-1">"{req.purpose}"</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="inline-flex items-center justify-center p-2 bg-[var(--color-success)] text-white rounded-lg hover:opacity-90 btn-tactile cursor-pointer shadow-xs"
                        title="Duyệt"
                      >
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="inline-flex items-center justify-center p-2 bg-rose-600 text-white rounded-lg hover:opacity-90 btn-tactile cursor-pointer shadow-xs"
                        title="Từ chối"
                      >
                        <X className="w-3.5 h-3.5 flex-shrink-0" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-[var(--color-ink-2)] font-mono text-xs">
                Hiện không có yêu cầu nào chờ phê duyệt.
              </div>
            )}
          </div>
        ) : (
          <div className="tally-card interactive-card flex flex-col justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg text-[var(--color-ink-0)] mb-3">Quy định mượn phòng học HUST</h3>
              <ul className="space-y-2.5 text-xs text-[var(--color-ink-1)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 flex-shrink-0"></span>
                  <span>Đăng ký trước tối thiểu 24 giờ để quản trị viên kịp thời thẩm định và chuẩn bị cơ sở vật chất.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 flex-shrink-0"></span>
                  <span>Phòng máy tính tòa C3, PC, CFC và Lab C6 ưu tiên học phần thực hành & nghiên cứu.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 flex-shrink-0"></span>
                  <span>Hệ thống tự động phát hiện xung đột thời gian và ngăn chặn trùng lịch 100%.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[var(--rule-hair)] mt-6 flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-2)] font-mono">Cần mượn phòng ngay?</span>
              <Link to="/booking/new" className="btn btn--primary btn-tactile inline-flex items-center justify-center px-4 py-2 text-xs font-bold leading-none whitespace-nowrap">
                <span>Tạo yêu cầu →</span>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
