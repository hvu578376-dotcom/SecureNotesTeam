import { auditLogService } from "../service/index.js";
import { asyncHandler, parsePagination } from "./Httphelper.js";

/**
 * CAuditLogs — Controller cho Module 7, phần audit_logs.
 * Việc GHI log là hệ quả nội bộ của các service khác (authService khi
 * login/logout/đổi mật khẩu,...) — file này chỉ lo phần ĐỌC.
 *
 * Route dự kiến:
 *   GET /api/audit-logs/me  -> listMyAuditLogs  (cần đăng nhập — chỉ xem log của chính mình)
 *   GET /api/audit-logs     -> listAllAuditLogs  (quyền view_audit_logs — Module 8: Admin Dashboard)
 */

export const listMyAuditLogs = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { limit, offset } = parsePagination(req.query);
  const { rows, count } = await auditLogService.listByUser(userId, { limit, offset });
  res.json({ success: true, data: rows, meta: { limit, offset, total: count } });
});

/** Toàn bộ log hệ thống, lọc được theo action — chỉ admin có quyền "view_audit_logs" (xem seed data cuối sql.sql). */
export const listAllAuditLogs = asyncHandler(async (req, res) => {
  const { limit, offset } = parsePagination(req.query);
  const { rows, count } = await auditLogService.listAll({ limit, offset, action: req.query.action });
  res.json({ success: true, data: rows, meta: { limit, offset, total: count } });
});

export default { listMyAuditLogs, listAllAuditLogs };