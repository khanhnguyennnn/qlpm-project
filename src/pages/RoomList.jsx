import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, Users, Eye, CalendarPlus, Search, Filter, 
  Monitor, Sparkles, Check, Info, Tv, Map, X,
  Building2, GraduationCap, Compass, Layers, AlertTriangle, RefreshCw
} from 'lucide-react';
import api from '../utils/api';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState([]);
  const [zoneFilter, setZoneFilter] = useState('all'); // all, zone-c, zone-d, zone-b
  const [mapModalOpen, setMapModalOpen] = useState(false);
  
  const allEquipment = [
    'Máy chiếu',
    'Bảng thông minh',
    'Điều hòa',
    'Máy tính',
    'Bảng trắng',
    'Loa',
    'Micro',
    'Webcam',
    'Màn hình TV'
  ];

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/rooms');
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách phòng:', err);
      if (err.response) {
        setError(err.response.data?.error || `Lỗi máy chủ HTTP ${err.response.status}. Vui lòng thử lại.`);
      } else {
        setError('Không thể kết nối đến máy chủ Backend (Port 3001). Vui lòng đảm bảo Backend đang chạy (dùng lệnh "npm run dev").');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const toggleEquipment = (eq) => {
    setEquipmentFilter(prev => 
      prev.includes(eq) ? prev.filter(item => item !== eq) : [...prev, eq]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCapacityFilter('all');
    setEquipmentFilter([]);
    setZoneFilter('all');
  };

  // Helper to determine zone
  const getRoomZone = (room) => {
    const text = (room.name + ' ' + (room.location || '')).toLowerCase();
    if (text.includes('c1') || text.includes('c2') || text.includes('c3') || text.includes('c4') || 
        text.includes('c5') || text.includes('c6') || text.includes('c7') || text.includes('c8') || 
        text.includes('c9') || text.includes('c10') || text.includes('cfc') || text.includes('itims') || 
        text.includes('tòa c') || text.includes('hội trường ht')) {
      return { id: 'zone-c', name: 'Khu C (Cổng Bắc - Đại Cồ Việt)', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (text.includes('tạ quang bửu') || text.includes('hồ tiền') || text.includes('d1') || 
        text.includes('d2') || text.includes('d3') || text.includes('d4') || text.includes('d5') || 
        text.includes('d6') || text.includes('d7') || text.includes('d8') || text.includes('d9') || 
        text.includes('tòa d') || text.includes('cfl') || text.includes('vdz') || text.includes('tòa pc')) {
      return { id: 'zone-d', name: 'Khu D & Thư viện Tạ Quang Bửu', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
    if (text.includes('b1') || text.includes('b5') || text.includes('b6') || text.includes('b7') || 
        text.includes('b8') || text.includes('b9') || text.includes('tòa b') || text.includes('tuyển sinh') || text.includes('ptn')) {
      return { id: 'zone-b', name: 'Khu B (Trần Đại Nghĩa - Cổng B8)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    return { id: 'other', name: 'Khu vực Đào tạo', color: 'bg-slate-50 text-slate-800 border-slate-200' };
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    
    let matchesCapacity = true;
    if (capacityFilter === 'small') matchesCapacity = room.capacity < 45;
    else if (capacityFilter === 'medium') matchesCapacity = room.capacity >= 45 && room.capacity <= 75;
    else if (capacityFilter === 'large') matchesCapacity = room.capacity > 75;

    const matchesEquipment = equipmentFilter.length === 0 || 
      equipmentFilter.every(eq => Array.isArray(room.equipment) && room.equipment.includes(eq));

    const zone = getRoomZone(room);
    const matchesZone = zoneFilter === 'all' || zone.id === zoneFilter;

    return matchesSearch && matchesStatus && matchesCapacity && matchesEquipment && matchesZone;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-7 animate-fade-in font-serif">
      {/* Top Banner & Header */}
      <div className="relative rounded-2xl bg-[var(--color-paper-1)] text-[var(--color-ink-0)] p-6 sm:p-8 border border-[var(--rule-soft)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-paper-2)] border border-[var(--rule-hair)] text-xs font-mono text-[var(--color-ink-1)]">
              <Compass className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>TRƯỜNG ĐIỆN - ĐIỆN TỬ · HUST SINCE 1956</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink-0)] font-display">
              Danh mục Giảng đường &amp; Phòng học <span className="text-[var(--color-accent)] font-mono text-xl sm:text-2xl">({rooms.length} phòng)</span>
            </h1>
            <p className="text-sm text-[var(--color-ink-1)] leading-relaxed font-sans">
              Toàn bộ phòng học, hội trường và phòng thực hành được chuẩn hóa theo vị trí sơ đồ khuôn viên Bách Khoa: Khu C, Khu D, Thư viện Tạ Quang Bửu và Khu B.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setMapModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-paper-0)] hover:bg-[var(--color-paper-2)] border border-[var(--rule-hair)] text-[var(--color-ink-0)] text-xs font-semibold leading-none whitespace-nowrap transition-all shadow-xs cursor-pointer btn-tactile"
            >
              <Map className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
              <span>Sơ đồ khuôn viên HUST</span>
            </button>
            <Link 
              to="/booking/new" 
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn--primary text-xs font-bold leading-none whitespace-nowrap shadow-md cursor-pointer btn-tactile"
            >
              <CalendarPlus className="w-4 h-4 flex-shrink-0" />
              <span>Đặt phòng ngay</span>
            </Link>
          </div>
        </div>

        {/* Zone Quick Tabs */}
        <div className="mt-6 pt-5 border-t border-[var(--rule-hair)] flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-[var(--color-ink-2)] uppercase tracking-wider mr-2 flex items-center gap-1.5 font-mono">
            <Layers className="w-3.5 h-3.5" /> Phân khu:
          </span>
          <button
            onClick={() => setZoneFilter('all')}
            className={`inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-semibold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
              zoneFilter === 'all'
                ? 'bg-[var(--color-accent)] text-white shadow-xs'
                : 'bg-[var(--color-paper-0)] text-[var(--color-ink-1)] hover:text-[var(--color-ink-0)] border border-[var(--rule-hair)]'
            }`}
          >
            <span>Tất cả khuôn viên</span>
          </button>
          <button
            onClick={() => setZoneFilter('zone-c')}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
              zoneFilter === 'zone-c'
                ? 'bg-[var(--color-accent)] text-white shadow-xs'
                : 'bg-[var(--color-paper-0)] text-[var(--color-ink-1)] hover:text-[var(--color-ink-0)] border border-[var(--rule-hair)]'
            }`}
          >
            <span>Khu C (C1 - C10, HT, CFC)</span>
          </button>
          <button
            onClick={() => setZoneFilter('zone-d')}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
              zoneFilter === 'zone-d'
                ? 'bg-[var(--color-accent)] text-white shadow-xs'
                : 'bg-[var(--color-paper-0)] text-[var(--color-ink-1)] hover:text-[var(--color-ink-0)] border border-[var(--rule-hair)]'
            }`}
          >
            <span>Khu D &amp; Tạ Quang Bửu</span>
          </button>
          <button
            onClick={() => setZoneFilter('zone-b')}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
              zoneFilter === 'zone-b'
                ? 'bg-[var(--color-accent)] text-white shadow-xs'
                : 'bg-[var(--color-paper-0)] text-[var(--color-ink-1)] hover:text-[var(--color-ink-0)] border border-[var(--rule-hair)]'
            }`}
          >
            <span>Khu B &amp; PTN</span>
          </button>
        </div>
      </div>

      {/* Feature Fast Filters */}
      <div className="flex flex-wrap gap-2 items-center glass-card p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mr-2 font-mono">
          <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          Tiện ích nổi bật:
        </span>
        <button
          onClick={() => toggleEquipment('Bảng thông minh')}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
            equipmentFilter.includes('Bảng thông minh')
              ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
              : 'bg-slate-50 dark:bg-slate-800/80 border border-primary-200/70 dark:border-primary-900/50 text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-950/40'
          }`}
        >
          <Tv className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <span>Bảng thông minh</span>
          {equipmentFilter.includes('Bảng thông minh') && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        <button
          onClick={() => toggleEquipment('Máy chiếu')}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
            equipmentFilter.includes('Máy chiếu')
              ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
              : 'bg-slate-50 dark:bg-slate-800/80 border border-primary-200/70 dark:border-primary-900/50 text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-950/40'
          }`}
        >
          <Monitor className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <span>Máy chiếu HD</span>
          {equipmentFilter.includes('Máy chiếu') && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        <button
          onClick={() => toggleEquipment('Máy tính')}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold leading-none whitespace-nowrap transition-all cursor-pointer btn-tactile ${
            equipmentFilter.includes('Máy tính')
              ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
              : 'bg-slate-50 dark:bg-slate-800/80 border border-primary-200/70 dark:border-primary-900/50 text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-950/40'
          }`}
        >
          <span>Phòng thực hành máy tính</span>
          {equipmentFilter.includes('Máy tính') && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        {(equipmentFilter.length > 0 || searchTerm || statusFilter !== 'all' || capacityFilter !== 'all' || zoneFilter !== 'all') && (
          <button
            onClick={clearAllFilters}
            className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-bold leading-none whitespace-nowrap cursor-pointer btn-tactile"
          >
            Đặt lại tất cả bộ lọc
          </button>
        )}
      </div>

      {/* Main Filter Control Box */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên phòng, vị trí (VD: Hội trường C1, Tòa D9, Thư viện...)"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50/70 dark:bg-slate-800/60 placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white dark:focus:bg-slate-800 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sức chứa */}
          <div className="md:col-span-3">
            <select
              className="block w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 font-medium"
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
            >
              <option value="all">Mọi quy mô sức chứa</option>
              <option value="small">Quy mô vừa & nhỏ (&lt; 45 chỗ)</option>
              <option value="medium">Quy mô tiêu chuẩn (45 - 75 chỗ)</option>
              <option value="large">Hội trường lớn (&gt; 75 chỗ)</option>
            </select>
          </div>

          {/* Trạng thái */}
          <div className="md:col-span-3">
            <select
              className="block w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="maintenance">Đang bảo trì</option>
            </select>
          </div>
        </div>
        
        {/* Full Equipment Tag Filter */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mr-2 font-mono">
            <Filter className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400"/> Chi tiết thiết bị:
          </span>
          {allEquipment.map(eq => {
            const isSelected = equipmentFilter.includes(eq);
            return (
              <button
                key={eq}
                onClick={() => toggleEquipment(eq)}
                className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold leading-none whitespace-nowrap border transition-all cursor-pointer btn-tactile ${
                  isSelected
                    ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <span>{eq}</span>
                {isSelected && <Check className="w-3 h-3 text-white flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="p-6 rounded-3xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-sm">Không thể tải danh sách phòng học</h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-sans leading-relaxed">{error}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                Gợi ý: Mở terminal dự án và chạy <code className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/60 rounded text-rose-700 dark:text-rose-300 font-bold">npm run dev</code> để khởi động đồng thời cả Backend (Port 3001) và Frontend (Port 5173).
              </p>
            </div>
            <button
              onClick={fetchRooms}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer btn-tactile shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Danh mục phòng */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="animate-spin w-10 h-10 border-3 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Đang đồng bộ dữ liệu giảng đường Bách Khoa...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => {
            const zone = getRoomZone(room);
            const isSpecial = room.capacity >= 90 || room.name.includes('Thư viện') || room.name.includes('Hội trường');

            return (
              <div 
                key={room.id} 
                className="glass-card rounded-3xl overflow-hidden flex flex-col group border border-slate-200/90 dark:border-slate-800 hover:border-primary-400/80 dark:hover:border-primary-500/80 interactive-card sheen-parent relative luxury-card-rim"
              >
                {/* Header card with highlight indicators */}
                <div className="p-5.5 flex-1 space-y-3.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border font-mono ${zone.color}`}>
                          {zone.id === 'zone-c' ? 'Khu C' : zone.id === 'zone-d' ? 'Khu D' : zone.id === 'zone-b' ? 'Khu B' : 'HUST'}
                        </span>
                        {isSpecial && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--color-accent-tint)] text-[var(--color-accent)] font-mono border border-[var(--rule-hair)]">
                            Phòng trọng điểm
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight font-header">
                        {room.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-sans">
                        {room.description || 'Giảng đường tiêu chuẩn trường ĐH Bách Khoa Hà Nội'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full flex-shrink-0 font-mono inline-flex items-center gap-1.5 ${
                      room.status === 'active' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50' 
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${room.status === 'active' ? 'bg-emerald-500 shadow-glow' : 'bg-amber-500'}`}></span>
                      {room.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                    </span>
                  </div>
                  
                  {/* Capacity & Location */}
                  <div className="space-y-2 py-2.5 border-y border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 font-sans">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2.5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{room.capacity} chỗ ngồi</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2.5 text-rose-500 flex-shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300">{room.location || 'Khuôn viên Bách Khoa'}</span>
                    </div>
                  </div>

                  {/* Thiết bị có sẵn */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-mono">
                      Trang thiết bị phòng:
                    </p>
                    <div className="flex flex-wrap gap-1.5 font-sans">
                      {Array.isArray(room.equipment) && room.equipment.map((eq, i) => {
                        return (
                          <span 
                            key={i} 
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                          >
                            {eq === 'Bảng thông minh' && <Tv className="w-3 h-3 text-primary-600 dark:text-primary-400" />}
                            {eq === 'Máy chiếu' && <Monitor className="w-3 h-3 text-primary-600 dark:text-primary-400" />}
                            {eq}
                          </span>
                        );
                      })}
                      {(!room.equipment || room.equipment.length === 0) && (
                        <span className="text-xs text-slate-400 italic">Thiết bị tiêu chuẩn</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 p-4 bg-slate-50/70 dark:bg-slate-900/60 flex items-center gap-2.5">
                  <Link 
                    to={`/rooms/${room.id}`} 
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-xl text-xs font-bold leading-none text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs cursor-pointer btn-tactile whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Lịch tuần</span>
                  </Link>
                  {room.status === 'active' ? (
                    <Link 
                      to={`/booking/new?room=${room.id}`} 
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl btn--primary text-xs font-bold leading-none whitespace-nowrap shadow-sm cursor-pointer btn-tactile"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Đặt mượn</span>
                    </Link>
                  ) : (
                    <button 
                      disabled 
                      className="flex-1 inline-flex items-center justify-center px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 text-xs font-bold leading-none whitespace-nowrap rounded-xl cursor-not-allowed"
                    >
                      <span>Bảo trì</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredRooms.length === 0 && (
            <div className="col-span-full p-16 text-center text-slate-500 glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <Info className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-serif">
                {rooms.length === 0 ? 'Chưa có phòng học nào trong hệ thống' : 'Không tìm thấy phòng học phù hợp'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {rooms.length === 0 
                  ? 'Cơ sở dữ liệu phòng học hiện đang rỗng hoặc chưa đồng bộ được với Backend.'
                  : 'Không có phòng nào thỏa mãn các bộ lọc hiện tại. Bạn có thể xóa bộ lọc để xem toàn bộ danh mục phòng học.'}
              </p>
              {rooms.length > 0 ? (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-xs font-bold leading-none whitespace-nowrap rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors cursor-pointer btn-tactile"
                >
                  <span>Xóa tất cả bộ lọc</span>
                </button>
              ) : (
                <button
                  onClick={fetchRooms}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-xs font-bold leading-none whitespace-nowrap rounded-xl hover:bg-primary-700 transition-colors cursor-pointer btn-tactile shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tải lại dữ liệu</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Sơ đồ khuôn viên Đại học Bách Khoa Hà Nội */}
      {mapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in font-serif">
          <div className="relative w-full max-w-4xl glass-card rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-spring-popup flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-rose-950 to-slate-950 text-white flex items-center justify-between border-b border-rose-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary-500/20 border border-primary-500/30 text-rose-300">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-header">
                    Sơ Đồ Khuôn Viên Đại Học Bách Khoa Hà Nội
                  </h3>
                  <p className="text-xs text-rose-200/80 font-sans">
                    Bản đồ định vị các tòa nhà Khu C, Khu D, Thư viện Tạ Quang Bửu, Khu B
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMapModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Campus Image */}
            <div className="p-4 overflow-y-auto bg-slate-100 dark:bg-slate-950/80 flex-1 flex flex-col items-center justify-center">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-300 dark:border-slate-700 max-h-[65vh] bg-white">
                <img 
                  src="/campus-map.png" 
                  alt="Sơ đồ khuôn viên Đại học Bách Khoa Hà Nội" 
                  className="w-full h-auto object-contain max-h-[65vh]"
                />
              </div>

              {/* Legend */}
              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>Khu C: C1 - C10, HT, CFC</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span>Khu D: D1 - D9, Hồ Tiền</span>
                </div>
                <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900/50 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary-600"></span>
                  <span>Thư viện Tạ Quang Bửu</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Khu B: B1, B6 - B9, Tuyển sinh</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setMapModalOpen(false)}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-700 hover:to-rose-700 text-white text-xs font-bold leading-none whitespace-nowrap transition-all shadow-md shadow-primary-600/25 cursor-pointer font-serif btn-tactile"
              >
                <span>Đóng sơ đồ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;
