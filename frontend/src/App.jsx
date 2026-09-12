import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./page/loginPage";
import RegisterPage from "./page/registerPage";
import ForgotPasswordPage from "./page/forgotPasswordPage";
import VerifyEmailPage from "./page/verifyEmailPage";
// import { saveToken } from "./services/tokenService";
// import { login, register, requestPasswordReset } from "./services/loginService";

function App() {
  // Nối các hàm này với services/loginService.js của bạn.
  // Nếu thất bại, throw new Error(...) trong service — trang tương ứng sẽ tự hiện banner đỏ.
  async function handleLogin({ email, password, remember }) {
    // const res = await login({ email, password, remember });
    // saveToken(res.token);
    console.log("login attempt", { email, password, remember });
  }

  async function handleRegister({ fullName, email, password }) {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Đăng ký thất bại.");
  }

  async function handleRequestReset({ email }) {
    // await requestPasswordReset({ email });
    console.log("request password reset", { email });
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
