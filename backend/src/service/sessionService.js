import { Op } from "sequelize";
import { ActiveSession } from "../models/index.js";
import { AppError } from "./appError.js";
import { generateSessionToken, hashSessionToken } from "./cryptoService.js";

/**
 * sessionService — Module 7: Quản lý phiên đăng nhập (active_sessions).
 *
 * active_sessions.session_id (PK, VARCHAR(255)) lưu SHA-256 hash của
 * token, KHÔNG lưu token gốc — cùng nguyên tắc với password_hash: lộ DB
 * cũng không lấy lại được token thật để giả mạo phiên đăng nhập. Token
 * gốc (raw) chỉ trả về đúng 1 lần lúc tạo session (login) cho client lưu
 * lại (VD localStorage/cookie phía FE) và gửi kèm mỗi request sau đó qua
 * header Authorization.
 *
 * Vì được lưu dưới dạng hash 1 chiều, kể cả khi giá trị sessionId này lộ
 * ra (VD qua API "danh sách thiết bị đăng nhập"), nó KHÔNG thể dùng lại
 * để giả danh phiên đó — validateToken() luôn hash lại giá trị được gửi
 * lên trước khi so khớp, nên đưa thẳng hash cũ vào sẽ bị hash lần 2 và
 * không khớp với chính nó.
 */

export async function createSession(userId, { deviceInfo = null, ipAddress = null } = {}) {
  const rawToken = generateSessionToken();
  const session = await ActiveSession.create({
    sessionId: hashSessionToken(rawToken),
    userId,
    deviceInfo,
    ipAddress,
  });
  return { token: rawToken, session };
}

/** Tra cứu session từ token thô (client gửi lên). Throw AppError 401 nếu không có/đã bị thu hồi. */
export async function findSessionByToken(rawToken) {
  if (!rawToken) throw AppError.unauthorized("Thiếu token đăng nhập.", "TOKEN_MISSING");
  const session = await ActiveSession.findByPk(hashSessionToken(rawToken));
  if (!session) {
    throw AppError.unauthorized("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", "SESSION_NOT_FOUND");
  }
  return session;
}

/** Danh sách thiết bị đang đăng nhập của 1 user — dùng cho màn "Quản lý phiên đăng nhập". */
export async function listSessions(userId) {
  return ActiveSession.findAll({ where: { userId } });
}

/** Đăng xuất phiên hiện tại (dùng rawToken lấy từ header Authorization của chính request đó). */
export async function revokeSessionByToken(rawToken) {
  const deletedCount = await ActiveSession.destroy({ where: { sessionId: hashSessionToken(rawToken) } });
  return deletedCount > 0;
}

/** Thu hồi 1 thiết bị cụ thể theo sessionId (hash) — dùng khi user bấm "Đăng xuất thiết bị này" từ danh sách. Kiểm tra sở hữu để tránh thu hồi phiên của người khác. */
export async function revokeSessionById(sessionId, requestingUserId) {
  const session = await ActiveSession.findByPk(sessionId);
  if (!session) throw AppError.notFound("Không tìm thấy phiên đăng nhập này.", "SESSION_NOT_FOUND");
  if (session.userId !== requestingUserId) {
    throw AppError.forbidden("Bạn không thể thu hồi phiên đăng nhập của người khác.", "SESSION_NOT_OWNED");
  }
  await session.destroy();
}

/**
 * Thu hồi toàn bộ phiên của 1 user — dùng khi đổi mật khẩu, nghi ngờ bị lộ tài khoản,
 * hoặc bấm "Đăng xuất tất cả thiết bị". `exceptToken` (nếu có) giữ lại phiên hiện tại.
 */
export async function revokeAllSessions(userId, { exceptToken } = {}) {
  const where = { userId };
  if (exceptToken) {
    where.sessionId = { [Op.ne]: hashSessionToken(exceptToken) };
  }
  return ActiveSession.destroy({ where });
}

export default { createSession, findSessionByToken, listSessions, revokeSessionByToken, revokeSessionById, revokeAllSessions };
