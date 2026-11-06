/**
 * Quản lý JWT Secret tập trung và an toàn cho toàn bộ ứng dụng
 */
let cachedSecret: string | null = null;

export function getJwtSecret(): string {
  if (cachedSecret) {
    return cachedSecret;
  }

  const envSecret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!envSecret) {
    if (isProd) {
      console.error('====================================================================');
      console.error(' [SECURITY FATAL] Biến môi trường JWT_SECRET bắt buộc phải có trong môi trường production!');
      console.error(' Server từ chối khởi động để bảo đảm an toàn dữ liệu.');
      console.error(' Hãy cấu hình JWT_SECRET trên Render dashboard hoặc file .env!');
      console.error('====================================================================');
      process.exit(1);
    }

    console.warn('[SECURITY WARNING] Đang dùng JWT_SECRET mặc định ở môi trường phát triển (development). Hãy đặt JWT_SECRET trong môi trường production!');
    cachedSecret = 'tienlen_cyberpunk_super_secret_key_2026';
    return cachedSecret;
  }

  cachedSecret = envSecret;
  return cachedSecret;
}
