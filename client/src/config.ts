// Cấu hình URL linh hoạt:
// - Trên môi trường Cloud / Production (Render, v.v.): Dùng trực tiếp origin của trang web (HTTPS)
// - Trên môi trường Localhost: Nếu chạy qua WAMP (port 80) thì nối tới http://localhost:3001
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

export const API_BASE = isLocalhost
  ? window.location.port === '3001'
    ? window.location.origin
    : 'http://localhost:3001'
  : (typeof window !== 'undefined' ? window.location.origin : '');

export const SOCKET_URL = API_BASE;
