import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Info, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';

const BookingForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialRoomId = searchParams.get('room') || '';
  const initialHour = searchParams.get('hour') || '';
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [rooms, setRooms] = useState([]);
  const [equipmentRequirement, setEquipmentRequirement] = useState('all'); // 'all', 'smartboard', 'projector', 'computer'
  const [formData, setFormData] = useState({
    roomId: initialRoomId,
    date: todayStr,
    startTime: initialHour ? `${initialHour}:00` : '07:00',
    endTime: initialHour ? `${String(Number(initialHour) + 1).padStart(2, '0')}:00` : '09:00',
    purpose: '',
    documentUrl: ''
  });
  
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBookings, setFetchingBookings] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/rooms?status=active');
        setRooms(response.data);
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (formData.roomId && formData.date) {
      const fetchBookings = async () => {
        setFetchingBookings(true);
        try {
          const response = await api.get(`/bookings?room_id=${formData.roomId}&date=${formData.date}`);
          setExistingBookings(response.data);
        } catch (err) {
          console.error('Failed to fetch existing bookings', err);
        } finally {
          setFetchingBookings(false);
        }
      };
      fetchBookings();
    } else {
      setExistingBookings([]);
    }
  }, [formData.roomId, formData.date]);

  const selectedRoom = rooms.find(r => r.id === formData.roomId || r._id === formData.roomId || String(r.id) === formData.roomId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (formData.startTime >= formData.endTime) {
      setError('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    setLoading(true);
    
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`).toISOString();

      await api.post('/api/bookings', {
        room_id: formData.roomId,
        start_time: startDateTime,
        end_time: endDateTime,
        purpose: formData.purpose,
        document_url: formData.documentUrl ? formData.documentUrl.trim() : null
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/my-bookings');
      }, 1500);
      
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError('Phòng này đã được đặt trong khung giờ này');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Có lỗi xảy ra khi đặt phòng');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-serif">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-paper-1)] border border-[var(--rule-hair)] text-xs font-mono text-[var(--color-ink-1)]">
          <span>TRƯỜNG ĐIỆN - ĐIỆN TỬ · HUST SINCE 1956</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
          Đăng ký mượn phòng học <span className="text-[var(--color-accent)]">HUST</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans">
          Chọn giảng đường theo vị trí cơ sở Bách Khoa và gửi yêu cầu thẩm định trực tuyến
        </p>
      </div>
      
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center shadow-sm animate-scale-in">
          <Info className="w-5 h-5 mr-3 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs sm:text-sm font-bold">Đặt phòng thành công! Đang chuyển hướng...</span>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury relative overflow-hidden luxury-card-rim">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  Giảng đường / Phòng học
                </label>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-sans">Lọc theo tiện ích:</span>
              </div>

              {/* Quick filter by equipment */}
              <div className="flex flex-wrap gap-1.5 mb-3 font-sans">
                <button
                  type="button"
                  onClick={() => setEquipmentRequirement('all')}
                  className={`inline-flex items-center justify-center px-3 py-1.5 text-xs rounded-xl font-bold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
                    equipmentRequirement === 'all'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>Tất cả ({rooms.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEquipmentRequirement('smartboard')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
                    equipmentRequirement === 'smartboard'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-primary-200/60 dark:border-primary-900/40 hover:bg-primary-50 dark:hover:bg-primary-950/40'
                  }`}
                >
                  <span>📺 Có Bảng thông minh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEquipmentRequirement('projector')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
                    equipmentRequirement === 'projector'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-primary-200/60 dark:border-primary-900/40 hover:bg-primary-50 dark:hover:bg-primary-950/40'
                  }`}
                >
                  <span>📽️ Có Máy chiếu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEquipmentRequirement('computer')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
                    equipmentRequirement === 'computer'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-primary-200/60 dark:border-primary-900/40 hover:bg-primary-50 dark:hover:bg-primary-950/40'
                  }`}
                >
                  <span>💻 Có Máy tính</span>
                </button>
              </div>

              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/95 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm transition-all font-sans"
              >
                <option value="">-- Chọn phòng học ({
                  rooms.filter(r => {
                    if (equipmentRequirement === 'smartboard') return Array.isArray(r.equipment) && r.equipment.includes('Bảng thông minh');
                    if (equipmentRequirement === 'projector') return Array.isArray(r.equipment) && r.equipment.includes('Máy chiếu');
                    if (equipmentRequirement === 'computer') return Array.isArray(r.equipment) && r.equipment.includes('Máy tính');
                    return true;
                  }).length
                } phòng phù hợp) --</option>
                {rooms
                  .filter(r => {
                    if (equipmentRequirement === 'smartboard') return Array.isArray(r.equipment) && r.equipment.includes('Bảng thông minh');
                    if (equipmentRequirement === 'projector') return Array.isArray(r.equipment) && r.equipment.includes('Máy chiếu');
                    if (equipmentRequirement === 'computer') return Array.isArray(r.equipment) && r.equipment.includes('Máy tính');
                    return true;
                  })
                  .map(room => (
                    <option key={room.id || room._id} value={room.id || room._id}>
                      {room.name} ({room.capacity} chỗ - {Array.isArray(room.equipment) ? room.equipment.slice(0, 3).join(', ') : ''})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                Ngày đăng ký
              </label>
              <div className="relative font-sans">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  name="date"
                  min={todayStr}
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/95 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                  Giờ bắt đầu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="time"
                    name="startTime"
                    min="07:00"
                    max="21:00"
                    step="1800"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/95 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                  Giờ kết thúc
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="time"
                    name="endTime"
                    min="07:00"
                    max="21:00"
                    step="1800"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/95 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                Mục đích sử dụng phòng <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="purpose"
                rows="3"
                value={formData.purpose}
                onChange={handleChange}
                required
                placeholder="Ví dụ: Giảng dạy đồ án, học nhóm CLB sinh viên nghiên cứu khoa học..."
                className="w-full px-4 py-3 bg-white/95 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
              ></textarea>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  Link tài liệu / Giấy giới thiệu (Tùy chọn)
                </label>
                <span className="text-[10px] font-mono text-slate-400">Google Drive / OneDrive</span>
              </div>
              <input
                type="url"
                name="documentUrl"
                value={formData.documentUrl}
                onChange={handleChange}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-4 py-2.5 bg-white/95 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-100 shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                Đính kèm liên kết đề xuất hoặc văn bản ủy quyền của giảng viên hướng dẫn (nếu có).
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 font-sans flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                <strong>Hạn ngạch sinh viên:</strong> Mỗi tài khoản được gửi tối đa <strong>3 đơn mượn phòng chờ duyệt</strong> cùng lúc. Vui lòng đợi xét duyệt hoặc hủy đơn cũ trước khi tạo thêm.
              </span>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-2xl flex items-start text-xs sm:text-sm font-semibold animate-scale-in">
                <AlertCircle className="w-5 h-5 mr-2.5 flex-shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn--primary w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-luxury inline-flex justify-center items-center gap-2 leading-none whitespace-nowrap group cursor-pointer font-serif btn-tactile"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white flex-shrink-0" />
                  <span>Đang thẩm tra & lưu thông tin...</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span>Gửi yêu cầu mượn phòng</span>
                  <span className="text-amber-200 group-hover:translate-x-1 transition-transform">→</span>
                </span>
              )}
            </button>
          </form>
        </div>

        <div className="lg:w-96 space-y-6">
          {selectedRoom ? (
            <div className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury animate-fade-in interactive-card relative overflow-hidden luxury-card-rim">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-header">{selectedRoom.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/50 font-mono">
                  {selectedRoom.capacity} chỗ
                </span>
              </div>
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 font-sans">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[11px] font-mono">Vị trí:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{selectedRoom.location || 'Khuôn viên Bách Khoa'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[11px] block mb-2 font-mono">Trang thiết bị sẵn có:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.equipment && selectedRoom.equipment.length > 0 ? (
                      selectedRoom.equipment.map((eq, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                          {eq}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">Cơ bản</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 dark:text-slate-500 font-sans">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold">Chọn phòng học bên cạnh để xem trước trang thiết bị và vị trí</p>
            </div>
          )}

          {formData.roomId && formData.date && (
            <div className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury interactive-card relative overflow-hidden luxury-card-rim">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-header">Lịch đã đặt trong ngày</h3>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono">{formData.date}</span>
              </div>
              {fetchingBookings ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600 dark:text-primary-400" />
                </div>
              ) : existingBookings.length > 0 ? (
                <ul className="space-y-2 font-sans">
                  {existingBookings.map(b => (
                    <li key={b.id || b._id} className="text-xs p-3 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/40 dark:border-amber-800/40 text-amber-900 dark:text-amber-300 rounded-2xl flex items-center justify-between font-bold">
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-2 text-amber-600 dark:text-amber-400" />
                        <span className="font-mono">{formatTime(b.start_time)} - {formatTime(b.end_time)}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-amber-200/50 dark:bg-amber-900/50 rounded-md text-amber-800 dark:text-amber-200 font-mono">
                        {b.status === 'approved' ? 'Đã duyệt' : 'Đang chờ'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-center font-sans">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 py-2.5 px-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50">
                    ✓ Chưa có lịch đặt nào, phòng đang trống cả ngày
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
