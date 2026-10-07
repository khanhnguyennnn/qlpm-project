import db from './database.js';

console.log('--- Bắt đầu cập nhật danh sách phòng học theo bản đồ Bách Khoa ---');

// Danh sách phòng tương ứng 8 phòng ban đầu (giữ nguyên ID để bảo toàn bookings)
const baseRoomsUpdates = [
  {
    id: 1,
    name: 'Hội trường C1 - Đại Cồ Việt',
    capacity: 150,
    location: 'Tòa C1 - Tầng 2 (Mặt đường Đại Cồ Việt - Cổng Bắc)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']),
    status: 'active',
    description: 'Hội trường trung tâm C1 quy mô lớn phục vụ giảng dạy, đại hội và hội thảo khoa học'
  },
  {
    id: 2,
    name: 'Hội trường C2',
    capacity: 120,
    location: 'Tòa C2 - Tầng 1 (Trục đường Giải Phóng)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro', 'Webcam']),
    status: 'active',
    description: 'Hội trường C2 trang bị âm thanh vòm kỹ thuật số và màn chiếu đại sảnh'
  },
  {
    id: 3,
    name: 'Phòng C3-201',
    capacity: 60,
    location: 'Tòa C3 - Tầng 2',
    equipment: JSON.stringify(['Máy tính', 'Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa']),
    status: 'active',
    description: 'Phòng thực hành máy tính & lập trình đồ họa chuyên sâu tòa C3'
  },
  {
    id: 4,
    name: 'Phòng C5-102',
    capacity: 45,
    location: 'Tòa C5 - Tầng 1',
    equipment: JSON.stringify(['Bảng thông minh', 'Điều hòa', 'Webcam', 'Màn hình TV']),
    status: 'maintenance',
    description: 'Phòng học đa phương tiện đang bảo trì hệ thống điều hòa và kiểm tra thiết bị'
  },
  {
    id: 5,
    name: 'Hội trường Thư viện Tạ Quang Bửu',
    capacity: 200,
    location: 'Thư viện Tạ Quang Bửu - Tầng 4 (Trung tâm khuôn viên)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro', 'Webcam', 'Màn hình TV']),
    status: 'active',
    description: 'Hội trường danh dự Thư viện Tạ Quang Bửu - Không gian hội thảo và học thuật tiêu chuẩn quốc tế'
  },
  {
    id: 6,
    name: 'Phòng D3-201',
    capacity: 55,
    location: 'Tòa D3 - Tầng 2 (Khuôn viên D)',
    equipment: JSON.stringify(['Máy chiếu', 'Máy tính', 'Điều hòa', 'Webcam', 'Loa']),
    status: 'active',
    description: 'Phòng hội thảo chuyên đề trực tuyến và bảo vệ đồ án tốt nghiệp'
  },
  {
    id: 7,
    name: 'Phòng D5-301',
    capacity: 40,
    location: 'Tòa D5 - Tầng 3 (Khu D)',
    equipment: JSON.stringify(['Bảng thông minh', 'Điều hòa', 'Bảng trắng', 'Micro']),
    status: 'active',
    description: 'Phòng học nhóm chuyên đề và nghiên cứu khoa học sinh viên'
  },
  {
    id: 8,
    name: 'Giảng đường B1',
    capacity: 90,
    location: 'Tòa B1 - Tầng 1 (Khu V - Cổng B8 Trần Đại Nghĩa)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']),
    status: 'active',
    description: 'Giảng đường bậc thang công nghệ cao tòa nhà B1 hình cánh cung biểu tượng'
  }
];

