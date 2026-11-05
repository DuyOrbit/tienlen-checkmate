// Cấu hình URL kết nối linh hoạt cho cả WAMP Apache (localhost/tienlen) và Vite dev server
export const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:3001`
    : '';

export const SOCKET_URL = API_BASE || window.location.origin;

