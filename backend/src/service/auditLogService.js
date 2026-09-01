import { Op } from "sequelize";
import { AuditLog } from "../models/index.js";

/**
 * auditLogService — Module 7: Bảo mật nâng cao & Hạ tầng (phần audit_logs).
 *
 * Service này được gọi "âm thầm" từ nhiều service khác (authService khi
 * login/logout/đổi mật khẩu, noteService khi export dữ liệu,...) — bản
 * thân nó không throw lỗi nghiệp vụ, vì ghi log thất bại không nên làm
 * sập luồng chính của người dùng. Nếu insert lỗi (VD mất kết nối DB đúng
 * lúc đó), lỗi được nuốt và chỉ log ra console, KHÔNG ném ra ngoài.
 */

export async function logAction({ userId = null, action, ipAddress = null, userAgent = null }) {
  if (!action) throw new Error("auditLogService.logAction: thiếu 'action'");
  try {
    return await AuditLog.create({ userId, action, ipAddress, userAgent });
  } catch (err) {
    // Cố tình không throw AppError ở đây — xem giải thích trong docblock phía trên.
    console.error("[auditLogService] Ghi audit log thất bại:", err.message);
    return null;
  }
}

export async function listByUser(userId, { limit = 50, offset = 0 } = {}) {
  return AuditLog.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
}

/** Dùng cho trang Admin Dashboard (Module 8) — xem toàn bộ log, có thể lọc theo action. */
export async function listAll({ limit = 50, offset = 0, action } = {}) {
  const where = action ? { action } : {};
  return AuditLog.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
}

/**
 * Đếm số lần xảy ra `action` (VD: 'login_failed') của 1 user trong `windowMs`
 * gần nhất — dùng cho cơ chế khoá tạm thời chống brute-force ở authService.
 */
export async function countRecentActionsByUser(userId, action, windowMs) {
  if (!userId) return 0;
  const since = new Date(Date.now() - windowMs);
  return AuditLog.count({
    where: { userId, action, createdAt: { [Op.gte]: since } },
  });
}

/** Tương tự nhưng đếm theo IP — dùng để chặn dò email hợp lệ (email không tồn tại thì không có userId để đếm theo). */
export async function countRecentActionsByIp(ipAddress, action, windowMs) {
  if (!ipAddress) return 0;
  const since = new Date(Date.now() - windowMs);
  return AuditLog.count({
    where: { ipAddress, action, createdAt: { [Op.gte]: since } },
  });
}

export default { logAction, listByUser, listAll, countRecentActionsByUser, countRecentActionsByIp };
