import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import AuthLayout from "../component/AuthLayout";
import "../style/style.css";

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null); // { type: 'info' | 'error', text }

  const emailError =
    touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Vui lòng nhập đúng định dạng email."
      : "";
  const passwordError =
    touched && password.length < 8 ? "Mật khẩu phải có ít nhất 8 ký tự." : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setBanner(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      setBanner({
        type: "error",
        text: "Vui lòng kiểm tra lại các trường được đánh dấu bên dưới.",
      });
      return;
    }

    try {
      setLoading(true);
      if (onLogin) {
        await onLogin({ email, password, remember });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setBanner({
        type: "info",
        text: "Đăng nhập thành công. Đang chuyển đến kho lưu trữ của bạn…",
      });
      // Chuyển sang trang chủ sau khi đã có token thật (xem App.jsx
      // handleLogin -> tokenService.saveToken) — trước đây banner báo
      // "đang chuyển đến..." nhưng không có lệnh navigate nào cả.
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="card">
        <h1>Chào mừng trở lại</h1>
        <p className="sub">Đăng nhập để truy cập kho lưu trữ của bạn</p>

        {banner && (
          <div className={`status-banner show ${banner.type}`}>
            <ShieldCheck size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{banner.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <div className="input-wrap">
              <input
                id="login-email"
                type="email"
                placeholder="ban@vidu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                autoComplete="email"
              />
            </div>
            <div className={`error-text ${emailError ? "show" : ""}`}>
              {emailError}
            </div>
          </div>

          <div className="field">
            <label htmlFor="login-password">Mật khẩu</label>
            <div className="input-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!passwordError}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div className={`error-text ${passwordError ? "show" : ""}`}>
              {passwordError}
            </div>
          </div>

          <div className="row-between">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Ghi nhớ đăng nhập
            </label>
            <Link to="/forgot-password" className="link-muted">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className={`btn-primary ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            <span className="spinner" />
            <span
              className="btn-label"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              Đăng nhập
              <ArrowRight size={16} />
            </span>
          </button>
        </form>

        <div className="divider">hoặc</div>

        <p className="footer-line">
          Chưa có tài khoản? <Link to="/register">Tạo tài khoản</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
