import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const PendingApprovals = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch pending bookings
      const pendingRes = await api.get('/api/bookings?status=pending');
      const pending = pendingRes.data || [];
      setPendingBookings(pending);

      // Fetch approved bookings for conflict checking
      const roomIds = [...new Set(pending.map(b => b.room_id))];
      let approved = [];
      for (const roomId of roomIds) {
        const approvedRes = await api.get(`/api/bookings?room_id=${roomId}&status=approved`);
        approved = [...approved, ...(approvedRes.data || [])];
      }
      setApprovedBookings(approved);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setMessage({ type: 'error', text: 'Lỗi khi tải dữ liệu' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const checkConflict = (booking) => {
    return approvedBookings.some(approved => {
      if (approved.room_id !== booking.room_id) return false;
      const start1 = new Date(booking.start_time).getTime();
      const end1 = new Date(booking.end_time).getTime();
      const start2 = new Date(approved.start_time).getTime();
      const end2 = new Date(approved.end_time).getTime();
      return start1 < end2 && start2 < end1;
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
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
                        <td className="py-4 px-5 font-bold text-slate-900 dark:text-white font-serif">{booking.user_name}</td>
                        <td className="py-4 px-4 font-bold text-primary-600 dark:text-primary-400 font-serif">{booking.room_name}</td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">
                          <div>{formatDate(booking.start_time)}</div>
                          <div className="text-slate-400 font-normal">đến {formatDate(booking.end_time)}</div>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs font-sans">{booking.purpose}</td>
                        <td className="py-4 px-4 text-xs text-slate-400 dark:text-slate-500 font-mono">{new Date(booking.created_at).toLocaleDateString('vi-VN')}</td>
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
