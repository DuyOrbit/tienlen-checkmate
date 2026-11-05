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
    echo "<body style='background:#121814;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px;'>";
    echo "<h1 style='color:#86efac;'>🃏 TIẾN LÊN CHECKMATE 16</h1>";
    echo "<p>Chưa tìm thấy bản build. Vui lòng chạy lệnh: <code style='color:#fde047;'>npm run build</code></p>";
    echo "</body></html>";
    exit;
}

$html = file_get_contents($indexPath);

// Chuẩn hóa đường dẫn assets khi mở qua http://localhost/tienlen/
$html = str_replace('src="./assets/', 'src="/tienlen/public/assets/', $html);
$html = str_replace('href="./assets/', 'href="/tienlen/public/assets/', $html);

echo $html;
