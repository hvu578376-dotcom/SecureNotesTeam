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
 * Quên mật khẩu (bước 1) — POST /api/auth/forgot-password. Backend
 * (authService.requestPasswordReset) LUÔN trả về cùng 1 message thành công
 * dù email có tồn tại trong hệ thống hay không, để chống dò email — vì vậy
 * hàm này không nên được dùng để suy luận email đã đăng ký hay chưa, chỉ
 * nên hiển thị nguyên message trả về (xem forgotPasswordPage.jsx).
 */
export async function requestPasswordReset({ email }) {
  return apiPost("/auth/forgot-password", { email });
}

/**
 * Quên mật khẩu (bước 2) — POST /api/auth/reset-password. `token` lấy từ
 * query string của liên kết trong email (do emailService.sendPasswordResetEmail
 * sinh ra), resetPasswordPage.jsx đọc bằng useSearchParams() rồi truyền vào
 * đây cùng mật khẩu mới người dùng nhập. Đặt lại thành công thì mọi thiết
 * bị đang đăng nhập trước đó đều bị đăng xuất (xem authService.resetPassword),
 * nên sau bước này người dùng cần đăng nhập lại bằng mật khẩu mới.
 */
export async function resetPassword({ token, newPassword }) {
  return apiPost("/auth/reset-password", { token, newPassword });
}

export default { login, verifyTwoFactor, register, requestPasswordReset, resetPassword };