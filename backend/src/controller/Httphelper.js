import { AppError } from "../service/index.js";

/**
 * httpHelper — các tiện ích HTTP dùng chung cho toàn bộ tầng Controller.
 *
 * Phần xác thực/phân quyền (đọc token, tra session, kiểm tra quyền) đã
 * được CHUYỂN sang middleware/auth.js (requireAuth / requirePermission),
 * gắn trực tiếp vào từng route trong router/*.js — đúng như ghi chú cũ
 * ở đây từng đề cập. Controller giờ chỉ cần đọc thẳng req.userId /
 * req.user do middleware gán sẵn, không tự tra cứu nữa.
 *
 * File này chỉ còn lo phần KHÔNG liên quan xác thực:
 *   - sendError() / asyncHandler(): chuẩn hoá cách trả lỗi JSON từ
 *     AppError ra response, tránh phải lặp lại try/catch giống hệt nhau
 *     ở mọi hàm controller (middleware/auth.js cũng tái dùng asyncHandler
 *     này để nhất quán 1 cách xử lý lỗi duy nhất cho toàn bộ app).
 *   - parsePagination(): chuẩn hoá limit/offset phân trang.
 */

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

/** Bọc 1 hàm async (controller HOẶC middleware — cả 2 đều có dạng (req,res,next)) — tự bắt lỗi (kể cả lỗi bất đồng bộ) và gọi sendError(), khỏi phải try/catch lặp lại ở từng nơi. */
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
  sendError,
  asyncHandler,
  parsePagination,
};