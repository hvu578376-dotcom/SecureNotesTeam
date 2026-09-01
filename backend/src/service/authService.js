import { AppError } from "./appError.js";
import * as userService from "./userService.js";
import * as sessionService from "./sessionService.js";
import * as auditLogService from "./auditLogService.js";
import * as totpService from "./totpService.js";
import { verifyPassword, signEphemeralToken, verifyEphemeralToken } from "./cryptoService.js";

/**
 * authService — điều phối (orchestrate) toàn bộ luồng xác thực bằng cách
 * ghép các service khác lại (userService, sessionService, auditLogService,
 * totpService). Đây là service duy nhất mà controller xác thực
 * (POST /api/auth/login mà login.html đang đợi — xem comment trong
 * frontend/login.html) cần gọi tới.
 *
 * Luồng đăng nhập có 2FA hoạt động theo 2 bước (giống Google/GitHub):
 *   Bước 1: login(email, password) — nếu tài khoản CHƯA bật 2FA, trả
 *           thẳng { requiresTwoFactor: false, token, user }.
 *           Nếu ĐÃ bật 2FA, trả { requiresTwoFactor: true, challengeToken }
 *           — CHƯA tạo session thật, challengeToken chỉ có hạn 5 phút.
 *   Bước 2: verifyTwoFactorLogin(challengeToken, code) — xác minh mã 6 số,
 *           lúc này mới thật sự tạo session (sessionService.createSession).
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 phút — đủ dài để cản brute-force, đủ ngắn để không phiền user gõ nhầm vài lần

async function assertNotLockedOut({ userId, ipAddress }) {
  if (userId) {
    const failedByUser = await auditLogService.countRecentActionsByUser(userId, "login_failed", LOCKOUT_WINDOW_MS);
    if (failedByUser >= MAX_FAILED_ATTEMPTS) {
      throw AppError.tooManyRequests(
        `Tài khoản tạm khoá đăng nhập do sai mật khẩu quá ${MAX_FAILED_ATTEMPTS} lần. Vui lòng thử lại sau ít phút.`,
        "ACCOUNT_TEMPORARILY_LOCKED"
      );
    }
  } else if (ipAddress) {
    // Email không tồn tại trong DB -> không có userId để đếm theo, đếm theo IP để
    // vẫn cản được kiểu tấn công dò nhiều email khác nhau từ cùng 1 nguồn.
    const failedByIp = await auditLogService.countRecentActionsByIp(ipAddress, "login_failed", LOCKOUT_WINDOW_MS);
    if (failedByIp >= MAX_FAILED_ATTEMPTS) {
      throw AppError.tooManyRequests(
        "Địa chỉ này vừa đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.",
        "IP_TEMPORARILY_LOCKED"
      );
    }
  }
}

// ---------------------------------------------------------------------
// Đăng ký
// ---------------------------------------------------------------------

/**
 * Đăng ký tài khoản mới. Trả về { user, verificationToken }.
 *
 * LƯU Ý: dự án hiện CHƯA cấu hình dịch vụ gửi email (không có nodemailer/
 * SMTP trong package.json). verificationToken được trả thẳng ra đây để
 * bước Controller/FE có thể tự quyết định cách gửi nó cho người dùng sau
 * này (VD tích hợp email thật). Trước khi verify, user vẫn có thể đăng
 * nhập bình thường (status "unverified" không chặn login() bên dưới) —
 * đây là lựa chọn mặc định hợp lý để không bị kẹt luồng demo khi chưa có
 * email thật; nếu đặc tả (11q1.docx) yêu cầu bắt buộc xác minh trước khi
 * dùng, chỉ cần thêm 1 điều kiện chặn ở login().
 */
export async function register({ email, password, ipAddress = null, userAgent = null }) {
  const user = await userService.createUser({ email, password, status: "unverified" });
  await auditLogService.logAction({ userId: user.id, action: "register", ipAddress, userAgent });
  const verificationToken = signEphemeralToken({ purpose: "verify_email", userId: user.id }, 24 * 60 * 60);
  return { user, verificationToken };
}

