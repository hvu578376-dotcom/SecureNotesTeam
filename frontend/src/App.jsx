import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./page/loginPage";
import RegisterPage from "./page/registerPage";
import ForgotPasswordPage from "./page/forgotPasswordPage";
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
    // await register({ fullName, email, password });
    console.log("register attempt", { fullName, email, password });
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
