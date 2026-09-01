import { AppError, sessionService, userService, roleService } from "../service/index.js";

/**
 * httpHelper — các hàm dùng chung cho toàn bộ tầng Controller.
 *
 * Vì dự án CHƯA có middleware xác thực (thư mục src/middeware/ hiện vẫn
 * đang trống) và cũng chưa có router để "bơm" sẵn req.user vào request,
 * các hàm dưới đây tạm thời đảm nhiệm việc đó ngay trong Controller:
 *
 *   - getBearerToken() / getCurrentAuth() / getCurrentUserId(): đọc token
 *     phiên đăng nhập (session token thô) từ header Authorization, tra
 *     ra user đang gọi API — dựa trên sessionService (active_sessions)
 *     đã có sẵn từ trước. Ném AppError 401 nếu thiếu/không hợp lệ.
 *   - requirePermission(): chặn thao tác nếu user hiện tại không có
 *     quyền tương ứng trong roles.permissions (VD: "manage_users",
 *     "view_audit_logs" — xem seed data cuối sql.sql).
 *   - sendError() / asyncHandler(): chuẩn hoá cách trả lỗi JSON từ
 *     AppError ra response, tránh phải lặp lại try/catch giống hệt nhau
 *     ở mọi hàm controller.
 *
 * GHI CHÚ QUAN TRỌNG: khi dự án viết middleware/router riêng (bước tiếp
 * theo sau Controller), phần getCurrentAuth()/getBearerToken() nên được
 * chuyển thành 1 middleware thật (VD: requireAuth) để gán sẵn req.user
 * trước khi vào tới controller, thay vì mỗi hàm controller tự gọi lại
 * như hiện tại. Để tạm trong Controller giúp API chạy được ngay mà
 * không phải chờ thêm 1 bước nữa.
 */

// ---------------------------------------------------------------------
// Xác thực người gọi API (dựa trên active_sessions, xem sessionService.js)
// ---------------------------------------------------------------------

/** Đọc token thô từ header "Authorization: Bearer <token>" (hoặc token trần không kèm "Bearer "). Trả null nếu không có header. */
export function getBearerToken(req) {
  const header = req.headers?.authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, value] = header.split(" ");
  if (value && /^Bearer$/i.test(scheme)) return value.trim() || null;
  return header.trim() || null;
}

/** Tra cứu phiên đăng nhập từ token trong header Authorization. Throw AppError 401 nếu thiếu/không hợp lệ/hết hạn (xem sessionService.findSessionByToken). */
export async function getCurrentAuth(req) {
  const token = getBearerToken(req);
  const session = await sessionService.findSessionByToken(token);
  return { token, userId: session.userId, session };
}

/** Rút gọn getCurrentAuth() khi controller chỉ cần userId. */
export async function getCurrentUserId(req) {
  const { userId } = await getCurrentAuth(req);
  return userId;
}

/**
 * Chặn thao tác nếu user đang gọi API không có quyền `permissionName`
 * (dựa trên roles.permissions — xem seed data cuối sql.sql: create_note,
 * share_note, manage_users, view_audit_logs). Throw AppError 403 nếu
 * không đủ quyền, AppError 401 nếu chưa đăng nhập. Trả về userId nếu
 * hợp lệ để controller dùng tiếp, khỏi phải gọi lại getCurrentUserId().
 */
export async function requirePermission(req, permissionName) {
  const userId = await getCurrentUserId(req);
  const user = await userService.getUserById(userId, { includeRole: true });
  if (!roleService.roleHasPermission(user.role, permissionName)) {
    throw AppError.forbidden(`Bạn cần quyền "${permissionName}" để thực hiện thao tác này.`, "PERMISSION_DENIED");
  }
  return userId;
}

// ---------------------------------------------------------------------
// Chuẩn hoá response
// ---------------------------------------------------------------------

/** Chuyển AppError (hoặc lỗi lạ/không lường trước) thành response JSON nhất quán cho toàn bộ API. */
export function sendError(res, err) {
  if (AppError.isAppError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }
  // Lỗi không lường trước (bug code, mất kết nối DB,...) — log đầy đủ ở server,
  // nhưng KHÔNG trả chi tiết (stack, message gốc) ra ngoài cho client.
  console.error("[controller] Lỗi không xác định:", err);
  return res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: "Đã có lỗi hệ thống xảy ra.",
  });
}

/** Bọc 1 hàm controller async — tự bắt lỗi (kể cả lỗi bất đồng bộ) và gọi sendError(), khỏi phải try/catch lặp lại ở từng hàm controller. */
export function asyncHandler(handler) {
  return function (req, res, next) {
    Promise.resolve(handler(req, res, next)).catch((err) => sendError(res, err));
  };
}

/** Chuẩn hoá limit/offset phân trang từ query string, có chặn giá trị bất thường (âm, quá lớn, không phải số). */
export function parsePagination(query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) {
  let limit = parseInt(query.limit, 10);
  let offset = parseInt(query.offset, 10);
  if (!Number.isFinite(limit) || limit <= 0) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  if (!Number.isFinite(offset) || offset < 0) offset = 0;
  return { limit, offset };
}

export default {
  getBearerToken,
  getCurrentAuth,
  getCurrentUserId,
  requirePermission,
  sendError,
  asyncHandler,
  parsePagination,
};