import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertTriangle, ShieldCheck, KeyRound, 
  Clock, History, Search, CheckCheck, Loader2, FileText, UserCheck 
} from 'lucide-react';
import api from '../utils/api';
import { formatDateTime, formatDate, STATUS_MAP } from '../utils/helpers';

// Helper formatters that never throw ReferenceError or Invalid Date crashes
const safeFormatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const formatted = formatDateTime(dateStr);
    if (formatted) return formatted;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleString('vi-VN');
  } catch {
    return String(dateStr);
  }
};

const safeFormatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const formatted = formatDate(dateStr);
    if (formatted) return formatted;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('vi-VN');
  } catch {
    return String(dateStr);
  }
};

const PendingApprovals = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'checkin' | 'audit'
  const [pendingBookings, setPendingBookings] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Check-in search & filter
  const [checkinQuery, setCheckinQuery] = useState('');
  const [checkinActionLoading, setCheckinActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch pending bookings
      const pendingRes = await api.get('/api/bookings?status=pending');
      const pending = Array.isArray(pendingRes.data) ? pendingRes.data : [];
      setPendingBookings(pending);

      // Fetch all approved bookings for conflict check and reception check-in
      const approvedRes = await api.get('/api/bookings?status=approved');
      const approved = Array.isArray(approvedRes.data) ? approvedRes.data : [];
      setApprovedBookings(approved);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setMessage({ type: 'error', text: 'Lỗi khi tải dữ liệu yêu cầu' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await api.get('/api/bookings/audit/logs');
      setAuditLogs(res.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const checkConflict = (booking) => {
    if (!booking || !booking.start_time || !booking.end_time) return false;
    return (approvedBookings || []).some(approved => {
      if (!approved || approved.room_id !== booking.room_id) return false;
      try {
        const start1 = new Date(booking.start_time).getTime();
        const end1 = new Date(booking.end_time).getTime();
        const start2 = new Date(approved.start_time).getTime();
        const end2 = new Date(approved.end_time).getTime();
        if (isNaN(start1) || isNaN(end1) || isNaN(start2) || isNaN(end2)) return false;
        return start1 < end2 && start2 < end1;
      } catch {
        return false;
      }
    });
  };

  const handleApprove = async (booking) => {
    if (!window.confirm('Bạn có chắc muốn duyệt yêu cầu này?')) return;
    
    try {
      await api.put(`/api/bookings/${booking.id}/approve`);
      setMessage({ type: 'success', text: 'Đã duyệt yêu cầu thành công' });
      fetchData();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setMessage({ type: 'error', text: 'Không thể duyệt: trùng lịch với buổi đã được duyệt' });
      } else {
        setMessage({ type: 'error', text: 'Lỗi khi duyệt yêu cầu' });
      }
    }
  };

  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    
    try {
      await api.put(`/api/bookings/${selectedBooking.id}/reject`, { admin_note: rejectReason });
      setMessage({ type: 'success', text: 'Đã từ chối yêu cầu' });
      setRejectModalOpen(false);
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi khi từ chối yêu cầu' });
    }
  };

  const handleCheckin = async (bookingId) => {
    try {
      setCheckinActionLoading(bookingId);
      const res = await api.put(`/api/bookings/${bookingId}/checkin`);
      setMessage({ type: 'success', text: `Check-in thành công! Mã PIN: ${res.data.checkin_code}` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Lỗi khi xác nhận check-in' });
    } finally {
      setCheckinActionLoading(null);
    }
  };

  const filteredApprovedForCheckin = approvedBookings.filter(b => {
    if (!checkinQuery.trim()) return true;
    const q = checkinQuery.toLowerCase().trim();
    return (
      (b.checkin_code && b.checkin_code.toLowerCase().includes(q)) ||
      (b.user_name && b.user_name.toLowerCase().includes(q)) ||
      (b.room_name && b.room_name.toLowerCase().includes(q)) ||
      (b.student_id && b.student_id.toLowerCase().includes(q))
    );
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'APPROVE_BOOKING':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">DUYỆT PHÒNG</span>;
      case 'REJECT_BOOKING':
        return <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-bold">TỪ CHỐI</span>;
      case 'CANCEL_BOOKING':
        return <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">HỦY LỊCH</span>;
      case 'CHECKIN_ROOM':
        return <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-mono text-[10px] font-bold">CHECK-IN</span>;
      case 'CREATE_BOOKING':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">TẠO ĐƠN</span>;
      case 'FORGOT_PASSWORD':
      case 'RESET_PASSWORD':
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold">ĐẶT LẠI MK</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/30 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">{action}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-serif">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-paper-1)] border border-[var(--rule-hair)] text-xs font-mono text-[var(--color-ink-1)] mb-2">
            <span>HỘI ĐỒNG XÉT DUYỆT PHÒNG · HUST SINCE 1956</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
              Duyệt yêu cầu mượn phòng học <span className="text-[var(--color-accent)]">HUST</span>
            </h1>
            <span className="bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-xs font-bold px-3 py-1 rounded-full border border-primary-200/80 dark:border-primary-800/50 font-mono shadow-2xs">
              {pendingBookings.length} chờ duyệt
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Phê duyệt hoặc từ chối lịch mượn giảng đường với thuật toán phát hiện xung đột tự động
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 font-sans ${
          message.type === 'error' 
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* ───────── Segmented Tab Switcher ───────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all font-sans cursor-pointer btn-tactile ${
            activeTab === 'pending'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Yêu cầu chờ duyệt ({pendingBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checkin')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all font-sans cursor-pointer btn-tactile ${
            activeTab === 'checkin'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Điểm danh & Tiếp đón phòng ({approvedBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all font-sans cursor-pointer btn-tactile ${
            activeTab === 'audit'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Nhật ký hệ thống (Audit Trail)</span>
        </button>
      </div>

      {/* ───────── TAB 1: YÊU CẦU CHỜ DUYỆT ───────── */}
      {activeTab === 'pending' && (
        <>
          {loading ? (
            <div className="p-16 text-center text-slate-500 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
              <span className="font-sans">Đang kiểm tra danh sách yêu cầu chờ duyệt...</span>
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-slate-500 space-y-2">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 font-serif">Không có yêu cầu nào chờ duyệt</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Tất cả yêu cầu mượn phòng học đã được xử lý hoàn tất.</p>
            </div>
          ) : (
            <div className="glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury overflow-hidden relative luxury-card-rim">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 uppercase text-[11px] font-black tracking-wider border-b border-slate-200 dark:border-slate-800 font-mono">
                    <tr>
                      <th className="py-3.5 px-5">Người mượn</th>
                      <th className="py-3.5 px-4">Giảng đường</th>
                      <th className="py-3.5 px-4">Thời gian mượn</th>
                      <th className="py-3.5 px-4">Mục đích sử dụng</th>
                      <th className="py-3.5 px-4">Ngày gửi</th>
                      <th className="py-3.5 px-4 text-right">Phê duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {pendingBookings.map((booking) => {
                      const isConflict = checkConflict(booking);
                      return (
                        <React.Fragment key={booking.id}>
                          <tr className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isConflict ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}>
                            <td className="py-4 px-5 font-bold text-slate-900 dark:text-white font-serif">
                              <div>{booking.user_name}</div>
                              {booking.student_id && (
                                <div className="text-[11px] font-mono text-slate-400">{booking.student_id}</div>
                              )}
                            </td>
                            <td className="py-4 px-4 font-bold text-primary-600 dark:text-primary-400 font-serif">{booking.room_name}</td>
                            <td className="py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">
                              <div>{safeFormatDateTime(booking.start_time)}</div>
                              <div className="text-slate-400 font-normal">đến {safeFormatDateTime(booking.end_time)}</div>
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs font-sans">
                              <div>{booking.purpose}</div>
                              {booking.document_url && (
                                <a
                                  href={booking.document_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-primary-600 hover:underline mt-1 font-mono"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Văn bản đính kèm</span>
                                </a>
                              )}
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-400 dark:text-slate-500 font-mono">{safeFormatDate(booking.created_at)}</td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleApprove(booking)}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold leading-none whitespace-nowrap transition-all shadow-sm cursor-pointer font-serif btn-tactile"
                                  title="Duyệt yêu cầu"
                                >
                                  <CheckCircle size={14} className="flex-shrink-0" />
                                  <span>Duyệt</span>
                                </button>
                                <button
                                  onClick={() => openRejectModal(booking)}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold leading-none whitespace-nowrap transition-all shadow-sm cursor-pointer font-serif btn-tactile"
                                  title="Từ chối"
                                >
                                  <XCircle size={14} className="flex-shrink-0" />
                                  <span>Từ chối</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isConflict && (
                            <tr className="bg-amber-50/80 dark:bg-amber-950/40">
                              <td colSpan="6" className="py-2.5 px-5 border-b border-amber-200/60 dark:border-amber-800/50">
                                <div className="flex items-center text-amber-800 dark:text-amber-200 text-xs font-bold gap-2 font-sans">
                                  <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                  <span>Cảnh báo xung đột: Đã có lịch trùng thời gian được duyệt tại phòng này!</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ───────── TAB 2: ĐIỂM DANH & TIẾP ĐÓN PHÒNG ───────── */}
      {activeTab === 'checkin' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={checkinQuery}
                onChange={(e) => setCheckinQuery(e.target.value)}
                placeholder="Tìm theo Mã PIN (HUST-XXXX), MSSV hoặc tên người mượn..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs sm:text-sm font-sans"
              />
            </div>
            <div className="text-xs font-mono text-slate-500">
              Tổng số phòng đã duyệt: <strong>{approvedBookings.length}</strong>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury overflow-hidden relative luxury-card-rim">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 uppercase text-[11px] font-black tracking-wider border-b border-slate-200 dark:border-slate-800 font-mono">
                  <tr>
                    <th className="py-3.5 px-5">Mã PIN Tiếp đón</th>
                    <th className="py-3.5 px-4">Giảng đường</th>
                    <th className="py-3.5 px-4">Người mượn</th>
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4">Trạng thái Check-in</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredApprovedForCheckin.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 font-sans">
                        Không tìm thấy lịch mượn phù hợp với từ khóa
                      </td>
                    </tr>
                  ) : (
                    filteredApprovedForCheckin.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold tracking-wider">
                            <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{b.checkin_code || 'Chưa cấp'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-primary-600 dark:text-primary-400 font-serif">
                          {b.room_name}
                        </td>
                        <td className="py-4 px-4 font-serif">
                          <div className="font-bold text-slate-900 dark:text-white">{b.user_name}</div>
                          {b.student_id && <div className="text-[11px] font-mono text-slate-400">{b.student_id}</div>}
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                          <div>{safeFormatDateTime(b.start_time)}</div>
                          <div className="text-slate-400">đến {safeFormatDateTime(b.end_time)}</div>
                        </td>
                        <td className="py-4 px-4 text-xs font-sans">
                          {b.checked_in_at ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã nhận phòng ({safeFormatDateTime(b.checked_in_at)})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[11px]">
                              <span>Chưa check-in</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {!b.checked_in_at && (
                            <button
                              onClick={() => handleCheckin(b.id)}
                              disabled={checkinActionLoading === b.id}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer font-serif btn-tactile"
                            >
                              {checkinActionLoading === b.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                              <span>Xác nhận Check-in</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────── TAB 3: NHẬT KÝ HỆ THỐNG (AUDIT TRAIL) ───────── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-sans">
              Toàn bộ lịch sử thao tác quan trọng (duyệt, từ chối, hủy đơn, điểm danh, khôi phục mật khẩu) được ghi vết tự động.
            </p>
            <button
              onClick={fetchAuditLogs}
              disabled={auditLoading}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-mono text-slate-700 dark:text-slate-300 cursor-pointer btn-tactile"
            >
              {auditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <History className="w-3 h-3" />}
              <span>Làm mới nhật ký</span>
            </button>
          </div>

          <div className="glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury overflow-hidden relative luxury-card-rim">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 uppercase text-[11px] font-black tracking-wider border-b border-slate-200 dark:border-slate-800 font-mono">
                  <tr>
                    <th className="py-3.5 px-5">Thời gian</th>
                    <th className="py-3.5 px-4">Người thực hiện</th>
                    <th className="py-3.5 px-4">Hành động</th>
                    <th className="py-3.5 px-4">Đối tượng</th>
                    <th className="py-3.5 px-5">Chi tiết ghi vết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500 font-sans">
                        Chưa có dữ liệu nhật ký kiểm toán nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-5 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {safeFormatDateTime(log.created_at)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-serif text-xs">
                          {log.user_name || 'Hệ thống'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-300 uppercase">
                          {log.entity_type} #{log.entity_id}
                        </td>
                        <td className="py-3.5 px-5 text-xs font-sans text-slate-700 dark:text-slate-300 max-w-md truncate" title={log.details}>
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-serif">
          <div className="glass-card rounded-3xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 animate-spring-popup">
            <h2 className="text-lg font-bold mb-3 text-slate-900 dark:text-white font-header">Từ chối yêu cầu mượn phòng</h2>
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                Lý do từ chối <span className="text-rose-500">*</span>
              </label>
              <textarea
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-sm font-sans"
                rows="4"
                placeholder="Nhập lý do gửi đến người đăng ký..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold leading-none whitespace-nowrap text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer font-serif btn-tactile"
                onClick={() => setRejectModalOpen(false)}
              >
                <span>Hủy</span>
              </button>
              <button
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold leading-none whitespace-nowrap text-white bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-700 hover:to-rose-700 rounded-xl transition-all shadow-md shadow-primary-600/25 cursor-pointer font-serif btn-tactile"
                onClick={handleReject}
              >
                <span>Xác nhận từ chối</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
