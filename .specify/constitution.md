# Tiến Lên Checkmate & Augments - Constitution

## Core Principles

### I. Pure Card Gameplay (Luật Bài Thuần Túy)
Luật bài Tiến Lên Miền Nam (TLMN) được giữ nguyên bản 100%:
- Thứ tự chất: Cơ > Rô > Chuồn > Bích; quân 2 (Heo) lớn nhất, 3 nhỏ nhất.
- Bộ hợp lệ: Rác, Đôi, Sám cô, Sảnh (3 lá trở lên, không nối K-A-2), 3 đôi thông, Tứ quý, 4 đôi thông.
- Luật chặt: 3 đôi thông chặt 1 heo hoặc 3 đôi thông nhỏ hơn; Tứ quý chặt 1 heo, đôi heo, 3 đôi thông hoặc tứ quý nhỏ hơn; 4 đôi thông chặt 1 heo, đôi heo, 3 đôi thông, tứ quý hoặc 4 đôi thông nhỏ hơn (và chặt không cần vòng).
- Ăn trắng (Tới trắng): Sảnh rồng, 5 đôi thông, 6 đôi bất kỳ, tứ quý 2, 4 sám cô... Khi ăn trắng, người chơi lập tức giành Top 1 (thưởng 5 điểm); 3 người chơi còn lại tiếp tục đánh tiếp để tranh Top 2, Top 3, Top 4.

### II. Decoupled Augments - Score Only (Lõi Công Nghệ Tách Biệt - Chỉ Tác Động Điểm)
- Lõi (Augments) TUYỆT ĐỐI KHÔNG làm biến dạng luật bài, bộ bài hay quyền ưu tiên ra bài.
- Lõi CHỈ tác động vào hệ thống tính điểm, cược điểm, thưởng/phạt hoặc bảo hiểm điểm số.
- Không tồn tại lõi vĩnh viễn vô tận. Lõi chỉ kéo dài theo round (1 round) hoặc số lượt kích hoạt giới hạn (2-3 round) để tránh lạm dụng chuỗi thua.

### III. Handicap & Checkmate Governance (Cân Bằng 12 Điểm & Checkmate 16 Điểm)
- **Luật Cân Bằng (12 Điểm)**: Người chơi đạt $\ge 12$ điểm bị tước toàn bộ lõi đang có và không được chọn lõi mới ở các round sau ("Đánh chay").
- **Luật Checkmate (16 Điểm)**: Ngưỡng 16 điểm mở ra Match Point. Ván đấu chỉ kết thúc khi một người $\ge 16$ điểm giành Top 1 trong round đó.

### IV. Dual Play Mode (Hỗ Trợ Đầy Đủ Bot AI & Multiplayer Realtime)
- Hệ thống hỗ trợ chơi ngay lập tức với 3 Bot AI (Offline/Singleplayer) hoặc mở phòng chia sẻ mã phòng để chơi nhiều người qua WebSocket (Socket.io).
- Bot AI phải tuân thủ đúng luật, biết giữ heo/hàng, biết bắt bài và biết cân nhắc chọn lõi phù hợp với bài trên tay.

### V. Authentication & Role-Based Access Control (RBAC) trên MySQL
- Cơ sở dữ liệu chính thức: **MySQL** (tích hợp WAMP Server).
- Mật khẩu mã hóa an toàn (`bcrypt`), xác thực qua JWT.
- Phân quyền rõ ràng:
  - `ADMIN`: Quản lý danh sách người chơi, phân quyền, khóa/mở khóa tài khoản, xem thống kê các trận đấu (cả trên Web Admin Dashboard lẫn trực tiếp qua phpMyAdmin / MySQL).
  - `USER`: Đăng nhập, lưu lịch sử thành tích, tham gia thi đấu với Bot hoặc người khác.
  - `GUEST`: Cho phép chơi nhanh thử nghiệm với Bot mà không cần tạo tài khoản.

### VI. Visual Identity - Cyberpunk / Esport Arcade
- Sử dụng Pure Vector SVG + CSS Tailwind + Framer Motion.
- Bảng màu: Dark Slate nền (`#0a0e17`), Neon Cyan (`#00f0ff`), Cyber Amber/Gold (`#ffb703`), Hot Pink/Magenta (`#ff007f`).
- Tuyệt đối không dùng ảnh AI rời rạc để đảm bảo độ sắc nét, tốc độ tải tức thì và tính đồng bộ.

### VII. Continuous SQL Schema Synchronization (Đồng Bộ SQL Liên Tục)
- File [`tienlen_checkmate.sql`](file:///f:/wamp/www/tienlen/tienlen_checkmate.sql) tại thư mục gốc là bản chuẩn (Single Source of Truth) để người dùng import và kiểm soát trực tiếp trên phpMyAdmin / MySQL.
- Bất cứ khi nào code thay đổi liên quan đến cấu trúc bảng, trường dữ liệu, quan hệ hoặc dữ liệu khởi tạo, agent BẮT BUỘC phải đồng bộ và cập nhật ngay lập tức vào file `tienlen_checkmate.sql`.

## Technology Stack
- **Database**: **MySQL** (WAMP Server port 3306), kết nối qua Prisma ORM / mysql2
- **Runtime & Backend**: Node.js, Express, Socket.io, JWT, bcryptjs
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **State Management & Engine**: Pure TypeScript Game Engine

**Version**: 1.2.0 | **Ratified**: 2026-11-05
