import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import AuthLayout from "../component/AuthLayout";
import "../style/style.css";

export default function ForgotPasswordPage({ onRequestReset }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);
  const [sent, setSent] = useState(false);

  const emailError =
    touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Vui lòng nhập đúng định dạng email."
      : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setBanner(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setBanner({
        type: "error",
        text: "Vui lòng nhập một địa chỉ email hợp lệ.",
      });
      return;
    }

    try {
      setLoading(true);
      // TODO: thay bằng lệnh gọi thật, ví dụ authService.requestPasswordReset({ email })
      if (onRequestReset) {
        await onRequestReset({ email });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setSent(true);
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
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
            <MailCheck size={36} style={{ color: "var(--teal)" }} />
          </div>
          <h1>Kiểm tra email của bạn</h1>
          <p className="sub">
            Nếu <strong style={{ color: "var(--text)" }}>{email}</strong> khớp
            với một tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu.
          </p>

          <Link
            to="/login"
            className="btn-primary"
            style={{ textDecoration: "none", marginTop: 8 }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="card">
        <h1>Quên mật khẩu?</h1>
        <p className="sub">
          Nhập email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu
        </p>

        {banner && (
          <div className={`status-banner show ${banner.type}`}>
            <ShieldCheck size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{banner.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="forgot-email">Email</label>
            <div className="input-wrap">
              <input
                id="forgot-email"
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
              Gửi liên kết đặt lại
              <ArrowRight size={16} />
            </span>
          </button>
        </form>

        <div className="divider">hoặc</div>

        <p className="footer-line">
          Đã nhớ mật khẩu? <Link to="/login">Quay lại đăng nhập</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
