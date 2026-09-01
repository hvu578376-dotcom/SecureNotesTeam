/**
 * AppError — lớp lỗi dùng chung cho toàn bộ tầng Service.
 *
 * Vì sao cần file này: Controller (sẽ viết ở bước sau) cần biết mã HTTP
 * status và một "code" ổn định (không đổi theo ngôn ngữ) để quyết định
 * cách trả response, thay vì phải đoán ý nghĩa lỗi qua chuỗi message tiếng
 * Việt. Mọi service trong thư mục này NÊM throw AppError thay vì Error
 * thường, để lỗi nghiệp vụ (VD: sai mật khẩu, không có quyền,...) tách
 * biệt rõ với lỗi hệ thống thật sự (mất kết nối DB, bug code,...).
 *
 * Quy ước:
 *   - statusCode: mã HTTP tương ứng (400, 401, 403, 404, 409, 429, 500...)
 *   - code: mã ổn định dùng cho FE/log, SCREAMING_SNAKE_CASE.
 *   - message: mô tả cho người dùng cuối, viết tiếng Việt vì FE hiện tại
 *     (login.html) và toàn bộ comment trong dự án đều dùng tiếng Việt.
 *   - details: (tuỳ chọn) object phụ, VD lỗi validate từng field.
 */
export class AppError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Giữ lại stack trace gốc, loại bỏ constructor này khỏi stack cho dễ đọc
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message, code = "BAD_REQUEST", details) {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = "Bạn cần đăng nhập để thực hiện thao tác này.", code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  }

  static forbidden(message = "Bạn không có quyền thực hiện thao tác này.", code = "FORBIDDEN") {
    return new AppError(403, code, message);
  }

  static notFound(message = "Không tìm thấy dữ liệu.", code = "NOT_FOUND") {
    return new AppError(404, code, message);
  }

  static conflict(message, code = "CONFLICT") {
    return new AppError(409, code, message);
  }

  static tooManyRequests(message = "Bạn thao tác quá nhiều lần, vui lòng thử lại sau.", code = "TOO_MANY_REQUESTS") {
    return new AppError(429, code, message);
  }

  static internal(message = "Đã có lỗi hệ thống xảy ra.", code = "INTERNAL_ERROR") {
    return new AppError(500, code, message);
  }

  /** true nếu err là AppError (kể cả khi bị proxy/wrap qua instanceof lệch module graph) */
  static isAppError(err) {
    return err instanceof AppError || err?.name === "AppError";
  }
}

export default AppError;
