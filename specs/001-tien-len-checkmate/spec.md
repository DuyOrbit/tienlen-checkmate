# Feature Specification: Tiến Lên Checkmate & Augments (Đua Điểm 16 & Chọn Lõi)

**Feature**: `001-tien-len-checkmate`  
**Created**: 2026-11-05 | **Updated**: 2026-11-05 (Cập nhật Cozy Discord Poker Night Theme & Server Đồng Nhất)  
**Status**: Completed & Verified  

---

## 1. Executive Summary & Core Rules

Trò chơi bài **Tiến Lên Miền Nam** phong cách **Cozy Discord "Poker Night" Party Game**, kết hợp cơ chế **Roguelike / Lõi Thần Kỳ (Augments)**, thể thức **Checkmate 16 Điểm**, hỗ trợ cả **Chơi với Bot** và **Sảnh Chờ Bạn Bè (Multiplayer)** cùng hệ thống **Phân Quyền Admin/User (RBAC)**:
- Mỗi trận gồm nhiều round, mỗi ván 4 người chơi.
- Sau khi chia bài, người chơi được xem trước bộ bài 13 lá của mình và chọn **1 trong 3 Lõi Thần Kỳ** (Lõi tác động lên cơ chế tích điểm).
- **Hệ thống điểm cơ bản mỗi round**:
  - Top 1: +4 điểm
  - Top 2: +2 điểm
  - Top 3: +1 điểm
  - Top 4: 0 điểm
  - **Ăn trắng (Tới trắng)**: Tự động đạt Top 1 và nhận **5 điểm**; 3 người chơi còn lại tiếp tục đánh để phân định Top 2, Top 3, Top 4.
  - **Chặt Heo / Hàng**: Người chặt **cướp điểm trực tiếp** từ người bị chặt:
    - *Quy chuẩn chặt Heo*: Heo đè Heo là đánh bài bình thường, không tính chặt. Chỉ có hàng (Ba đôi thông, Tứ quý, Bốn đôi thông) chặt Heo/chặt Hàng mới tính là Chặt Heo cướp điểm.
    - Heo đen: 1 điểm; Heo đỏ: 2 điểm; Ba đôi thông: 2 điểm; Tứ quý: 3 điểm; Bốn đôi thông: 4 điểm. Điểm số người bị chặt không âm dưới 0.
  - **Thối Heo / Hàng cuối ván**: Người bị thối bị phạt trừ điểm và số điểm phạt chuyển trực tiếp cho người về nhất (Top 1) của round đó.
- **Luật Cân Bằng (Handicap 12 Điểm)**:
  - Khi người chơi đạt $\ge 12$ điểm: Toàn bộ lõi hiện có bị xóa sạch.
  - Từ round sau, người này không được chọn lõi mới mà phải "đánh chay", tạo cơ hội cho đối thủ dưới 12 điểm lội ngược dòng.
- **Luật Checkmate (16 Điểm)**:
  - Khi có ít nhất 1 người chơi đạt $\ge 16$ điểm, trận đấu kích hoạt trạng thái **CHECKMATE!**.
  - Tại bất kỳ round nào sau đó, nếu một người chơi đang có $\ge 16$ điểm về **Top 1**, trận đấu lập tức kết thúc!
  - Người đó đăng quang **Nhà Vô Địch Toàn Trận**. Các vị trí còn lại xếp theo tổng điểm tích lũy.

---

## 2. User Scenarios & Capabilities

### User Story 1 - Vòng Đấu Bài Tiến Lên Chuẩn & Thân Thiện
- Bàn đấu nỉ xanh ấm cúng (Cozy Velvet Felt Table), góc nhìn người chơi ngồi phía Nam.
- Đầy đủ luật TLMN: đánh đơn, đôi, sảnh, sám cô, 3 đôi thông, tứ quý, 4 đôi thông, bỏ lượt (Space), đánh bài (Enter), đè bài đúng thứ tự chất (Bích < Chuồn < Rô < Cơ).

