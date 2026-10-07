export const STATUS_MAP = {
  pending: { label: 'Chờ duyệt', color: 'status-pending', calColor: 'cal-pending' },
  approved: { label: 'Đã duyệt', color: 'status-approved', calColor: 'cal-approved' },
  rejected: { label: 'Từ chối', color: 'status-rejected', calColor: 'cal-rejected' },
  cancelled: { label: 'Đã hủy', color: 'status-cancelled', calColor: 'cal-cancelled' },
}

export const ROOM_STATUS_MAP = {
  active: { label: 'Hoạt động', color: 'text-green-600 bg-green-50' },
  maintenance: { label: 'Bảo trì', color: 'text-orange-600 bg-orange-50' },
}

export const EQUIPMENT_OPTIONS = [
  'Máy chiếu',
  'Bảng thông minh',
  'Điều hòa',
  'Máy tính',
  'Bảng trắng',
  'Loa',
  'Micro',
  'Webcam',
  'Màn hình TV',
]

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit'
  })
}
