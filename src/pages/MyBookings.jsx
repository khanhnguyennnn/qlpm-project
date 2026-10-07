import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { STATUS_MAP, formatDateTime } from '../utils/helpers';
import { Calendar, AlertCircle, X, Search, Loader2 } from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    bookingId: null,
    reason: '',
    loading: false
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const query = filterStatus === 'all' ? '?my=true' : `?my=true&status=${filterStatus}`;
      const response = await api.get(`/api/bookings${query}`);
      // Sort by created_at desc if not already sorted by API
      const sorted = response.data.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
      setBookings(sorted);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const handleCancelClick = (id) => {
    setCancelModal({ isOpen: true, bookingId: id, reason: '', loading: false });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.reason.trim()) return;
    
    setCancelModal(prev => ({ ...prev, loading: true }));
    try {
      await api.put(`/api/bookings/${cancelModal.bookingId}/cancel`, {
        cancel_reason: cancelModal.reason
      });
      fetchBookings();
      setCancelModal({ isOpen: false, bookingId: null, reason: '', loading: false });
    } catch (err) {
      console.error('Failed to cancel booking', err);
      setCancelModal(prev => ({ ...prev, loading: false }));
      alert('Có lỗi xảy ra khi hủy lịch');
    }
  };

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ duyệt' },
    { id: 'approved', label: 'Đã duyệt' },
    { id: 'rejected', label: 'Từ chối' },
    { id: 'cancelled', label: 'Đã hủy' }
  ];

  const getStatusBadge = (status) => {
    const map = STATUS_MAP?.[status] || { label: status, color: 'bg-gray-100 text-gray-600 border-gray-300' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${map.color}`}>
        {map.label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-serif">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-paper-1)] border border-[var(--rule-hair)] text-xs font-mono text-[var(--color-ink-1)] mb-2">
            <span>SỔ THEO DÕI LỊCH MƯỢN · HUST SINCE 1956</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
            Lịch sử mượn phòng <span className="text-[var(--color-accent)]">của tôi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Theo dõi trạng thái duyệt, lịch trình và lịch sử mượn phòng học Bách Khoa
          </p>
        </div>
        <Link 
          to="/booking/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl btn--primary text-xs font-bold leading-none whitespace-nowrap shadow-luxury cursor-pointer font-serif btn-tactile"
        >
          <span>+ Đặt phòng mới</span>
        </Link>
      </div>

      <div className="glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury overflow-hidden mb-6 relative luxury-card-rim">
        <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-1.5 gap-1.5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`inline-flex items-center justify-center px-4 py-2 text-xs font-bold leading-none rounded-xl whitespace-nowrap transition-all cursor-pointer font-sans btn-tactile ${
                filterStatus === tab.id
                  ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-300 shadow-sm border border-primary-200/80 dark:border-primary-900/60 scale-102'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-200/60 dark:border-slate-700 shadow-inner">
              <Calendar className="w-8 h-8 text-primary-500/70" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 font-header">Chưa có lịch mượn nào ở mục này</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-sans">Bạn có thể tạo yêu cầu mượn phòng mới bất cứ lúc nào.</p>
            <Link to="/booking/new" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline font-serif">
              Đặt mượn phòng học ngay &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider font-mono">
                  <th className="px-6 py-3.5">Phòng học</th>
                  <th className="px-6 py-3.5">Thời gian</th>
                  <th className="px-6 py-3.5">Mục đích</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 hidden md:table-cell">Ghi chú</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {bookings.map((booking) => (
                  <tr key={booking.id || booking._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white font-serif">
                      {booking.room?.name || booking.room_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-mono">
                      {formatDateTime ? (
                        <>
                          <div className="font-semibold text-xs">{formatDateTime(booking.start_time).split(' ')[0]}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {formatDateTime(booking.start_time).split(' ')[1]} - {formatDateTime(booking.end_time).split(' ')[1]}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-xs">{new Date(booking.start_time).toLocaleDateString('vi-VN')}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {new Date(booking.start_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - 
                            {new Date(booking.end_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate font-sans" title={booking.purpose}>
                      {booking.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell max-w-xs font-sans">
                      {booking.status === 'rejected' && (
                        <div className="text-rose-600 dark:text-rose-400 text-xs mt-1" title={booking.admin_note}>Lý do: {booking.admin_note}</div>
                      )}
                      {booking.status === 'cancelled' && (
                        <div className="text-slate-400 text-xs mt-1" title={booking.cancel_reason}>Lý do: {booking.cancel_reason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(booking.status === 'pending' || booking.status === 'approved') && (
                        <button
                          onClick={() => handleCancelClick(booking.id || booking._id)}
                          className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold leading-none whitespace-nowrap text-rose-600 dark:text-rose-400 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 rounded-xl transition-all cursor-pointer btn-tactile"
                        >
                          <span>Hủy</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in font-serif">
          <div className="glass-card rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-spring-popup">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-header">Hủy yêu cầu mượn phòng</h3>
              <button 
                onClick={() => setCancelModal({ isOpen: false, bookingId: null, reason: '', loading: false })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg btn-tactile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                Lý do hủy <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={cancelModal.reason}
                onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Vui lòng nhập lý do hủy lịch..."
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-sm font-sans"
                rows="3"
                required
              ></textarea>
            </div>
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 font-serif">
              <button
                onClick={() => setCancelModal({ isOpen: false, bookingId: null, reason: '', loading: false })}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold leading-none whitespace-nowrap text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer btn-tactile"
                disabled={cancelModal.loading}
              >
                <span>Đóng</span>
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancelModal.reason.trim() || cancelModal.loading}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold leading-none whitespace-nowrap text-white bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-700 hover:to-rose-700 rounded-xl transition-all shadow-md shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-tactile"
              >
                {cancelModal.loading ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : null}
                <span>Xác nhận hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
