import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./page/loginPage";
import RegisterPage from "./page/registerPage";
import ForgotPasswordPage from "./page/forgotPasswordPage";
import VerifyEmailPage from "./page/verifyEmailPage";
import HomePage from "./page/HomePage";
import { saveToken } from "./services/TokenService";
import { login, register, requestPasswordReset } from "./services/LoginService";

function App() {
  // Nối các hàm này với services/loginService.js của bạn.
  // Nếu thất bại, throw new Error(...) trong service — trang tương ứng sẽ tự hiện banner đỏ.
  async function handleLogin({ email, password, remember }) {
    const result = await login({ email, password, remember });
    if (result.requiresTwoFactor) {
      // Tài khoản có bật 2FA — backend đã trả đúng challengeToken (xem
      // authService.login), nhưng giao diện đăng nhập hiện chưa có màn
      // hình nhập mã 2FA (bước kế tiếp cần POST /api/auth/login/2fa với
      // challengeToken + code, xem loginService.verifyTwoFactor). Không
      // có user test nào trong seed data cuối sql.sql bật 2FA nên điều
      // này chưa chặn việc demo bằng 3 tài khoản mẫu.
      throw new Error(
        "Tài khoản này đã bật xác thực 2 lớp (2FA). Màn hình đăng nhập hiện chưa hỗ trợ nhập mã 2FA."
      );
    }
    saveToken(result.token);
    return result.user;
  }

  async function handleRegister({ email, password }) {
    await register({ email, password });
  }

  async function handleRequestReset({ email }) {
    await requestPasswordReset({ email });
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route
          path="/register"
          element={<RegisterPage onRegister={handleRegister} />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage onRequestReset={handleRequestReset} />}
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
