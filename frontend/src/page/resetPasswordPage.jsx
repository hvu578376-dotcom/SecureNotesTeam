import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import AuthLayout from "../component/AuthLayout";
import "../style/style.css";

/**
 * resetPasswordPage — Bước 2 của luồng "Quên mật khẩu".
 *
 * Đây là trang người dùng đến khi bấm liên kết trong email gửi ở bước 1
 * (forgotPasswordPage.jsx -> POST /api/auth/forgot-password ->
 * emailService.sendPasswordResetEmail), dạng:
 *   {FRONTEND_URL}/reset-password?token=<ephemeral token>
 *
 * token được đọc từ query string bằng useSearchParams() rồi gửi kèm mật
 * khẩu mới lên POST /api/auth/reset-password (qua loginService.resetPassword,
 * do App.jsx nối vào prop onResetPassword — cùng quy ước với onLogin/
 * onRegister/onRequestReset ở các trang auth khác). Route "/reset-password"
 * cần được thêm vào App.jsx thì trang này mới truy cập được.
 */
export default function ResetPasswordPage({ onResetPassword }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);
  const [done, setDone] = useState(false);

  // Khớp MIN_PASSWORD_LENGTH = 6 ở backend/src/service/authService.js và
  // userService.js (cùng ngưỡng registerPage.jsx đang dùng).
  const passwordError =
    touched && password.length < 6 ? "Mật khẩu phải có ít nhất 6 ký tự." : "";
  const confirmError =
    touched && confirmPassword !== password ? "Mật khẩu xác nhận không khớp." : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setBanner(null);

    if (password.length < 6 || confirmPassword !== password) {
      setBanner({
        type: "error",
        text: "Vui lòng kiểm tra lại các trường được đánh dấu bên dưới.",
      });
      return;
    }

    try {
      setLoading(true);
      if (onResetPassword) {
        await onResetPassword({ token, newPassword: password });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setDone(true);
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Không có token trên URL (VD người dùng tự gõ /reset-password thay vì bấm
  // liên kết trong email) -> không hiện form, hướng thẳng về bước 1 để xin
  // liên kết mới thay vì để form gọi API chắc chắn sẽ báo lỗi.
  if (!token) {
    return (
      <AuthLayout>
        <div className="card">
          <h1>Liên kết không hợp lệ</h1>
          <p className="sub">
            Liên kết đặt lại mật khẩu bị thiếu hoặc không đúng định dạng. Hãy
            yêu cầu một liên kết mới.
          </p>
          <Link
            to="/forgot-password"
            className="btn-primary"
            style={{ textDecoration: "none", marginTop: 8 }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Yêu cầu liên kết mới
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={36} style={{ color: "var(--teal)" }} />
          </div>
          <h1>Đặt lại mật khẩu thành công</h1>
          <p className="sub">
            Mật khẩu của bạn đã được cập nhật. Vì lý do bảo mật, mọi thiết bị
            khác đang đăng nhập trước đó đều đã bị đăng xuất.
          </p>

          <Link
            to="/login"
            className="btn-primary"
            style={{ textDecoration: "none", marginTop: 8 }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ArrowLeft size={16} />
              Đăng nhập ngay
            </span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="card">
        <h1>Đặt mật khẩu mới</h1>
        <p className="sub">Nhập mật khẩu mới cho tài khoản của bạn</p>

        {banner && (
          <div className={`status-banner show ${banner.type}`}>
            <ShieldCheck size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{banner.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="reset-password">Mật khẩu mới</label>
            <div className="input-wrap">
              <input
                id="reset-password"
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
            <label htmlFor="reset-confirm">Xác nhận mật khẩu mới</label>
            <div className="input-wrap">
              <input
                id="reset-confirm"
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
              Đặt lại mật khẩu
              <ArrowRight size={16} />
            </span>
          </button>
        </form>

        <div className="divider">hoặc</div>

        <p className="footer-line">
          <Link to="/login">Quay lại đăng nhập</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
