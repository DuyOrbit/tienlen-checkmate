# Tasks: Tiến Lên Checkmate & Augments

**Input**: [spec.md](file:///f:/wamp/www/tienlen/specs/001-tien-len-checkmate/spec.md), [plan.md](file:///f:/wamp/www/tienlen/specs/001-tien-len-checkmate/plan.md)

## Phase 1: Setup, MySQL Database & Authentication (Foundational)
- [x] T001 Khởi tạo cấu trúc monorepo `server/`, `client/` và package.json gốc.
- [x] T002 Cấu hình Prisma ORM với MySQL (WAMP Server port 3306), tạo schema (User, Role, UserStats, Match, MatchPlayer) và tạo script khởi tạo database `tienlen_checkmate`.
- [x] T003 Xây dựng Auth Module: Đăng ký, Đăng nhập (JWT + bcrypt), Middleware phân quyền `requireAuth` và `requireAdmin`. Tự động tạo tài khoản Admin mặc định khi khởi chạy.
- [x] T004 Xây dựng Admin API: Lấy danh sách người dùng, Khóa/Mở khóa tài khoản, Đổi quyền Role, Thống kê hệ thống.

## Phase 2: Core Game Engine & Augment System
- [x] T005 Xây dựng module Card Engine: Định nghĩa quân bài (Suit, Rank, Value), xáo bài, chia bài.
- [x] T006 Xây dựng TLMN Combo Evaluator: Nhận diện lá lẻ, đôi, sám cô, sảnh, 3 đôi thông, tứ quý, 4 đôi thông, kiểm tra nước đi đè/chặt hợp lệ.
- [x] T007 Xây dựng module Ăn Trắng: Nhận diện sảnh rồng, 5 đôi thông, 6 đôi, tứ quý heo... và chuyển trạng thái Top 1 (+5 điểm) cho người ăn trắng.
- [x] T008 Xây dựng Heuristic Bot AI: Quyết định nước đi hợp lý (đánh bài nhỏ, giữ hàng, chặt heo, bỏ lượt).
- [x] T009 Xây dựng Augment Catalog: Danh mục lõi điểm số (1 round, 2-3 round, cược điểm, bảo hiểm).
- [x] T010 Xây dựng Score & Penalty Manager:
  - Cướp điểm tức thì khi chặt heo/hàng (sàn điểm = 0)
  - Phạt thối heo/hàng cuối ván chuyển điểm cho Top 1
  - Tính điểm thứ hạng round (+4, +2, +1, 0)
  - Kích hoạt Lõi điểm số sau round
- [x] T011 Xây dựng cơ chế Giới Hạn 12 Điểm & Checkmate 16 Điểm:
  - Tước toàn bộ lõi và khóa chọn lõi khi $\ge 12$ điểm (Đánh chay)
  - Kích hoạt Match Point khi $\ge 16$ điểm
  - Game Over khi người $\ge 16$ điểm giành Top 1

## Phase 3: Cyberpunk / Esport Arcade Frontend (React + Tailwind CSS)
- [x] T012 Cấu hình theme Cyberpunk trong Tailwind: Dark Onyx, Neon Cyan, Cyber Gold, Neon Magenta, hiệu ứng Glow & Cyber Grid.
- [x] T013 Xây dựng UI Đăng nhập / Đăng ký / Chơi Khách và Admin Dashboard quản trị người dùng.
- [x] T014 Xây dựng Game Board UI: Bàn bài Tiến Lên 4 góc (1 người chơi + 3 đối thủ).
- [x] T015 Xây dựng Card Component & Hand Interaction: Hiển thị quân bài SVG vector sắc nét, chọn bài phát sáng neon, nút Đánh bài / Bỏ lượt.
- [x] T016 Xây dựng Modal Chọn Lõi (Holo-Chip Style): 3 chip vi mạch phát sáng với icon, mô tả và nút chọn.
- [x] T017 Xây dựng Scoreboard & Checkmate Tracker: Thanh tiến trình 16 điểm, huy hiệu Match Point điện giật vàng.
- [x] T018 Xây dựng Round Summary & Cyberpunk Victory Modal.

## Phase 4: Multiplayer WebSocket Server
- [x] T019 Xây dựng Room Manager trên Socket.io: Tạo phòng, vào phòng bằng mã, tự động thêm Bot khi thiếu người.
- [x] T020 Đồng bộ Realtime Game State: Phát bài, gửi lượt đánh, thông báo chặt heo, chọn lõi và kết quả round qua Socket.

## Phase 5: Verification & Polish
- [x] T021 Kiểm thử toàn bộ game loop với Bot: Đánh liên tục nhiều round, kích hoạt 12 điểm, kích hoạt Checkmate 16 điểm và kết thúc trận.
- [x] T022 Tinh chỉnh âm thanh (SFX), hiệu ứng ăn điểm và giao diện mobile/desktop.