### User Story 2 - Cơ Chế Chọn Lõi Điểm Số & Xem Bài Trực Quan
- Khi mở hộp chọn lõi: Hiển thị bộ bài 13 lá ở thanh chân trang modal, đếm rõ bài có Heo hay không giúp người chơi đưa ra quyết định chuẩn xác.
- Thẻ Lõi thiết kế mềm mại (Cozy Card), phân loại theo 3 nhóm phong cách:
  - **Bứt Tốc** (Màu be / Tên lửa 🚀): Tăng điểm khi về Top 1 / Top 2.
  - **Tấn Công** (Màu hồng đào / Heo mập 🐷): Tăng điểm mỗi khi chặt heo.
  - **Phòng Thủ** (Màu lam pastel / Khiên bảo vệ 🛡️): Chặn phạt, an ủi khi về chót.

### User Story 3 - Chế Độ Chơi & Phòng Chờ Bạn Bè (Multiplayer)
- **Chơi Với Bot**: Bắt đầu ngay lập tức với 3 Bot AI thân thiện (Bắp Rang, Cáo Nhỏ, Thỏ Chill).
- **Tạo Phòng (Sảnh Chờ Riêng Tư)**:
  - Tạo mã phòng 6 ký tự (ví dụ: `#CM1616`).
  - Giao diện 4 ghế ngồi với Avatar thú cưng hoạt hình.
  - Sao chép mã phòng chia sẻ cho bạn bè.
  - Chủ phòng có quyền bấm "+ Bot" để thêm bot vào chỗ trống hoặc bấm "Bắt Đầu Trận Đấu" (thiếu bao nhiêu bot hệ thống tự lấp đầy).
- **Vào Bàn Bằng Mã**: Nút "Nhập mã vào bàn" trên thanh tiêu đề và chân trang, mở modal nhập mã tham gia ngay sảnh chờ.

### User Story 4 - Đường Đua Checkmate & Vinh Danh Đăng Ngôi
- Thanh tiến trình Checkmate 16 điểm mô phỏng đường đua marathon vui nhộn: Avatar các con thú di chuyển dọc đường đua từ 0 đến 16 điểm.
- Vạch kẻ 12 điểm "Mất nâng cấp" (Đánh chay).
- Đích đến 16 điểm có vương miện hoàng gia.
- Màn hình chiến thắng "LÊN NGÔI VƯƠNG CHECKMATE 16!" với pháo hoa giấy rực rỡ (Confetti) và bảng xếp hạng tổng kết chi tiết.

---

## 3. Phong Cách Thiết Kế: Cozy Discord "Poker Night"
- **Nền chính**: Dark Charcoal `#121814` & Deep Forest Green `#161c18`.
- **Mặt bàn bài**: Nỉ Oval xanh lá mượt mà `#1e5638`, viền bàn gỗ nâu ấm `#784f30`.
- **Các nút bấm**: Phong cách Pill mềm mại, hiệu ứng Squishy nhún xuống khi bấm (tactile buttons: `btn-squish-green` `#86efac`, `btn-squish-gray`).
- **Avatar**: Bộ thú cưng tròn trịa đáng yêu (Mèo Mập 🐱, Gấu Bắp Rang 🐻, Cáo Nhỏ 🦊, Thỏ Chill 🐰).
- **Quân bài**: Nền trắng ngà kem `#fdfbf7`, bo góc 12px, font số to rõ ràng; quân Heo 2 có vương miện 👑 vàng nhỏ trang nhã, không che khuất mặt bài.

---

## 4. Kiến Trúc Server Đồng Nhất (Unified Server)
- Máy chủ Node.js + Express + Socket.io chạy trên port `3001`.
- Tự động phục vụ cả:
  - Frontend SPA (được build vào `public/`).
  - REST API (`/api/auth/*`, `/api/admin/*`, `/api/health`).
  - Socket.IO Server realtime.
- Tương thích hoàn hảo cả khi người dùng truy cập:
  - Trực tiếp qua port 3001: `http://localhost:3001`
  - Hoặc qua WampServer: `http://localhost/tienlen`
