import { useState, useEffect, useRef } from "react";
import "./App.css";

const App = () => {
  // State quản lý form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State quản lý lỗi và banner
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [banner, setBanner] = useState({ type: "", message: "", show: false });

  // Refs cho các hiệu ứng DOM
  const hexrainRef = useRef(null);
  const wordmarkRef = useRef(null);

  // Hiệu ứng Hex-rain
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!hexrainRef.current || reduceMotion) return;

    const container = hexrainRef.current;
    container.innerHTML = ""; // Clear cũ nếu re-render
    const charset = "0123456789ABCDEF";

    for (let c = 0; c < 6; c++) {
      const col = document.createElement("span");
      col.className = "col";
      const lines = [];
      for (let i = 0; i < 40; i++) {
        lines.push(
          charset[Math.floor(Math.random() * 16)] +
            charset[Math.floor(Math.random() * 16)],
        );
      }
      col.textContent = lines.join("\n");
      container.appendChild(col);
    }
  }, []);

  // Hiệu ứng "giải mã" Wordmark
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!wordmarkRef.current || reduceMotion) return;

    const el = wordmarkRef.current;
    const finalText = "SecureNotes";
    const charset = "#$%&01ABCDEF*+/=";
    const duration = 900;
    let start = null;

    const frame = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const revealCount = Math.floor(progress * finalText.length);
      let out = "";
      for (let i = 0; i < finalText.length; i++) {
        out +=
          i < revealCount
            ? finalText[i]
            : charset[Math.floor(Math.random() * charset.length)];
      }
      el.textContent = out;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = finalText;
    };
    requestAnimationFrame(frame);
  }, []);

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setBanner({ show: false, type: "", message: "" });

    const isEmailOk = validateEmail(email.trim());
    const isPwOk = password.length >= 6;

    setEmailError(!isEmailOk);
    setPasswordError(!isPwOk);

    if (!isEmailOk || !isPwOk) return;

    setIsLoading(true);

    // Giả lập Fetch API
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password, remember }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(() => {
        setBanner({
          show: true,
          type: "info",
          message: "✓ Đăng nhập thành công. Đang chuyển hướng…",
        });
      })
      .catch(() => {
        setBanner({
          show: true,
          type: "error",
          message: (
            <>
              <strong>Chưa kết nối được API đăng nhập.</strong>
              <br />
              Backend hiện chưa có route <code>POST /api/auth/login</code> — đây
              là giao diện demo, hãy nối controller xác thực để hoàn thiện
              luồng.
            </>
          ),
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="layout">
      <aside className="brand">
        <div className="hexrain" ref={hexrainRef} aria-hidden="true"></div>
        <div className="brand-content">
          <div className="eyebrow">
            <span className="dot"></span>HỆ THỐNG GHI CHÚ MÃ HÓA
          </div>

          <div className="wordmark-row">
            <svg
              className="lock-icon"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <div
              className="wordmark"
              ref={wordmarkRef}
              role="img"
              aria-label="SecureNotes"
            >
              SecureNotes
            </div>
          </div>

          <p className="tagline">Ghi chú của bạn, mã hóa từ đầu đến cuối.</p>
          <p className="desc">
            Mỗi ghi chú được mã hóa bằng AES-256-GCM trước khi lưu trữ. Bật xác
            thực hai lớp, kiểm soát ai được xem, bình luận hay chỉnh sửa — và
            xem lại mọi hoạt động qua nhật ký kiểm tra.
          </p>
        </div>
      </aside>

      <main className="form-panel">
        <div className="card">
          <h1>Đăng nhập</h1>
          <p className="sub">Nhập thông tin để mở khóa ghi chú của bạn.</p>

          <div
            className={`status-banner ${banner.show ? "show" : ""} ${banner.type}`}
            role="status"
            aria-live="polite"
          >
            {banner.message}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="ban@vidu.com"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={emailError}
              />
              <div className={`error-text ${emailError ? "show" : ""}`}>
                Vui lòng nhập email hợp lệ.
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  minLength="6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={passwordError}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPassword}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              <div className={`error-text ${passwordError ? "show" : ""}`}>
                Mật khẩu cần tối thiểu 6 ký tự.
              </div>
            </div>

            <div className="row-between">
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="link-muted">
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              className={`btn-primary ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              <span className="spinner"></span>
              <span className="btn-label">Đăng nhập</span>
            </button>
          </form>

          <div className="divider">hoặc</div>
          <p className="footer-line">
            Chưa có tài khoản? <a href="#">Đăng ký ngay</a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