export async function verifyEmail(token) {
  const payload = verifyEphemeralToken(token);
  if (payload.purpose !== "verify_email") {
    throw AppError.badRequest("Token không hợp lệ cho thao tác xác minh email.", "INVALID_TOKEN_PURPOSE");
  }
  const user = await userService.setStatus(payload.userId, "active");
  await auditLogService.logAction({ userId: payload.userId, action: "verify_email" });
  return user;
}

// ---------------------------------------------------------------------
// Đăng nhập / Đăng xuất
// ---------------------------------------------------------------------

export async function login({ email, password, deviceInfo = null, ipAddress = null, userAgent = null }) {
  const user = await userService.findByEmailForAuth(email); // unscoped -> có passwordHash để so khớp

  await assertNotLockedOut({ userId: user?.id ?? null, ipAddress });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await auditLogService.logAction({ userId: user?.id ?? null, action: "login_failed", ipAddress, userAgent });
    // Cố tình dùng chung 1 thông báo cho "sai email" và "sai mật khẩu" — không tiết lộ email nào tồn tại trong hệ thống.
    throw AppError.unauthorized("Email hoặc mật khẩu không đúng.", "INVALID_CREDENTIALS");
  }

  if (user.status === "banned") {
    await auditLogService.logAction({ userId: user.id, action: "login_blocked_banned", ipAddress, userAgent });
    throw AppError.forbidden("Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên.", "ACCOUNT_BANNED");
  }

  if (user.isTwoFactorEnabled) {
    const challengeToken = signEphemeralToken({ purpose: "2fa_login", userId: user.id }, 5 * 60);
    await auditLogService.logAction({ userId: user.id, action: "login_2fa_challenge", ipAddress, userAgent });
    return { requiresTwoFactor: true, challengeToken };
  }

  const { token, session } = await sessionService.createSession(user.id, { deviceInfo, ipAddress });
  await auditLogService.logAction({ userId: user.id, action: "login_success", ipAddress, userAgent });
  return { requiresTwoFactor: false, token, session, user: await userService.getUserById(user.id) };
}

/** Bước 2 của luồng đăng nhập khi tài khoản có bật 2FA — xem docblock đầu file. */
export async function verifyTwoFactorLogin(challengeToken, code, { deviceInfo = null, ipAddress = null, userAgent = null } = {}) {
  const payload = verifyEphemeralToken(challengeToken); // throw 401 nếu hết hạn/sai chữ ký
  if (payload.purpose !== "2fa_login") {
    throw AppError.badRequest("Token không hợp lệ cho thao tác xác minh 2FA.", "INVALID_TOKEN_PURPOSE");
  }

  await assertNotLockedOut({ userId: payload.userId, ipAddress });

  const user = await userService.findByIdForAuth(payload.userId);
  if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
    // Trường hợp hiếm: user tắt 2FA giữa bước 1 và bước 2 -> coi challenge này vô hiệu.
    throw AppError.unauthorized("Yêu cầu xác thực 2FA không còn hiệu lực, vui lòng đăng nhập lại.", "2FA_CHALLENGE_INVALID");
  }

  const isValidCode = totpService.verifyTotpToken(user.twoFactorSecret, code);
  if (!isValidCode) {
    await auditLogService.logAction({ userId: user.id, action: "login_failed", ipAddress, userAgent });
    throw AppError.unauthorized("Mã xác thực 2FA không đúng.", "INVALID_2FA_CODE");
  }

  const { token, session } = await sessionService.createSession(user.id, { deviceInfo, ipAddress });
  await auditLogService.logAction({ userId: user.id, action: "login_success", ipAddress, userAgent });
  return { token, session, user: await userService.getUserById(user.id) };
}

