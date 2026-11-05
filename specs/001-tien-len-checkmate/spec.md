# Feature Specification: Tiến Lên Checkmate & Augments (Đua Điểm 16 & Chọn Lõi)

**Feature**: `001-tien-len-checkmate`  
**Created**: 2026-11-05 | **Updated**: 2026-11-05 (Thêm RBAC & Cyberpunk Art)  
**Status**: Draft  

---

## 1. Executive Summary & Core Rules

Trò chơi bài **Tiến Lên Miền Nam** phong cách **Cyberpunk / Esport Arcade**, kết hợp cơ chế **Roguelike / Lõi Công Nghệ (Augments)**, thể thức **Checkmate 16 Điểm** và **Hệ thống Quản lý Người Dùng Phân Quyền (RBAC)**:
- Mỗi trận gồm nhiều round, mỗi ván 4 người chơi.
- Sau khi chia bài, người chơi xem bài và được chọn **1 trong 3 Lõi Ngẫu Nhiên** (Lõi chỉ tác động lên điểm số).
- **Hệ thống điểm cơ bản mỗi round**:
  - Top 1: +4 điểm
  - Top 2: +2 điểm
  - Top 3: +1 điểm
  - Top 4: 0 điểm
  - **Ăn trắng (Tới trắng)**: Tự động đạt Top 1 và nhận **5 điểm**; 3 người chơi còn lại tiếp tục đánh để phân định Top 2, Top 3, Top 4.
  - **Chặt Heo / Hàng**: Người chặt **cướp điểm trực tiếp** từ người bị chặt (Heo đen: 1 điểm; Heo đỏ: 2 điểm; 3 đôi thông/Tứ quý/4 đôi thông: theo bậc). Điểm số người bị chặt không âm dưới 0.
  - **Thối Heo / Hàng cuối ván**: Người bị thối bị trừ điểm và số điểm phạt chuyển trực tiếp cho người về nhất (Top 1) của round đó.
- **Luật Cân Bằng (Handicap 12 Điểm)**:
  - Khi người chơi đạt $\ge 12$ điểm: Toàn bộ lõi hiện có bị xóa sạch.
  - Từ round sau, người này không được chọn lõi mới mà phải "đánh chay", tạo cơ hội cho người dưới 12 điểm bắt kịp.
- **Luật Checkmate (16 Điểm)**:
  - Khi có ít nhất 1 người chơi đạt $\ge 16$ điểm, trận đấu kích hoạt trạng thái **Checkmate Point**.
  - Tại bất kỳ round nào sau đó, nếu một người chơi đang có $\ge 16$ điểm về **Top 1**, trận đấu lập tức kết thúc!
  - Người đó trở thành **Top 1 Toàn Trận (Quán quân)**. Các vị trí Top 2, Top 3, Top 4 được xếp theo tổng điểm tích lũy.

---

## 2. User Scenarios & Priorities

### User Story 1 - Vòng Đấu Bài Tiến Lên Miền Nam Chuẩn (Priority: P1 - MVP)
Người chơi có thể tham gia ván bài 4 người (chơi cùng 3 Bot AI hoặc người thật):
- Chia 13 lá bài ngẫu nhiên cho mỗi người.
- Hỗ trợ đánh lẻ, đôi, sám, sảnh, 3 đôi thông, tứ quý, 4 đôi thông.
- Kiểm tra hợp lệ lượt đánh, qua lượt, và bắt bài đúng luật TLMN.
- Xử lý ăn trắng (tới trắng) hợp lệ: Người tới trắng lấy Top 1 (5 điểm), bàn đấu tiếp tục với 3 người còn lại.

---

### User Story 2 - Cơ Chế Chọn Lõi Điểm Số & Cướp Điểm Chặt Heo (Priority: P2)
Sau khi chia bài mỗi round:
- **Xem bài trước khi chọn Lõi**: Toàn bộ 13 lá bài của người chơi được hiển thị sắc nét ngay bên dưới bảng chọn Lõi (kèm huy hiệu đếm Heo, Tứ quý và nút thu nhỏ để xem toàn bàn chơi), giúp người chơi nhìn rõ thế bài của mình trước khi chốt định hướng chiến thuật.
- Nếu người chơi có điểm $< 12$, giao diện hiển thị 3 Lõi ngẫu nhiên dưới dạng Holo-Chip Cyberpunk để chọn 1.
- Hiệu ứng Lõi chỉ tính toán khi kết thúc round hoặc khi có sự kiện ghi điểm (chặt heo, về đích, cược điểm).
- Lõi có hạn dùng rõ ràng (1 round hoặc tối đa 2-3 round), không có lõi vĩnh viễn tích dồn vô hạn.
- Cơ chế cướp điểm chặt heo: Khi A chặt heo của B, A được cộng điểm và B bị trừ điểm tương ứng ngay lập tức.

---

