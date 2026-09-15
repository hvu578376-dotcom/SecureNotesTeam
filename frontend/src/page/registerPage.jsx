import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import AuthLayout from "../component/AuthLayout";
import "../style/style.css";

export default function RegisterPage({ onRegister }) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  const emailError =
    touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Vui lòng nhập đúng định dạng email."
      : "";
  const passwordError =
    touched && password.length < 6 ? "Mật khẩu phải có ít nhất 6 ký tự." : "";
  const confirmError =
    touched && confirmPassword !== password
      ? "Mật khẩu xác nhận không khớp."
      : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setBanner(null);

    if (
      emailError ||
      passwordError ||
      confirmPassword !== password ||
      password.length < 6
    ) {
      setBanner({
        type: "error",
        text: "Vui lòng kiểm tra lại các trường được đánh dấu bên dưới.",
      });
      return;
    }

    try {
      setLoading(true);
      // TODO: thay bằng lệnh gọi thật, ví dụ authService.register({ email, password })
      if (onRegister) {
        await onRegister({ email, password });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setBanner({
        type: "info",
        text: "Tạo tài khoản thành công. Đang chuyển đến trang đăng nhập…",
      });
      setTimeout(() => navigate("/login"), 1200);
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
        <h1>Tạo tài khoản</h1>
        <p className="sub">Bắt đầu bảo vệ dữ liệu của bạn ngay hôm nay</p>

        {banner && (
          <div className={`status-banner show ${banner.type}`}>
            <ShieldCheck size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{banner.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="register-email">Email</label>
            <div className="input-wrap">
              <input
                id="register-email"
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
            <label htmlFor="register-password">Mật khẩu</label>
            <div className="input-wrap">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!passwordError}
                autoComplete="new-password"
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

          <div className="field">
            <label htmlFor="register-confirm">Xác nhận mật khẩu</label>
            <div className="input-wrap">
              <input
                id="register-confirm"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={!!confirmError}
                autoComplete="new-password"
              />
            </div>
            <div className={`error-text ${confirmError ? "show" : ""}`}>
              {confirmError}
            </div>
          </div>

          <button
            type="submit"
            className={`btn-primary ${loading ? "loading" : ""}`}
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            <span className="spinner" />
            <span
              className="btn-label"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              Tạo tài khoản
              <ArrowRight size={16} />
            </span>
          </button>
        </form>

        <div className="divider">hoặc</div>

        <p className="footer-line">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
