// loginService.js — gọi các API xác thực (POST /api/auth/...) cho App.jsx.
//
// Cùng quy ước với apiCall() trong page/homePage.jsx: mọi response backend
// đều có dạng { success: true, data } khi thành công, hoặc
// { success: false, message } khi lỗi (xem backend/src/controller/Httphelper.js
// -> sendError(), backend/src/service/appError.js).
const API_BASE = "http://localhost:3000/api";

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `Không thể gọi POST ${path}.`);
  }
  return result.data;
}

/**
 * Đăng nhập — POST /api/auth/login (xem backend/src/controller/Cauth.js
 * và backend/src/service/authService.js).
 *
 * Trả về:
 *   - { requiresTwoFactor: true, challengeToken } nếu tài khoản có bật 2FA.
 *   - { requiresTwoFactor: false, token, session, user } khi đăng nhập xong ngay.
 *
 * Hàm này KHÔNG tự lưu token — gọi tokenService.saveToken(result.token) ở
 * nơi gọi (App.jsx) sau khi nhận kết quả, để loginService chỉ lo phần gọi API.
 */
export async function login({ email, password }) {
  return apiPost("/auth/login", { email, password });
}

/**
 * Bước 2 của luồng đăng nhập khi tài khoản có bật 2FA — POST /api/auth/login/2fa.
 * Chưa có màn hình nào trong giao diện hiện tại gọi hàm này (xem ghi chú
 * trong App.jsx handleLogin) — cần bổ sung UI nhập mã 6 số trước khi dùng.
 */
export async function verifyTwoFactor({ challengeToken, code }) {
  return apiPost("/auth/login/2fa", { challengeToken, code });
}

/** Đăng ký — POST /api/auth/register. Trả về user vừa tạo (status "unverified"). */
export async function register({ email, password }) {
  const data = await apiPost("/auth/register", { email, password });
  return data.user;
}

/**
 * Quên mật khẩu — backend HIỆN CHƯA có route tương ứng (không có
 * POST /api/auth/forgot-password hay tương đương nào trong
 * backend/src/router/AuthRouter.js / controller/Cauth.js / service/authService.js
 * ở thời điểm nối API này). Thay vì gọi một endpoint không tồn tại (sẽ rơi
 * vào fallback ROUTE_NOT_FOUND ở router/index.js), hàm này throw lỗi rõ
 * ràng ngay từ phía frontend, để forgotPasswordPage.jsx hiện đúng banner đỏ
 * giải thích lý do thay vì một thông báo "route not found" chung chung.
 *
 * Khi backend bổ sung route thật (VD POST /api/auth/forgot-password nhận
 * { email }, gửi mail chứa link đặt lại mật khẩu qua emailService.js hiện
 * có), chỉ cần thay thân hàm này bằng:
 *   return apiPost("/auth/forgot-password", { email });
 */
export async function requestPasswordReset({ email }) {
  throw new Error(
    "Tính năng quên mật khẩu chưa được hỗ trợ ở backend (chưa có route /api/auth/forgot-password)."
  );
}

export default { login, verifyTwoFactor, register, requestPasswordReset };