### User Story 3 - Giới Hạn 12 Điểm & Checkmate 16 Điểm (Priority: P3)
Theo dõi bảng điểm tổng sau mỗi round:
- Khi người chơi chạm mốc $\ge 12$ điểm: Xóa toàn bộ lõi đang sở hữu, vô hiệu hóa việc chọn lõi ở các round sau.
- Khi người chơi chạm mốc $\ge 16$ điểm: Kích hoạt huy hiệu điện giật vàng "CHECKMATE POINT".
- Khi một người chơi $\ge 16$ điểm về Top 1 ở một round: Trận đấu kết thúc, màn hình vinh danh Quán quân Cyberpunk.

---

### User Story 4 - Cơ Sở Dữ Liệu, Xác Thực & Quản Lý Người Dùng Phân Quyền (RBAC) (Priority: P4)
Hệ thống quản lý tài khoản và phân quyền:
- **Xác thực**: Đăng ký, Đăng nhập, JWT bảo mật, mã hóa mật khẩu bcrypt. Hỗ trợ chơi nhanh Chế độ Khách (Guest).
- **Phân quyền Role**:
  - `ADMIN`: Truy cập trang **Admin Dashboard** để:
    - Xem toàn bộ danh sách người dùng (ID, Username, Role, Trạng thái Active/Banned, Ngày tạo).
    - Khóa / Mở khóa tài khoản người chơi (Ban/Unban).
    - Thăng cấp / Giáng cấp quyền (User $\leftrightarrow$ Admin).
    - Xem lịch sử các ván đấu và thống kê người chơi (Số trận thắng Checkmate, Điểm trung bình).
  - `USER`: Quản lý Profile cá nhân, xem lịch sử đấu, tích lũy huy hiệu danh hiệu Cyberpunk.

---

### User Story 5 - Chế Độ Chơi Bot & Multiplayer Phòng Realtime (Priority: P5)
- **Chế độ Chơi Với Bot**: Mở web là bấm "Chơi Ngay Với Bot", 3 Bot tự động đánh thông minh và tự chọn lõi hợp lý.
- **Chế độ Tạo Phòng (Multiplayer)**: Tạo mã phòng (Room Code), bạn bè nhập mã để cùng vào bàn chơi realtime qua WebSocket.

---

## 3. Phong Cách Thiết Kế (Cyberpunk / Esport Arcade)

1. **Bảng màu chủ đạo**:
   - Background: Dark Onyx / Deep Slate (`#0a0e17`) kết hợp lưới lưới tọa độ mờ (Cyber Grid).
   - Điểm nhấn chính: Neon Cyan (`#00f0ff`), Cyberpunk Yellow / Gold (`#ffb703`), Neon Magenta (`#ff007f`).
2. **Quân bài**:
   - Sử dụng Pure Vector SVG sắc nét, độ tương phản cao, số và chất bài cách điệu kiểu Esport.
   - Khi chọn lá bài: Viền phát sáng ánh neon cyan và nhấc nhẹ lên 12px.
3. **Thẻ Lõi (Augment Chips)**:
   - Tạo hình như các bo mạch Cyberpunk với rãnh vi mạch phát sáng, hiệu ứng hover holographic.
4. **Trạng thái Checkmate 16 Điểm**:
   - Thanh tiến trình điểm từ 0 $\rightarrow$ 16. Tại mốc 12 điểm có vạch cảnh báo "OVERLOAD / PURGED".
   - Tại mốc 16 điểm: Bảng tên bốc hiệu ứng tia điện vàng kim loại và radar quét cảnh báo nguy hiểm.

---

## 4. Danh Mục Lõi Điểm Số (Augment Catalog)

| ID | Tên Lõi (Cyber Code) | Thời hạn | Mô tả hiệu ứng |
| :--- | :--- | :--- | :--- |
| `AUG_TOP1_BOOST` | **Overclock Top 1** | 1 round | Nếu về Top 1 ở round này, nhận thêm +2 điểm (tổng +6 điểm thay vì +4). |
| `AUG_SEC_SAFE` | **Pursuit Protocol** | 2 round | Mỗi khi về Top 2, nhận thêm +1 điểm (tổng +3 điểm). Tự hủy sau 2 round. |
| `AUG_UNDERDOG` | **Emergency Shield** | 1 round | Nếu không may về Top 4, kích hoạt bảo hiểm nhận +1 điểm an ủi. |
| `AUG_HUNTER` | **Bounty Hunter** | 2 round | Mỗi lần chặt heo thành công, cướp thêm +1 điểm từ người bị chặt. |
| `AUG_GAMBIT` | **Hyper Roulette** | 1 round | Cược lớn: Nếu về Top 1 nhận +7 điểm; nếu KHÔNG về Top 1 nhận 0 điểm bất kể thứ hạng. |
| `AUG_SURVIVOR` | **Stealth Matrix** | 2 round | Nếu về Top 2 hoặc Top 3, nhận thêm +1 điểm thưởng sinh tồn. |
| `AUG_PACIFIST` | **Zero Threat** | 1 round | Nếu không chặt heo nào và không bị ai chặt trong ván, được thưởng +1 điểm cuối ván. |
