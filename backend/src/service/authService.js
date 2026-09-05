import * as userService from "./userService.js";
import * as sessionService from "./sessionService.js";
import * as cryptoService from "./cryptoService.js";
import * as totpService from "./totpService.js";
import * as auditLogService from "./auditLogService.js";
import { AppError } from "./appError.js";

const VERIFY_EMAIL_TTL_SECONDS = 24 * 60 * 60;
const LOGIN_CHALLENGE_TTL_SECONDS = 5 * 60;
const MIN_PASSWORD_LENGTH = 6;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 10;

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function requireCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw AppError.badRequest("Email không được để trống.", "EMAIL_REQUIRED");
  if (!password) throw AppError.badRequest("Mật khẩu không được để trống.", "PASSWORD_REQUIRED");
  return normalizedEmail;
}

async function recordAuthAction(action, details) {
  await auditLogService.logAction({ action, ...details });
}

export async function register({ email, password, ipAddress = null, userAgent = null }) {
  const normalizedEmail = requireCredentials(email, password);
  const user = await userService.createUser({ email: normalizedEmail, password, status: "unverified" });
  const verificationToken = cryptoService.signEphemeralToken(
    { purpose: "verify_email", userId: user.id },
    VERIFY_EMAIL_TTL_SECONDS
  );
  await recordAuthAction("register", { userId: user.id, ipAddress, userAgent });
  return { user, verificationToken };
}

export async function verifyEmail(token) {
  const payload = cryptoService.verifyEphemeralToken(token);
  if (payload.purpose !== "verify_email" || !payload.userId) {
    throw AppError.badRequest("Token xác minh email không hợp lệ.", "INVALID_VERIFICATION_TOKEN");
  }
  const user = await userService.findByIdForAuth(payload.userId);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  if (user.status === "banned") throw AppError.forbidden("Tài khoản đã bị khóa.", "USER_BANNED");
  if (user.status === "active") return userService.getUserById(user.id);
  const safeUser = await userService.setStatus(user.id, "active");
  await recordAuthAction("verify_email", { userId: user.id });
  return safeUser;
}

export async function login({ email, password, deviceInfo = null, ipAddress = null, userAgent = null }) {
  const normalizedEmail = requireCredentials(email, password);
  const user = await userService.findByEmailForAuth(normalizedEmail);

  if (user) {
    const recentFailures = await auditLogService.countRecentActionsByUser(user.id, "login_failed", FAILED_LOGIN_WINDOW_MS);
    if (recentFailures >= MAX_FAILED_LOGINS) {
      throw AppError.tooManyRequests("Tài khoản tạm thời bị giới hạn đăng nhập. Vui lòng thử lại sau.", "LOGIN_RATE_LIMITED");
    }
  }

  const passwordMatches = user && cryptoService.verifyPassword(password, user.passwordHash);
  if (!user || !passwordMatches) {
    await recordAuthAction("login_failed", { userId: user?.id ?? null, ipAddress, userAgent });
    throw AppError.unauthorized("Email hoặc mật khẩu không đúng.", "INVALID_CREDENTIALS");
  }
  if (user.status === "banned") throw AppError.forbidden("Tài khoản đã bị khóa.", "USER_BANNED");
  if (user.status !== "active") {
    throw AppError.forbidden("Email chưa được xác minh.", "EMAIL_NOT_VERIFIED");
  }

  if (user.isTwoFactorEnabled) {
    const challengeToken = cryptoService.signEphemeralToken(
      { purpose: "login_2fa", userId: user.id },
      LOGIN_CHALLENGE_TTL_SECONDS
    );
    return { requiresTwoFactor: true, challengeToken };
  }

  return completeLogin(user, { deviceInfo, ipAddress, userAgent });
}

async function completeLogin(user, { deviceInfo, ipAddress, userAgent }) {
  const { token, session } = await sessionService.createSession(user.id, { deviceInfo, ipAddress });
  const safeUser = await userService.getUserById(user.id);
  await recordAuthAction("login_success", { userId: user.id, ipAddress, userAgent });
  return { requiresTwoFactor: false, token, session, user: safeUser };
}

export async function verifyTwoFactorLogin(challengeToken, code, sessionDetails = {}) {
  const payload = cryptoService.verifyEphemeralToken(challengeToken);
  if (payload.purpose !== "login_2fa" || !payload.userId) {
    throw AppError.unauthorized("Thử thách 2FA không hợp lệ.", "INVALID_2FA_CHALLENGE");
  }
  const user = await userService.findByIdForAuth(payload.userId);
  if (!user || !user.isTwoFactorEnabled || !totpService.verifyTotpToken(user.twoFactorSecret, code)) {
    await recordAuthAction("login_failed", {
      userId: user?.id ?? null,
      ipAddress: sessionDetails.ipAddress,
      userAgent: sessionDetails.userAgent,
    });
    throw AppError.unauthorized("Mã xác thực 2FA không đúng.", "INVALID_2FA_CODE");
  }
  return completeLogin(user, sessionDetails);
}

export async function logout(rawToken, { ipAddress = null, userAgent = null } = {}) {
  if (!rawToken) return false;
  try {
    const session = await sessionService.findSessionByToken(rawToken);
    await sessionService.revokeSessionByToken(rawToken);
    await recordAuthAction("logout", { userId: session.userId, ipAddress, userAgent });
    return true;
  } catch {
    return false;
  }
}

export async function changePassword(userId, { oldPassword, newPassword, currentToken, ipAddress = null, userAgent = null }) {
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    throw AppError.badRequest(`Mật khẩu mới cần tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`, "PASSWORD_TOO_SHORT");
  }
  const user = await userService.changePassword(userId, { oldPassword, newPassword });
  await sessionService.revokeAllSessions(userId, { exceptToken: currentToken });
  await recordAuthAction("change_password", { userId, ipAddress, userAgent });
  return user;
}

export async function beginTwoFactorSetup(userId) {
  const user = await userService.findByIdForAuth(userId);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  const secret = totpService.generateTotpSecret();
  await userService.setTwoFactorSecret(userId, { isTwoFactorEnabled: false, twoFactorSecret: secret });
  return { secret, otpauthUrl: totpService.buildOtpAuthUrl(secret, user.email) };
}

export async function confirmTwoFactorSetup(userId, code) {
  const user = await userService.findByIdForAuth(userId);
  if (!user?.twoFactorSecret) throw AppError.badRequest("Bạn chưa bắt đầu thiết lập 2FA.", "2FA_SETUP_REQUIRED");
  if (!totpService.verifyTotpToken(user.twoFactorSecret, code)) {
    throw AppError.badRequest("Mã xác thực 2FA không đúng.", "INVALID_2FA_CODE");
  }
  const safeUser = await userService.setTwoFactorSecret(userId, { isTwoFactorEnabled: true });
  await recordAuthAction("enable_2fa", { userId });
  return safeUser;
}

export async function disableTwoFactor(userId, { password }) {
  const user = await userService.findByIdForAuth(userId);
  if (!user || !cryptoService.verifyPassword(password, user.passwordHash)) {
    throw AppError.unauthorized("Mật khẩu không đúng.", "INVALID_PASSWORD");
  }
  const safeUser = await userService.setTwoFactorSecret(userId, {
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
  });
  await recordAuthAction("disable_2fa", { userId });
  return safeUser;
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
