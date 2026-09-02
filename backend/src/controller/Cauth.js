import { authService } from "../service/index.js";
import { asyncHandler } from "./Httphelper.js";
import { getBearerToken } from "../middleware/auth.js";

/**
 * CAuth — Controller cho Module 1 (Tài khoản & Phân quyền), phần xác thực.
 *
 * Đây chính là controller mà frontend/login.html gọi tới qua
 * POST /api/auth/login. authService.js (đã có sẵn) xử lý toàn bộ logic
 * nghiệp vụ; controller ở đây chỉ làm nhiệm vụ "dịch" giữa HTTP (req/res)
 * và authService.
 *
 * Route đã được gắn đầy đủ ở tầng router (xem backend/src/router/AuthRouter.js,
 * gộp vào backend/src/router/index.js rồi mount ở server.js qua app.use("/api", ...)):
 *   POST   /api/auth/register       -> register
 *   POST   /api/auth/verify-email   -> verifyEmail
 *   POST   /api/auth/login          -> login                  (khớp đúng request của frontend/login.html)
 *   POST   /api/auth/login/2fa      -> verifyTwoFactor         (bước 2 khi tài khoản có bật 2FA)
 *   POST   /api/auth/logout         -> logout
 *   PATCH  /api/auth/password       -> changePassword         (middleware requireAuth)
 *   POST   /api/auth/2fa/setup      -> beginTwoFactorSetup     (middleware requireAuth)
 *   POST   /api/auth/2fa/confirm    -> confirmTwoFactorSetup   (middleware requireAuth)
 *   POST   /api/auth/2fa/disable    -> disableTwoFactor        (middleware requireAuth)
 *
 * LƯU Ý: logout KHÔNG gắn middleware requireAuth — cố tình để nguyên
 * dạng "khoan dung" (đăng xuất với token đã hết hạn/không hợp lệ vẫn
 * trả 200, xem authService.logout tự bắt lỗi findSessionByToken rồi bỏ
 * qua), thay vì trả 401 như các route khác. Vì vậy controller ở đây vẫn
 * tự đọc token qua getBearerToken() thay vì req.token.
 */

export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const { user, verificationToken } = await authService.register({
    email,
    password,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });
  // Dự án chưa cấu hình dịch vụ gửi email thật (xem comment trong
  // authService.register) nên verificationToken tạm thời trả thẳng ra
  // đây để FE tự xử lý/hiển thị. Khi có email thật, nên BỎ trường này
  // khỏi response và gửi verificationToken qua email thay vì trả về FE.
  res.status(201).json({ success: true, data: { user, verificationToken } });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body ?? {};
  const user = await authService.verifyEmail(token);
  res.json({ success: true, data: { user } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const result = await authService.login({
    email,
    password,
    deviceInfo: req.get("user-agent") ?? null,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });
  // result = { requiresTwoFactor: true, challengeToken } khi tài khoản có bật 2FA, HOẶC
  //          { requiresTwoFactor: false, token, session, user } khi đăng nhập xong ngay.
  res.json({ success: true, data: result });
});

/** Bước 2 của luồng đăng nhập khi tài khoản có bật 2FA (xem docblock authService.js). */
export const verifyTwoFactor = asyncHandler(async (req, res) => {
  const { challengeToken, code } = req.body ?? {};
  const result = await authService.verifyTwoFactorLogin(challengeToken, code, {
    deviceInfo: req.get("user-agent") ?? null,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });
  res.json({ success: true, data: result });
});

export const logout = asyncHandler(async (req, res) => {
  const token = getBearerToken(req);
  await authService.logout(token, { ipAddress: req.ip, userAgent: req.get("user-agent") });
  res.json({ success: true, message: "Đã đăng xuất." });
});

/** Đổi mật khẩu — tự động đăng xuất mọi thiết bị KHÁC (xem authService.changePassword). */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const currentToken = req.token;
  const { oldPassword, newPassword } = req.body ?? {};
  const user = await authService.changePassword(userId, {
    oldPassword,
    newPassword,
    currentToken,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });
  res.json({ success: true, data: { user } });
});

/** Bước 1 bật 2FA: sinh secret + otpauth URL để FE vẽ QR (chưa bật thật). */
export const beginTwoFactorSetup = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const result = await authService.beginTwoFactorSetup(userId);
  res.json({ success: true, data: result });
});

/** Bước 2 bật 2FA: xác nhận mã 6 số từ app Authenticator để bật thật. */
export const confirmTwoFactorSetup = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { code } = req.body ?? {};
  const user = await authService.confirmTwoFactorSetup(userId, code);
  res.json({ success: true, data: { user } });
});

/** Tắt 2FA — bắt buộc nhập lại mật khẩu hiện tại (xem authService.disableTwoFactor). */
export const disableTwoFactor = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { password } = req.body ?? {};
  const user = await authService.disableTwoFactor(userId, { password });
  res.json({ success: true, data: { user } });
});

export default {
  register,
  verifyEmail,
  login,
  verifyTwoFactor,
  logout,
  changePassword,
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
};