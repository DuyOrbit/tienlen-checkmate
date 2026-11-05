# 🃏 TIẾN LÊN CHECKMATE 16 & ROGUELIKE AUGMENTS (CYBERPUNK ARENA)

Game bài **Tiến Lên Miền Nam** phong cách đồ họa **Cyberpunk / Esport Arcade**, kết hợp cơ chế **Chọn Lõi Điểm Số (Point Augments)**, **Luật Cân Bằng 12 Điểm (Đánh Chay)**, **Checkmate 16 Điểm** và hệ thống **Cơ Sở Dữ Liệu MySQL / Phân Quyền Quản Trị (RBAC)**.

Dự án được xây dựng và tuân thủ 100% quy trình **Spec Kit (Specification-Driven Development)**:
- 📜 [Constitution](file:///f:/wamp/www/tienlen/.specify/constitution.md)
- 📋 [Feature Specification](file:///f:/wamp/www/tienlen/specs/001-tien-len-checkmate/spec.md)
- 🗺️ [Implementation Plan](file:///f:/wamp/www/tienlen/specs/001-tien-len-checkmate/plan.md)
- ✅ [Task Checklist](file:///f:/wamp/www/tienlen/specs/001-tien-len-checkmate/tasks.md)

---

## 🎮 CƠ CHẾ GAMEPLAY ĐỘC BÁO

1. **Luật Bài Chuẩn Tiến Lên Miền Nam**:
   - Rác, Đôi, Sám, Sảnh (3+ lá), 3 đôi thông, Tứ quý, 4 đôi thông.
   - Ăn trắng (Sảnh rồng, 4 heo, 6 đôi, đồng màu): Tự động lấy **Top 1 (+5 điểm)**, 3 người còn lại tiếp tục đánh để phân định Top 2, 3, 4.
2. **Cướp Điểm Trực Tiếp Khi Chặt Heo**:
   - Chặt heo đen: Cướp 1 điểm trực tiếp từ đối thủ.
   - Chặt heo đỏ: Cướp 2 điểm trực tiếp từ đối thủ.
   - Chặt đè hàng: Cướp 3 điểm trực tiếp từ đối thủ.
   - Thối heo cuối ván: Điểm phạt chuyển thẳng cho người về Top 1 của round.
3. **Cơ Chế Chọn Lõi Điểm Số (Augments)**:
   - Mỗi round sau khi chia bài, người chơi được chọn 1 trong 3 Lõi công nghệ ngẫu nhiên (chỉ tác động lên điểm số, không đổi luật bài).
   - Danh mục lõi: *Overclock Top 1, Pursuit Protocol, Emergency Shield, Bounty Hunter, Hyper Roulette, Stealth Matrix, Zero Threat*.
4. **Luật Cân Bằng 12 Điểm (Handicap / Đánh Chay)**:
   - Khi người chơi đạt $\ge 12$ điểm: Toàn bộ Lõi tích lũy bị tước sạch, từ đó về sau **không được chọn Lõi nữa** mà phải đánh chay để người chơi khác bắt kịp.
5. **Luật Checkmate 16 Điểm (Vô Địch Toàn Trận)**:
   - Khi có người đạt $\ge 16$ điểm, trạng thái **MATCH POINT** kích hoạt.
   - Ván đấu chỉ kết thúc khi một người $\ge 16$ điểm giành **Top 1** trong round đó!

---

## 🗄️ CƠ SỞ DỮ LIỆU MYSQL & PHÂN QUYỀN RBAC

- **File SQL chạy trực tiếp**: [`tienlen_checkmate.sql`](file:///f:/wamp/www/tienlen/tienlen_checkmate.sql) (được cập nhật liên tục sau mỗi lần thay đổi code).
- **Cách import nhanh vào phpMyAdmin**:
  1. Mở trình duyệt vào `http://localhost/phpmyadmin`.
  2. Bấm vào tab **Import** (Nhập) $\rightarrow$ Chọn file `tienlen_checkmate.sql` $\rightarrow$ Bấm **Go** (Thực hiện).
  3. Hoặc vào tab **SQL**, sao chép toàn bộ nội dung file `tienlen_checkmate.sql` dán vào và nhấn **Go**.
- **Các bảng trong CSDL**:
  - `users`: Tài khoản, mật khẩu băm bcrypt, role (`USER` / `ADMIN`), trạng thái `isBanned`.
  - `user_stats`: Thống kê số trận đấu, số lần vô địch Checkmate, tổng điểm.
  - `matches` & `match_players`: Toàn bộ lịch sử các ván bài đã lưu.
- **Admin Dashboard trên Web**: Đăng nhập bằng tài khoản Admin để mở bảng quản trị trực quan ngay trên web (khóa/mở khóa tài khoản, đổi role, xem số liệu).
  - **Tài khoản Admin mặc định**:
    - Username: `admin`
    - Mật khẩu: `admin123`

---

## 🚀 HƯỚNG DẪN KHỞI ĐỘNG VỚI WAMP

### Cách chơi trực tiếp trên WampServer (`http://localhost/tienlen`)
1. Bật **WampServer** (đảm bảo icon màu xanh lá trên thanh Taskbar để Apache và MySQL hoạt động).
2. Nhấp đúp vào file [`start-game.bat`](file:///f:/wamp/www/tienlen/start-game.bat) để khởi chạy Backend xử lý Socket realtime và MySQL.
3. Mở trình duyệt truy cập ngay vào:
   👉 **`http://localhost/tienlen`**

Game sẽ tải trực tiếp thông qua máy chủ Apache của WAMP, kết nối Socket.io và cơ sở dữ liệu MySQL `tienlen_checkmate`!

---

### Khởi động bằng dòng lệnh:
```bash
# Tại thư mục gốc:
npm start
```
- **WAMP Web URL**: `http://localhost/tienlen`
- **Vite Dev URL**: `http://localhost:5173`
- **Backend API & Socket**: `http://localhost:3001`

