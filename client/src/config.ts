// Cấu hình URL linh hoạt cho cả Server đồng nhất (port 3001) và WampServer (localhost/tienlen)
const host = window.location.hostname || 'localhost';

export const API_BASE =
  window.location.port === '3001'
    ? window.location.origin
    : `http://${host}:3001`;

export const SOCKET_URL = API_BASE;