// Cập nhật 8 phòng ban đầu
const updateStmt = db.prepare(`
  UPDATE rooms 
  SET name = ?, capacity = ?, location = ?, equipment = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

for (const r of baseRoomsUpdates) {
  updateStmt.run(r.name, r.capacity, r.location, r.equipment, r.status, r.description, r.id);
  console.log(`Đã cập nhật phòng ID ${r.id} -> ${r.name}`);
}

// Danh sách các phòng mới đại diện cho tất cả các tòa còn lại trên bản đồ HUST
const additionalRooms = [
  {
    name: 'Phòng C4-101',
    capacity: 50,
    location: 'Tòa C4 - Tầng 1',
    equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Loa', 'Bảng trắng']),
    status: 'active',
    description: 'Giảng đường tiêu chuẩn sinh viên các ngành kỹ thuật điện - điện tử'
  },
  {
    name: 'Phòng LAB C6 (Thí nghiệm Đa ngành)',
    capacity: 35,
    location: 'Tòa C6 - Tầng 2 (Gần đường Trần Đại Nghĩa)',
    equipment: JSON.stringify(['Máy tính', 'Điều hòa', 'Máy chiếu', 'Webcam']),
    status: 'active',
    description: 'Phòng thí nghiệm đo lường và phát triển hệ thống nhúng tòa C6'
  },
  {
    name: 'Phòng C7-201',
    capacity: 45,
    location: 'Tòa C7 - Tầng 2',
    equipment: JSON.stringify(['Bảng thông minh', 'Điều hòa', 'Máy chiếu', 'Loa']),
    status: 'active',
    description: 'Phòng học lý thuyết và thuyết trình đồ án'
  },
  {
    name: 'Phòng C8-101',
    capacity: 55,
    location: 'Tòa C8 - Tầng 1',
    equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Loa', 'Bảng trắng']),
    status: 'active',
    description: 'Giảng đường học phần cơ sở ngành kỹ thuật'
  },
  {
    name: 'Phòng C9-201 (Cổng Parabol)',
    capacity: 70,
    location: 'Tòa C9 - Tầng 2 (Mặt đường Giải Phóng - Cạnh Cổng Parabol)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']),
    status: 'active',
    description: 'Phòng học đa phương tiện gần cổng Parabol lịch sử'
  },
  {
    name: 'Phòng C10-101',
    capacity: 40,
    location: 'Tòa C10 - Tầng 1',
    equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Bảng trắng']),
    status: 'active',
    description: 'Phòng học nhóm và thảo luận chuyên đề sinh viên'
  },
  {
    name: 'Hội trường HT',
    capacity: 110,
    location: 'Tòa HT (Nối liền giữa C1 và C3)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']),
    status: 'active',
    description: 'Hội trường biểu diễn văn nghệ và sự kiện sinh viên Bách Khoa'
  },
  {
    name: 'Viện Nghiên cứu ITIMS - Phòng Seminar',
    capacity: 35,
    location: 'Tòa ITIMS (Viện Khoa học & Công nghệ Quốc tế)',
    equipment: JSON.stringify(['Bảng thông minh', 'Máy chiếu', 'Điều hòa', 'Webcam', 'Màn hình TV']),
    status: 'active',
    description: 'Phòng hội thảo chuyên gia Viện ITIMS chuẩn nghiên cứu quốc tế'
  },
  {
    name: 'Trung tâm Đào tạo CFC',
    capacity: 40,
    location: 'Tòa CFC (Mặt đường Trần Đại Nghĩa)',
    equipment: JSON.stringify(['Máy tính', 'Máy chiếu', 'Điều hòa', 'Loa']),
    status: 'active',
    description: 'Trung tâm đào tạo chứng chỉ công nghệ và nghề nghiệp CFC'
  },
  {
    name: 'Tòa D2 - Phòng D2-101',
    capacity: 50,
    location: 'Tòa D2 (Gần đường Giải Phóng)',
    equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Loa', 'Bảng trắng']),
    status: 'active',
    description: 'Giảng đường học phần khoa học cơ bản'
  },
  {
    name: 'Tòa D4 - Phòng D4-201',
    capacity: 60,
    location: 'Tòa D4 (Mặt đường Giải Phóng)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa']),
    status: 'active',
    description: 'Phòng học lý thuyết kỹ thuật công nghệ'
  },
  {
    name: 'Tòa D6 - Phòng D6-101',
    capacity: 45,
    location: 'Tòa D6 (Phía tây Hồ Tiền)',
    equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Bảng trắng']),
    status: 'active',
    description: 'Phòng học và trao đổi học thuật'
  },
  {
    name: 'Tòa D7-ITP (Phòng 201)',
    capacity: 55,
    location: 'Tòa D7-ITP (Đường Trần Đại Nghĩa)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']),
    status: 'active',
    description: 'Khu liên hợp ươm tạo công nghệ sáng tạo D7-ITP'
  },
  {
    name: 'Tòa D8 - Phòng D8-201',
    capacity: 50,
    location: 'Tòa D8 (Phía nam khuôn viên D)',
    equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Bảng trắng', 'Loa']),
    status: 'active',
    description: 'Phòng học chuyên ngành kỹ thuật hóa học & môi trường'
  },
  {
    name: 'Tòa D9 - Phòng D9-201 (View Hồ Tiền)',
    capacity: 75,
    location: 'Tòa D9 - Tầng 2 (Trực diện Hồ Tiền)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']),
    status: 'active',
    description: 'Giảng đường hiện đại view hồ Tiền thoáng đãng và truyền cảm hứng'
  },
  {
    name: 'Trung tâm Ngoại ngữ CFL - Phòng Lab',
    capacity: 35,
    location: 'Tòa CFL (Cạnh Hồ Tiền)',
    equipment: JSON.stringify(['Máy tính', 'Điều hòa', 'Máy chiếu', 'Webcam', 'Loa']),
    status: 'active',
    description: 'Phòng thực hành khảo thí ngoại ngữ chuẩn quốc tế'
  },
  {
    name: 'Viện Đào tạo Quốc tế Việt - Đức VDZ',
    capacity: 40,
    location: 'Tòa VDZ (Khu D)',
    equipment: JSON.stringify(['Bảng thông minh', 'Máy chiếu', 'Điều hòa', 'Loa', 'Webcam']),
    status: 'active',
    description: 'Phòng hợp tác đào tạo và giao lưu văn hóa Việt - Đức'
  },
  {
    name: 'Tòa PC - Trung tâm Máy tính Thực hành',
    capacity: 60,
    location: 'Tòa PC (Khu D)',
    equipment: JSON.stringify(['Máy tính', 'Máy chiếu', 'Điều hòa', 'Bảng trắng']),
    status: 'active',
    description: 'Phòng máy tính cấu hình cao phục vụ đồ án công nghệ thông tin'
  },
  {
    name: 'Phòng B6 - B6-101',
    capacity: 45,
    location: 'Tòa B6 (Khu B - Đường Trần Đại Nghĩa)',
    equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Loa', 'Bảng trắng']),
    status: 'active',
    description: 'Phòng học lý thuyết khu giảng đường B'
  },
  {
    name: 'Phòng B7 - B7-201',
    capacity: 50,
    location: 'Tòa B7 (Khu B - Cổng B8)',
    equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa']),
    status: 'active',
    description: 'Phòng học chuyên ngành kỹ thuật cơ khí'
  },
  {
    name: 'Phòng B9 - B9-101',
    capacity: 40,
    location: 'Tòa B9 (Khu B)',
    equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Bảng trắng']),
    status: 'active',
    description: 'Phòng học môn kỹ năng và sinh hoạt học thuật'
  },
  {
    name: 'Phòng Tư vấn Tuyển sinh Bách Khoa',
    capacity: 30,
    location: 'Góc Tuyển sinh - Cổng B8 (Đường Trần Đại Nghĩa)',
    equipment: JSON.stringify(['Màn hình TV', 'Điều hòa', 'Máy tính', 'Webcam']),
    status: 'active',
    description: 'Không gian tiếp đón và tư vấn định hướng tuyển sinh Bách Khoa'
  },
  {
    name: 'Phòng Thí nghiệm Trọng điểm PTN',
    capacity: 30,
    location: 'Khu PTN (Cuối đường Trần Đại Nghĩa)',
    equipment: JSON.stringify(['Máy tính', 'Máy chiếu', 'Điều hòa', 'Bảng thông minh']),
    status: 'active',
    description: 'Phòng thí nghiệm nghiên cứu phát triển trọng điểm'
  }
];

const insertStmt = db.prepare(`
  INSERT INTO rooms (name, capacity, location, equipment, status, description)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const r of additionalRooms) {
  const existing = db.prepare('SELECT id FROM rooms WHERE name = ?').get(r.name);
  if (!existing) {
    insertStmt.run(r.name, r.capacity, r.location, r.equipment, r.status, r.description);
    console.log(`Đã thêm mới phòng: ${r.name}`);
  } else {
    updateStmt.run(r.name, r.capacity, r.location, r.equipment, r.status, r.description, existing.id);
    console.log(`Đã đồng bộ thông tin phòng: ${r.name}`);
  }
}

console.log('--- Hoàn tất cập nhật phòng học HUST thành công! ---');
