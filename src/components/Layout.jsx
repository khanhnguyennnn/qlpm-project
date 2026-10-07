import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  DoorOpen,
  CalendarPlus,
  History,
  ClipboardCheck,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Sun,
  Moon,
  Sparkles,
  ArrowUp
} from 'lucide-react';
import api from '../utils/api';

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Scroll to Top state
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Real-time Live Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dark / Light Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('qlpm_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('qlpm_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch pending approvals for admin & notifications for all
  const fetchAllStatus = async () => {
    try {
      if (isAdmin) {
        const pendingRes = await api.get('/bookings?status=pending');
        setPendingCount(pendingRes.data?.length || 0);
      }

      const notifRes = await api.get('/notifications');
      setNotifications(notifRes.data?.notifications || []);
      setUnreadCount(notifRes.data?.unreadCount || 0);
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  useEffect(() => {
    fetchAllStatus();
    const interval = setInterval(fetchAllStatus, 10000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = async (notif) => {
    try {
      await api.put(`/notifications/${notif.id}/read`);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
    setNotifDropdownOpen(false);

    if (isAdmin && (notif.type === 'new_booking' || notif.recipient_role === 'admin')) {
      navigate('/admin/approvals');
    } else {
      navigate('/my-bookings');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { name: 'Phòng học', path: '/rooms', icon: DoorOpen },
    { name: 'Đặt phòng', path: '/booking/new', icon: CalendarPlus },
    { name: 'Lịch của tôi', path: '/my-bookings', icon: History },
  ];

  const adminItems = [
    {
      name: 'Duyệt yêu cầu',
      path: '/admin/approvals',
      icon: ClipboardCheck,
      badge: pendingCount,
    },
    { name: 'Quản lý phòng', path: '/admin/rooms', icon: Settings },
    { name: 'Thống kê', path: '/admin/stats', icon: BarChart3 },
  ];

  const allNavItems = [...navItems, ...(isAdmin ? adminItems : [])];

  const formatNotifTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'new_booking':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-slate-400" />;
      default:
        return <Bell className="w-4 h-4 text-[var(--color-accent)]" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-paper-0)] text-[var(--color-ink-0)] selection:bg-[var(--color-accent)] selection:text-white transition-colors duration-200">
      {/* ───────── Floating Pill Navigation Bar ───────── */}
      <header className="fixed top-2 sm:top-3.5 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none transition-all duration-300">
        <div className="max-w-6xl mx-auto">
          {/* Main Floating Pill Capsule */}
          <div className="pointer-events-auto h-14 sm:h-15 px-3 sm:px-4.5 rounded-full bg-[var(--color-paper-0)]/90 dark:bg-[var(--color-paper-0)]/85 backdrop-blur-xl border border-[var(--rule-soft)] shadow-lg shadow-black/5 dark:shadow-black/30 flex items-center justify-between gap-2 sm:gap-4 transition-all">
            
            {/* University & School Identity */}
            <NavLink to="/" className="flex items-center gap-2.5 group shrink-0" title="Trang chủ QLPH SEEE - Đại Học Bách Khoa Hà Nội">
              <div className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full bg-white shadow-xs border border-[var(--rule-soft)] flex items-center justify-center overflow-hidden p-1 shrink-0 group-hover:scale-105 transition-transform">
                <img 
                  src="/logo.png" 
                  alt="SEEE Logo" 
                  className="h-full w-auto object-contain max-h-7" 
                />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm sm:text-base tracking-tight text-[var(--color-ink-0)] leading-none">
                    SEEE
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--color-accent)] px-1.5 py-0.5 rounded-full bg-[var(--color-accent-tint)] border border-[var(--rule-hair)]">
                    QLPH
                  </span>
                </div>
                <span className="hidden sm:inline-block text-[9px] font-mono tracking-wider uppercase text-[var(--color-ink-2)] mt-0.5 leading-none">
                  BÁCH KHOA · SINCE 1956
                </span>
              </div>
            </NavLink>

            {/* Desktop Floating Pill Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[var(--color-paper-1)]/70 dark:bg-[var(--color-paper-1)]/50 border border-[var(--rule-hair)] font-sans text-xs">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[var(--color-accent)] text-white font-semibold shadow-xs shadow-[rgba(180,20,30,0.25)]'
                        : 'text-[var(--color-ink-1)] hover:text-[var(--color-ink-0)] hover:bg-[var(--color-paper-2)]/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.name}</span>
                    {item.badge > 0 && (
                      <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold leading-none ${
                        isActive ? 'bg-white text-[var(--color-accent)]' : 'bg-rose-600 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Tools: Clock, Theme, Notifications, Profile, Mobile Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Real-time Clock Capsule */}
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-paper-1)]/80 dark:bg-[var(--color-paper-1)]/50 border border-[var(--rule-hair)] font-mono text-[11px] text-[var(--color-ink-1)] tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Theme Toggle Pill Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-ink-1)] hover:text-[var(--color-ink-0)] bg-[var(--color-paper-1)]/60 hover:bg-[var(--color-paper-2)] border border-[var(--rule-hair)] transition-all cursor-pointer btn-tactile"
                title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                aria-label="Toggle dark/light mode"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[var(--color-ink-1)]" />
                )}
              </button>

              {/* Notification Bell Pill Button */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="w-9 h-9 rounded-full relative flex items-center justify-center text-[var(--color-ink-1)] hover:text-[var(--color-ink-0)] bg-[var(--color-paper-1)]/60 hover:bg-[var(--color-paper-2)] border border-[var(--rule-hair)] transition-all cursor-pointer btn-tactile"
                  title="Thông báo hệ thống"
                  aria-label="Thông báo"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-[var(--color-paper-0)]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[var(--color-paper-0)] border border-[var(--rule-soft)] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-3 bg-[var(--color-paper-1)] border-b border-[var(--rule-hair)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[var(--color-accent)]" />
                        <span className="text-xs font-bold text-[var(--color-ink-0)] font-sans">Thông báo hệ thống</span>
                        {unreadCount > 0 && (
                          <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                            {unreadCount} mới
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-[var(--color-accent)] font-semibold hover:underline cursor-pointer"
                        >
                          Đã đọc tất cả
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[var(--rule-hair)]">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-[var(--color-ink-2)] text-xs font-mono">
                          Chưa có thông báo mới nào
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 hover:bg-[var(--color-paper-1)] cursor-pointer transition-colors flex items-start gap-3 ${
                              notif.is_read === 0 ? 'bg-[var(--color-accent-tint)]' : ''
                            }`}
                          >
                            <div className="mt-0.5 p-1.5 bg-[var(--color-paper-1)] rounded-md border border-[var(--rule-hair)] shrink-0">
                              {getNotifIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <p className={`text-xs font-semibold truncate ${notif.is_read === 0 ? 'text-[var(--color-ink-0)]' : 'text-[var(--color-ink-1)]'}`}>
                                  {notif.title}
                                </p>
                                {notif.is_read === 0 && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-ink-1)] line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <span className="text-[10px] font-mono text-[var(--color-ink-2)] mt-1 block">
                                {formatNotifTime(notif.created_at)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Pill */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-full hover:bg-[var(--color-paper-1)] border border-transparent hover:border-[var(--rule-hair)] transition-all cursor-pointer btn-tactile"
                  title="Tài khoản cá nhân"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-[var(--color-ink-0)] leading-tight max-w-[90px] truncate">
                      {user?.full_name || 'Người dùng'}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--color-ink-2)] leading-none mt-0.5">
                      {isAdmin ? 'Quản trị viên' : (user?.student_id || 'Sinh viên')}
                    </span>
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[var(--color-paper-0)] border border-[var(--rule-soft)] rounded-2xl shadow-2xl p-3 z-50 animate-fade-in">
                    <div className="pb-3 border-b border-[var(--rule-hair)] mb-2 px-1">
                      <p className="text-xs font-bold text-[var(--color-ink-0)]">{user?.full_name}</p>
                      <p className="text-[11px] font-mono text-[var(--color-accent)] mt-0.5 font-semibold">
                        {isAdmin ? 'Quản trị viên (Admin)' : (user?.student_id ? `MSSV: ${user.student_id}` : user?.username)}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer btn-tactile"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Đăng xuất khỏi hệ thống</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-ink-1)] hover:text-[var(--color-ink-0)] bg-[var(--color-paper-1)]/60 hover:bg-[var(--color-paper-2)] border border-[var(--rule-hair)] cursor-pointer btn-tactile"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Floating Drawer (Positioned smoothly below the pill) */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-2 p-2.5 rounded-2xl bg-[var(--color-paper-0)]/95 dark:bg-[var(--color-paper-0)]/90 backdrop-blur-xl border border-[var(--rule-soft)] shadow-xl pointer-events-auto space-y-1 animate-fade-in">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-accent)] text-white font-semibold shadow-xs'
                        : 'text-[var(--color-ink-1)] hover:bg-[var(--color-paper-1)] hover:text-[var(--color-ink-0)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                        isActive ? 'bg-white text-[var(--color-accent)]' : 'bg-rose-600 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ───────── Main Content Body ───────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8">
        <Outlet />
      </main>

      {/* ───────── Ft4 University Colophon Footer ───────── */}
      <footer className="mt-auto border-t border-[var(--rule-hair)] bg-[var(--color-paper-1)] py-12 px-4 sm:px-6 lg:px-8 transition-colors text-xs font-sans">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Identity Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 px-1.5 py-0.5 rounded-md bg-white border border-[var(--rule-soft)] flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="SEEE Logo" className="h-full w-auto object-contain max-h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-[var(--color-ink-0)] leading-tight">
                    TRƯỜNG ĐIỆN - ĐIỆN TỬ
                  </h4>
                  <p className="text-[10px] font-mono text-[var(--color-ink-2)] uppercase">
                    ĐẠI HỌC BÁCH KHOA HÀ NỘI · SINCE 1956
                  </p>
                </div>
              </div>
              <p className="text-[var(--color-ink-1)] leading-relaxed text-xs">
                Hệ thống Quản lý Phòng học (QLPH) phục vụ số hóa quy trình mượn giảng đường, phòng thực hành và hội trường cho cán bộ, giảng viên và sinh viên HUST.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-ink-2)]">
                School of Electrical and Electronic Engineering · HUST
              </div>
            </div>

            {/* Location & Contact Column */}
            <div className="space-y-2">
              <h5 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)] mb-3">
                Văn phòng &amp; Liên hệ
              </h5>
              <div className="space-y-1.5 text-[var(--color-ink-1)]">
                <p><strong>Địa chỉ:</strong> Văn phòng C9, Đại học Bách khoa Hà Nội, Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội</p>
                <p><strong>Giờ làm việc:</strong> Thứ Hai – Thứ Bảy: 07:00 – 21:00</p>
                <p><strong>Hỗ trợ kỹ thuật:</strong> (024) 3869 2463</p>
                <p><strong>Email:</strong> seee@hust.edu.vn</p>
              </div>
            </div>

            {/* Direct Links Column */}
            <div className="space-y-2">
              <h5 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)] mb-3">
                Liên kết nhanh
              </h5>
              <ul className="space-y-2 text-[var(--color-ink-1)]">
                <li><NavLink to="/" className="hover:text-[var(--color-accent)] transition-colors">Tổng quan hệ thống</NavLink></li>
                <li><NavLink to="/rooms" className="hover:text-[var(--color-accent)] transition-colors">Danh mục phòng học (Khu C, Khu D, TQB, B)</NavLink></li>
                <li><NavLink to="/booking/new" className="hover:text-[var(--color-accent)] transition-colors">Đăng ký mượn phòng trực tuyến</NavLink></li>
                <li><NavLink to="/my-bookings" className="hover:text-[var(--color-accent)] transition-colors">Lịch sử mượn phòng của tôi</NavLink></li>
                {isAdmin && (
                  <li><NavLink to="/admin/approvals" className="hover:text-[var(--color-accent)] transition-colors">Hội đồng thẩm định &amp; Duyệt yêu cầu</NavLink></li>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--rule-hair)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[var(--color-ink-2)]">
            <div>
              © 2026 Trường Điện - Điện Tử · Đại học Bách khoa Hà Nội · SINCE 1956
            </div>
            <div>
              Hệ thống Quản lý Phòng học QLPH
            </div>
          </div>
        </div>
      </footer>

      {/* ───────── Clean Back to Top Button ───────── */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[var(--color-accent)] hover:opacity-95 text-white shadow-lg shadow-[rgba(180,20,30,0.3)] transition-all cursor-pointer btn-tactile border border-white/20"
          title="Cuộn lên đầu trang"
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
