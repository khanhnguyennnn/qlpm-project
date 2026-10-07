import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  startOfWeek, endOfWeek, addWeeks, subWeeks, format, 
  addDays, parseISO, isSameDay, getHours, getMinutes, differenceInMinutes, startOfToday
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Users, MapPin, Tag, Calendar, Info } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { STATUS_MAP } from '../utils/helpers';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  const [selectedBooking, setSelectedBooking] = useState(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 15 }).map((_, i) => i + 7); // 7 to 21

  useEffect(() => {
    const fetchRoomAndBookings = async () => {
      setLoading(true);
      try {
        const [roomRes, bookingsRes] = await Promise.all([
          api.get(`/rooms/${id}`),
          api.get(`/bookings/calendar?room_id=${id}&week_start=${format(weekStart, 'yyyy-MM-dd')}`)
        ]);
        setRoom(roomRes.data);
        setBookings(bookingsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomAndBookings();
  }, [id, weekStart]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(startOfToday());

  const handleEmptyCellClick = (day, hour) => {
    navigate(`/booking/new?room=${id}&date=${format(day, 'yyyy-MM-dd')}&hour=${hour}`);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-200 border-yellow-500 text-yellow-900';
      case 'approved': return 'bg-emerald-200 border-emerald-500 text-emerald-900';
      case 'rejected': return 'bg-rose-200 border-rose-500 text-rose-900';
      case 'cancelled': return 'bg-slate-200 border-slate-400 text-slate-800';
      default: return 'bg-slate-100 border-slate-300 text-slate-700';
    }
  };

  if (loading && !room) return <div className="p-8 text-center">Đang tải...</div>;
  if (!room) return <div className="p-8 text-center text-red-500">Không tìm thấy phòng.</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl animate-fade-in font-serif">
      {/* Breadcrumb back */}
      <div>
        <Link 
          to="/rooms" 
          className="inline-flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors gap-1.5 font-serif cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Quay lại danh mục phòng học HUST
        </Link>
      </div>

      {/* Section 1: Room Info Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-luxury relative overflow-hidden luxury-card-rim">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-header">
                {room.name}
              </h1>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border font-mono inline-flex items-center gap-1.5 ${
                room.status === 'active' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' 
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${room.status === 'active' ? 'bg-emerald-500 shadow-glow' : 'bg-amber-500'}`}></span>
                {room.status === 'active' ? 'Đang hoạt động' : 'Đang bảo trì'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 font-sans">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              {room.location || 'Khuôn viên Bách Khoa'}
            </p>
          </div>
          {room.status === 'active' && (
            <Link 
              to={`/booking/new?room=${id}`} 
              className="btn--primary inline-flex items-center justify-center px-6 py-3 rounded-xl text-xs font-bold leading-none shadow-luxury whitespace-nowrap text-center font-serif btn-tactile"
            >
              <span>Đặt lịch mượn phòng này</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Sức chứa</p>
              <p className="text-slate-900 dark:text-white font-black text-lg mt-0.5 font-mono">{room.capacity} chỗ ngồi</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Vị trí cơ sở</p>
              <p className="text-slate-900 dark:text-white font-bold text-xs mt-1 font-sans">{room.location}</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 lg:col-span-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2 font-mono">Trang thiết bị phòng</p>
            <div className="flex flex-wrap gap-1.5 font-sans">
              {room.equipment?.map((item, idx) => (
                <span key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 lg:col-span-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 font-mono">Mô tả chi tiết</p>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed font-sans">
              {room.description || 'Giảng đường tiêu chuẩn trường Đại học Bách Khoa Hà Nội'}
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Weekly Calendar */}
      <div className="glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50/60 dark:bg-slate-900/60">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight font-header">
            <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Lịch đăng ký & sử dụng phòng (Tuần trực quan)
          </h2>
          <div className="flex items-center gap-3 font-sans">
            <button 
              onClick={handleToday} 
              className="inline-flex items-center justify-center px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold leading-none whitespace-nowrap text-slate-700 dark:text-slate-200 hover:border-primary-400 dark:hover:border-primary-500 transition-colors shadow-sm cursor-pointer btn-tactile"
            >
              <span>Hôm nay</span>
            </button>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-1">
              <button 
                onClick={handlePrevWeek} 
                className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer btn-tactile"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              </button>
              <span className="font-bold text-xs text-slate-700 dark:text-slate-200 px-2 min-w-[140px] text-center font-mono">
                Tuần {format(weekStart, 'dd/MM/yyyy')} - {format(weekEnd, 'dd/MM/yyyy')}
              </span>
              <button 
                onClick={handleNextWeek} 
                className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer btn-tactile"
                title="Tuần sau"
              >
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-5 text-xs bg-white dark:bg-slate-900 flex-wrap font-mono">
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-yellow-200 border-l-2 border-yellow-500 rounded-sm shadow-sm inline-block"></span> <span className="font-medium text-slate-600 dark:text-slate-400">Chờ duyệt</span></div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-emerald-200 border-l-2 border-emerald-500 rounded-sm shadow-sm inline-block"></span> <span className="font-medium text-slate-600 dark:text-slate-400">Đã duyệt</span></div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-rose-200 border-l-2 border-rose-500 rounded-sm shadow-sm inline-block"></span> <span className="font-medium text-slate-600 dark:text-slate-400">Từ chối</span></div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-slate-200 dark:bg-slate-700 border-l-2 border-slate-400 rounded-sm shadow-sm inline-block"></span> <span className="font-medium text-slate-600 dark:text-slate-400">Đã hủy</span></div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto bg-slate-50/30 dark:bg-slate-950/40">
          <div className="min-w-[900px]">
            {/* Header */}
            <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800">
              <div className="py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-mono">Giờ</div>
              {days.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={i} className={`py-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${isToday ? 'bg-primary-50/60 dark:bg-primary-950/40' : 'bg-slate-50 dark:bg-slate-900'}`}>
                    <div className={`text-xs font-bold font-serif ${isToday ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {format(day, 'EEEE', { locale: vi })}
                    </div>
                    <div className={`text-[11px] mt-0.5 font-mono ${isToday ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {format(day, 'dd/MM')}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Grid Body */}
            <div className="relative font-mono">
              {/* Hourly rows */}
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800/80 last:border-b-0 h-12">
                  <div className="border-r border-slate-200 dark:border-slate-800 text-center text-xs font-medium text-slate-400 relative bg-white dark:bg-slate-900">
                    <span className="absolute -top-2.5 left-0 right-0 bg-white dark:bg-slate-900 inline-block text-[11px]">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                  {days.map((day, i) => (
                     <div 
                       key={i} 
                       className={`border-r border-slate-200 dark:border-slate-800/80 last:border-r-0 hover:bg-primary-50/40 dark:hover:bg-primary-950/30 cursor-pointer transition-colors ${isSameDay(day, new Date()) ? 'bg-primary-50/20 dark:bg-primary-950/20' : 'bg-white dark:bg-slate-900/60'}`}
                       onClick={() => handleEmptyCellClick(day, hour)}
                     ></div>
                  ))}
                </div>
              ))}

              {/* Bookings Overlay */}
              <div className="absolute top-0 left-[12.5%] right-0 bottom-0 grid grid-cols-7 pointer-events-none">
                {days.map((day, dayIndex) => {
                  const dayBookings = bookings.filter(b => isSameDay(parseISO(b.start_time), day));
                  return (
                    <div key={dayIndex} className="relative h-full">
                      {dayBookings.map((booking) => {
                        const start = parseISO(booking.start_time);
                        const end = parseISO(booking.end_time);
                        const startHour = getHours(start);
                        const startMin = getMinutes(start);
                        const durationMins = differenceInMinutes(end, start);
                        
                        // Limit display to 7:00 to 21:59
                        if (startHour < 7 || startHour > 21) return null;
                        
                        const top = (startHour - 7) * 48 + (startMin / 60) * 48;
                        const height = (durationMins / 60) * 48;

                        return (
                          <div 
                            key={booking.id}
                            className={`absolute left-1 right-1 rounded border-l-4 p-1.5 overflow-hidden pointer-events-auto cursor-pointer shadow-sm text-xs ${getStatusColor(booking.status)} opacity-90 hover:opacity-100 hover:shadow-md transition-all z-10 hover:z-20 font-sans`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                            }}
                          >
                            <div className="font-bold truncate text-slate-900 leading-tight font-serif">{booking.purpose}</div>
                            <div className="truncate text-[11px] mt-0.5 font-medium text-slate-800">{booking.user_name || booking.borrower_name}</div>
                            <div className="truncate text-[10px] mt-0.5 text-slate-700 font-mono">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in font-serif">
          <div className="glass-card rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 font-header">
              {selectedBooking.purpose}
            </h3>
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 mb-6 font-sans">
              <div className="flex gap-2">
                <span className="font-bold text-slate-900 dark:text-white min-w-[90px] font-mono">Người mượn:</span> 
                <span>{selectedBooking.borrower_name}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-900 dark:text-white min-w-[90px] font-mono">Thời gian:</span> 
                <span className="font-mono">
                  {format(parseISO(selectedBooking.start_time), 'HH:mm')} - {format(parseISO(selectedBooking.end_time), 'HH:mm')}<br/>
                  <span className="text-slate-400 text-xs">{format(parseISO(selectedBooking.start_time), 'dd/MM/yyyy')}</span>
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-bold text-slate-900 dark:text-white min-w-[90px] font-mono">Trạng thái: </span> 
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold font-mono ${getStatusColor(selectedBooking.status)}`}>
                  {STATUS_MAP[selectedBooking.status] || selectedBooking.status}
                </span>
              </div>
              {selectedBooking.note && (
                <div className="flex gap-2">
                  <span className="font-bold text-slate-900 dark:text-white min-w-[90px] font-mono">Ghi chú:</span> 
                  <span className="italic">{selectedBooking.note}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 font-serif">
              <button 
                onClick={() => setSelectedBooking(null)}
                className="inline-flex items-center justify-center px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold leading-none whitespace-nowrap transition-colors cursor-pointer btn-tactile"
              >
                <span>Đóng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetail;