export async function logout(rawToken, { ipAddress = null, userAgent = null } = {}) {
  const session = await sessionService.findSessionByToken(rawToken).catch(() => null);
  await sessionService.revokeSessionByToken(rawToken);
  if (session) {
    await auditLogService.logAction({ userId: session.userId, action: "logout", ipAddress, userAgent });
  }
}

/** Đổi mật khẩu + tự động đăng xuất mọi thiết bị KHÁC (giữ lại phiên hiện tại) để chặn kẻ đã lỡ có phiên cũ. */
export async function changePassword(userId, { oldPassword, newPassword, currentToken = null, ipAddress = null, userAgent = null }) {
  const user = await userService.changePassword(userId, { oldPassword, newPassword });
  await auditLogService.logAction({ userId, action: "change_password", ipAddress, userAgent });
  await sessionService.revokeAllSessions(userId, { exceptToken: currentToken });
  return user;
}

// ---------------------------------------------------------------------
// Xác thực 2 lớp (2FA / TOTP)
// ---------------------------------------------------------------------

/** Bước 1 bật 2FA: sinh secret mới + otpauth URL để FE vẽ QR. CHƯA bật thật (isTwoFactorEnabled vẫn false) tới khi confirmTwoFactorSetup(). */
export async function beginTwoFactorSetup(userId) {
  const user = await userService.findByIdForAuth(userId);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  if (user.isTwoFactorEnabled) {
    throw AppError.conflict("Tài khoản đã bật xác thực 2 lớp rồi.", "2FA_ALREADY_ENABLED");
  }
  const secret = totpService.generateTotpSecret();
  await userService.setTwoFactorSecret(userId, { twoFactorSecret: secret, isTwoFactorEnabled: false });
  return { secret, otpauthUrl: totpService.buildOtpAuthUrl(secret, user.email) };
}

/** Bước 2 bật 2FA: xác nhận app Authenticator đã đồng bộ đúng bằng cách nhập thử 1 mã 6 số. */
export async function confirmTwoFactorSetup(userId, code) {
  const user = await userService.findByIdForAuth(userId);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  if (!user.twoFactorSecret) {
    throw AppError.badRequest("Chưa khởi tạo 2FA — gọi bước bắt đầu thiết lập trước.", "2FA_NOT_INITIATED");
  }
  if (user.isTwoFactorEnabled) {
    throw AppError.conflict("Tài khoản đã bật xác thực 2 lớp rồi.", "2FA_ALREADY_ENABLED");
  }
  if (!totpService.verifyTotpToken(user.twoFactorSecret, code)) {
    throw AppError.unauthorized("Mã xác thực không đúng. Hãy thử lại.", "INVALID_2FA_CODE");
  }
  const updated = await userService.setTwoFactorSecret(userId, { isTwoFactorEnabled: true });
  await auditLogService.logAction({ userId, action: "enable_2fa" });
  return updated;
}

/** Tắt 2FA — bắt buộc nhập lại mật khẩu hiện tại vì đây là thao tác hạ mức bảo mật tài khoản. */
export async function disableTwoFactor(userId, { password }) {
  const user = await userService.findByIdForAuth(userId);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  if (!user.isTwoFactorEnabled) {
    throw AppError.conflict("Tài khoản chưa bật xác thực 2 lớp.", "2FA_NOT_ENABLED");
  }
  if (!verifyPassword(password, user.passwordHash)) {
    throw AppError.unauthorized("Mật khẩu không đúng.", "INVALID_CURRENT_PASSWORD");
  }
  const updated = await userService.setTwoFactorSecret(userId, { isTwoFactorEnabled: false, twoFactorSecret: null });
  await auditLogService.logAction({ userId, action: "disable_2fa" });
  return updated;
}

export default {
  register,
  verifyEmail,
  login,
  verifyTwoFactorLogin,
  logout,
  changePassword,
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
};
