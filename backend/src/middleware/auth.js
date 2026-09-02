import { sessionService, userService, roleService, AppError } from "../service/index.js";
import { asyncHandler } from "../controller/Httphelper.js";

/**
 * middleware/auth.js — xác thực & phân quyền THẬT SỰ ở tầng middleware,
 * chạy TRƯỚC khi request chạm tới controller (gắn trực tiếp vào từng
 * route trong router/*.js).
 *
 * Đây chính là bước "tiếp theo sau Controller" mà Httphelper.js từng ghi
 * chú: trước đây mỗi hàm controller tự gọi getCurrentUserId()/
 * requirePermission() ngay dòng đầu tiên (xem lịch sử Httphelper.js) —
 * giờ việc đó chuyển hẳn ra đây, controller chỉ cần đọc req.userId.
 *
 * requireAuth gán sẵn vào req:
 *   - req.userId  : id user đang gọi API (string, UUID) — lấy từ active_sessions
 *   - req.session : bản ghi active_sessions tương ứng (xem sessionService.js)
 *   - req.token   : token thô (raw) lấy từ header Authorization
 *
 * requirePermission(permissionName) làm mọi việc requireAuth làm, CỘNG
 * THÊM kiểm tra quyền theo roles.permissions (xem seed data cuối
 * sql.sql: create_note, share_note, manage_users, view_audit_logs) —
 * và gán thêm req.user (đã include role) vì đằng nào cũng phải fetch
 * user để kiểm tra quyền, controller dùng luôn khỏi phải fetch lại.
 *
 * Cả hai đều throw AppError (401 thiếu/sai token, 403 thiếu quyền) và
 * dựa vào asyncHandler (Httphelper.js) để tự chuyển thành response JSON
 * chuẩn qua sendError() — controller/router không cần try/catch gì thêm.
 */

/** Đọc token thô từ header "Authorization: Bearer <token>" (hoặc token trần không kèm "Bearer "). Trả null nếu không có header. */
export function getBearerToken(req) {
  const header = req.headers?.authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, value] = header.split(" ");
  if (value && /^Bearer$/i.test(scheme)) return value.trim() || null;
  return header.trim() || null;
}

/**
 * Middleware: bắt buộc đã đăng nhập. Throw AppError 401 nếu thiếu/sai/
 * hết hạn token (xem sessionService.findSessionByToken — TOKEN_MISSING/
 * SESSION_INVALID). Dùng cho mọi route chỉ cần "đã đăng nhập là đủ",
 * không phân biệt role — quyền chi tiết theo từng tài nguyên (VD: chủ sở
 * hữu ghi chú, người được chia sẻ,...) vẫn do tầng Service tự kiểm tra
 * (xem noteService/noteShareService), KHÔNG thuộc phạm vi middleware này.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req);
  const session = await sessionService.findSessionByToken(token);
  req.token = token;
  req.userId = session.userId;
  req.session = session;
  next();
});

/**
 * Middleware factory: bắt buộc đã đăng nhập VÀ có quyền `permissionName`
 * trong roles.permissions. Throw AppError 401 nếu chưa đăng nhập, 403
 * nếu thiếu quyền. Dùng cho các thao tác quản trị (Module 8: Admin
 * Dashboard) — VD requirePermission("manage_users"), requirePermission("view_audit_logs").
 */
export function requirePermission(permissionName) {
  return asyncHandler(async (req, res, next) => {
    const token = getBearerToken(req);
    const session = await sessionService.findSessionByToken(token);
    const user = await userService.getUserById(session.userId, { includeRole: true });
    if (!roleService.roleHasPermission(user.role, permissionName)) {
      throw AppError.forbidden(`Bạn cần quyền "${permissionName}" để thực hiện thao tác này.`, "PERMISSION_DENIED");
    }
    req.token = token;
    req.userId = session.userId;
    req.session = session;
    req.user = user;
    next();
  });
}

export default { getBearerToken, requireAuth, requirePermission };
