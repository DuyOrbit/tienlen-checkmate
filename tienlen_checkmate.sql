-- ========================================================
-- CƠ SỞ DỮ LIỆU MYSQL CHO GAME TIẾN LÊN CHECKMATE 16 & AUGMENTS
-- Phiên bản: 1.0.0
-- Tương thích: MySQL 5.7+ / MariaDB / WampServer / phpMyAdmin
-- Mã hóa: UTF-8 Unicode (utf8mb4_unicode_ci)
-- ========================================================

-- 1. Tạo Database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS `tienlen_checkmate`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `tienlen_checkmate`;

-- Tắt kiểm tra khóa ngoại tạm thời để khởi tạo/reset an toàn
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================================
-- 2. BẢNG `users` - Danh sách người dùng & Phân quyền RBAC
-- ========================================================
DROP TABLE IF EXISTS `match_players`;
DROP TABLE IF EXISTS `matches`;
DROP TABLE IF EXISTS `user_stats`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL COMMENT 'UUID duy nhất của người dùng',
  `username` VARCHAR(50) NOT NULL COMMENT 'Tên đăng nhập (duy nhất)',
  `email` VARCHAR(100) NULL COMMENT 'Email người chơi',
  `passwordHash` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu băm an toàn bằng bcrypt',
  `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER' COMMENT 'Quyền hạn: USER (người chơi) hoặc ADMIN (quản trị)',
  `isBanned` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0: Hoạt động, 1: Bị Admin khóa tài khoản',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Ngày tạo tài khoản',
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'Ngày cập nhật thông tin',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng quản lý tài khoản người chơi và phân quyền';

-- ========================================================
-- 3. BẢNG `user_stats` - Thống kê thành tích Checkmate & Điểm số
-- ========================================================
CREATE TABLE `user_stats` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL COMMENT 'Tham chiếu sang bảng users',
  `matchesPlayed` INT NOT NULL DEFAULT 0 COMMENT 'Tổng số trận đấu đã tham gia',
  `checkmateWins` INT NOT NULL DEFAULT 0 COMMENT 'Số lần đạt mốc 16 điểm và vô địch Checkmate',
  `top1Count` INT NOT NULL DEFAULT 0 COMMENT 'Số lần về Top 1 các round',
  `top2Count` INT NOT NULL DEFAULT 0 COMMENT 'Số lần về Top 2',
  `top3Count` INT NOT NULL DEFAULT 0 COMMENT 'Số lần về Top 3',
  `top4Count` INT NOT NULL DEFAULT 0 COMMENT 'Số lần về Top 4 (bét)',
  `totalPoints` INT NOT NULL DEFAULT 0 COMMENT 'Tổng điểm tích lũy',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_stats_userId` (`userId`),
  CONSTRAINT `fk_user_stats_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu trữ thông số thành tích của người chơi';

-- ========================================================
-- 4. BẢNG `matches` - Lịch sử các trận đấu
-- ========================================================
CREATE TABLE `matches` (
  `id` VARCHAR(36) NOT NULL COMMENT 'UUID trận đấu (ví dụ: match-1730000000)',
  `roomCode` VARCHAR(10) NULL COMMENT 'Mã phòng (hoặc mã BOT-XXXXX)',
  `winnerId` VARCHAR(36) NULL COMMENT 'ID của người vô địch trận Checkmate',
  `totalRounds` INT NOT NULL DEFAULT 1 COMMENT 'Số round đã diễn ra trong trận',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Thời điểm bắt đầu trận',
  `endedAt` DATETIME(3) NULL COMMENT 'Thời điểm kết thúc ván đấu',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu lịch sử các trận đấu';

-- ========================================================
-- 5. BẢNG `match_players` - Chi tiết điểm & thứ hạng từng người trong trận
-- ========================================================
CREATE TABLE `match_players` (
  `id` VARCHAR(36) NOT NULL,
  `matchId` VARCHAR(36) NOT NULL COMMENT 'Tham chiếu sang bảng matches',
  `userId` VARCHAR(36) NULL COMMENT 'ID người dùng (NULL nếu là Bot hoặc Khách)',
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên hiển thị lúc thi đấu',
  `isBot` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: Bot AI, 0: Người chơi thật',
  `finalRank` INT NOT NULL COMMENT 'Thứ hạng chung cuộc của trận (1, 2, 3, 4)',
  `points` INT NOT NULL COMMENT 'Tổng điểm đạt được khi kết thúc trận',
  PRIMARY KEY (`id`),
  KEY `idx_match_players_matchId` (`matchId`),
  KEY `idx_match_players_userId` (`userId`),
  CONSTRAINT `fk_match_players_match` FOREIGN KEY (`matchId`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_match_players_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng kết quả chi tiết của từng người chơi trong mỗi trận';

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- 6. DỮ LIỆU KHỞI TẠO MẪU (SEED DATA)
-- Mật khẩu mặc định:
--   - admin / admin123 (Quyền ADMIN quản trị tối cao)
--   - player1 / player123 (Quyền USER người chơi thường)
-- ========================================================

-- Thêm tài khoản Admin
INSERT INTO `users` (`id`, `username`, `email`, `passwordHash`, `role`, `isBanned`, `createdAt`, `updatedAt`)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'admin@tienlen.local',
  '$2a$10$Y1tkk87k1d55bwjlR9QjoO0PeDZrTiUTUqhneLhG/d1Mc/Y03FYXu', -- Mật khẩu: admin123
  'ADMIN',
  0,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE `username`=`username`;

-- Thống kê cho Admin
INSERT INTO `user_stats` (`id`, `userId`, `matchesPlayed`, `checkmateWins`, `top1Count`, `top2Count`, `top3Count`, `top4Count`, `totalPoints`)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  0, 0, 0, 0, 0, 0, 0
) ON DUPLICATE KEY UPDATE `userId`=`userId`;

-- Thêm tài khoản người chơi mẫu player1
INSERT INTO `users` (`id`, `username`, `email`, `passwordHash`, `role`, `isBanned`, `createdAt`, `updatedAt`)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'player1',
  'player1@tienlen.local',
  '$2a$10$zBMs2y6OAOej28Nx6C9AqOCbqmvnqVEQGHuAUyFV/6qfwmAezLfUG', -- Mật khẩu: player123
  'USER',
  0,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE `username`=`username`;

-- Thống kê cho player1
INSERT INTO `user_stats` (`id`, `userId`, `matchesPlayed`, `checkmateWins`, `top1Count`, `top2Count`, `top3Count`, `top4Count`, `totalPoints`)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000003',
  5, 2, 3, 1, 1, 0, 34
) ON DUPLICATE KEY UPDATE `userId`=`userId`;

-- ========================================================
-- HOÀN TẤT KHỞI TẠO DATABASE TIENLEN_CHECKMATE!
-- ========================================================

