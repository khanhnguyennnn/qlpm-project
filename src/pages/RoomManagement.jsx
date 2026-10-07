import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import api from '../utils/api';
import { EQUIPMENT_OPTIONS, ROOM_STATUS_MAP } from '../utils/helpers';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
  const initialFormState = {
    name: '',
    capacity: '',
    location: '',
    description: '',
    equipment: [],
    status: 'active'
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/rooms');
      setRooms(response.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name || '',
        capacity: room.capacity || '',
        location: room.location || '',
        description: room.description || '',
        equipment: room.equipment ? (typeof room.equipment === 'string' ? JSON.parse(room.equipment) : room.equipment) : [],
        status: room.status || 'active'
      });
    } else {
      setEditingRoom(null);
      setFormData(initialFormState);
    }
    setModalOpen(true);
  };

  const handleEquipmentChange = (eq) => {
    const current = formData.equipment;
    if (current.includes(eq)) {
      setFormData({ ...formData, equipment: current.filter(item => item !== eq) });
    } else {
      setFormData({ ...formData, equipment: [...current, eq] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
        equipment: JSON.stringify(formData.equipment)
      };

      if (editingRoom) {
        await api.put(`/api/rooms/${editingRoom.id}`, payload);
      } else {
        await api.post('/api/rooms', payload);
      }
      
      setModalOpen(false);
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Lỗi khi lưu phòng học');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phòng này?')) return;
    
    try {
      await api.delete(`/api/rooms/${id}`);
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Lỗi khi xóa phòng. Có thể phòng đang có lịch mượn.');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoomsList = rooms.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-serif">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-paper-1)] border border-[var(--rule-hair)] text-xs font-mono text-[var(--color-ink-1)] mb-2">
            <span>QUẢN TRỊ CƠ SỞ VẬT CHẤT · HUST SINCE 1956</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
            Quản lý danh mục phòng học <span className="text-[var(--color-accent)]">HUST</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Quản trị thông tin sức chứa, trang thiết bị và chế độ bảo dưỡng của các giảng đường
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl btn--primary text-xs font-bold leading-none whitespace-nowrap shadow-luxury cursor-pointer font-serif btn-tactile"
        >
          <Plus size={16} className="flex-shrink-0" />
          <span>Thêm phòng mới</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 font-sans">
        <input 
          type="text"
          placeholder="Tìm phòng theo tên hoặc vị trí tòa nhà..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-96 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-slate-50/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
        />
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
          {filteredRoomsList.length} / {rooms.length} phòng
        </span>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
          <span className="font-sans">Đang tải danh sách phòng...</span>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-luxury overflow-hidden relative luxury-card-rim">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 uppercase text-[11px] font-black tracking-wider border-b border-slate-200 dark:border-slate-800 font-mono">
                <tr>
                  <th className="py-3.5 px-5">Tên phòng</th>
                  <th className="py-3.5 px-4">Sức chứa</th>
                  <th className="py-3.5 px-4">Vị trí</th>
                  <th className="py-3.5 px-4">Thiết bị</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredRoomsList.map((room) => {
                  let parsedEq = [];
                  try {
                    parsedEq = typeof room.equipment === 'string' ? JSON.parse(room.equipment) : (room.equipment || []);
                  } catch(e) {}
                  
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white font-serif">{room.name}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold font-mono">{room.capacity} chỗ</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs font-medium font-sans">{room.location}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 font-sans">
                          {parsedEq.map((eq, i) => (
                            <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                              {eq}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border font-mono ${
                          room.status === 'active' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' 
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                        }`}>
                          {room.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenModal(room)} 
                            className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition-colors cursor-pointer btn-tactile" 
                            title="Sửa"
                          >
                            <Pencil size={16} className="flex-shrink-0" />
                          </button>
                          <button 
                            onClick={() => handleDelete(room.id)} 
                            className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer btn-tactile" 
                            title="Xóa"
                          >
                            <Trash2 size={16} className="flex-shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-serif">
          <div className="glass-card rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold mb-5 text-slate-900 dark:text-white font-header">
              {editingRoom ? 'Chỉnh sửa phòng học' : 'Thêm phòng học mới'}
            </h2>
            <form onSubmit={handleSubmit} className="font-sans">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                    Tên phòng *
                  </label>
                  <input 
                    type="text" 
                    required 
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-600 text-sm" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                    Sức chứa *
                  </label>
                  <input 
                    type="number" 
                    required 
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-600 text-sm font-mono" 
                    value={formData.capacity} 
                    onChange={e => setFormData({...formData, capacity: e.target.value})} 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                    Vị trí khuôn viên
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-600 text-sm" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
                    Mô tả
                  </label>
                  <textarea 
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-600 text-sm" 
                    rows="3" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                    Trang thiết bị
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(EQUIPMENT_OPTIONS || ['Máy chiếu', 'Điều hòa', 'Máy tính', 'Bảng trắng', 'Loa', 'Micro', 'Webcam', 'Màn hình TV']).map((eq, i) => (
                      <label key={i} className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.equipment.includes(eq)} 
                          onChange={() => handleEquipmentChange(eq)} 
                          className="rounded text-primary-600 focus:ring-primary-500" 
                        />
                        <span>{eq}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                    Trạng thái hoạt động
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        value="active" 
                        checked={formData.status === 'active'} 
                        onChange={(e) => setFormData({...formData, status: e.target.value})} 
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span>Hoạt động</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        value="maintenance" 
                        checked={formData.status === 'maintenance'} 
                        onChange={(e) => setFormData({...formData, status: e.target.value})} 
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span>Bảo trì</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 font-serif">
                <button 
                  type="button" 
                  className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold leading-none whitespace-nowrap text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer btn-tactile" 
                  onClick={() => setModalOpen(false)}
                >
                  <span>Hủy</span>
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center justify-center px-6 py-2.5 text-xs font-bold leading-none whitespace-nowrap text-white bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-700 hover:to-rose-700 rounded-xl transition-all shadow-md shadow-primary-600/25 cursor-pointer btn-tactile"
                >
                  <span>Lưu thông tin phòng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
