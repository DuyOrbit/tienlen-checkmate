<?php
/**
 * TIẾN LÊN CHECKMATE 16 & AUGMENTS - WAMP ENTRYPOINT
 * Hỗ trợ truy cập trực tiếp qua WampServer: http://localhost/tienlen
 */

$publicDir = __DIR__ . '/public';
$indexPath = $publicDir . '/index.html';

if (!file_exists($indexPath)) {
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Tiến Lên Checkmate</title></head>";
    echo "<body style='background:#070a12;color:#fff;font-family:sans-serif;text-align:center;padding:50px;'>";
    echo "<h1 style='color:#00f0ff;'>🎮 TIẾN LÊN CHECKMATE 16</h1>";
    echo "<p>Chưa tìm thấy bản build. Vui lòng chạy lệnh: <code style='color:#ffb703;'>npm run build</code></p>";
    echo "</body></html>";
    exit;
}

$html = file_get_contents($indexPath);

// Chuẩn hóa đường dẫn assets khi mở qua http://localhost/tienlen/
$html = str_replace('src="./assets/', 'src="/tienlen/public/assets/', $html);
$html = str_replace('href="./assets/', 'href="/tienlen/public/assets/', $html);

// Kiểm tra xem Backend Server (port 3001) có đang chạy không
$backendOnline = false;
$connection = @fsockopen('127.0.0.1', 3001, $errno, $errstr, 0.5);
if (is_resource($connection)) {
    $backendOnline = true;
    fclose($connection);
}

// Nếu backend chưa bật, chèn một thông báo nhắc nhở nhẹ ở đầu trang
if (!$backendOnline) {
    $warningBanner = '
    <div id="wamp-backend-alert" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:rgba(225,29,72,0.95);color:#fff;font-family:sans-serif;font-size:12px;padding:8px 16px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;gap:10px;">
        <span>⚠️ <strong>LƯU Ý:</strong> Backend Node.js chưa chạy. Hãy nhấp đúp file <strong>start-game.bat</strong> trong thư mục <code>F:\\wamp\\www\\tienlen</code> để bật Socket & MySQL API!</span>
        <button onclick="this.parentElement.style.display=\'none\'" style="background:#000;color:#fff;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;">Đóng</button>
    </div>
    ';
    $html = str_replace('<body', '<body' . "\n" . $warningBanner, $html);
}

echo $html;

