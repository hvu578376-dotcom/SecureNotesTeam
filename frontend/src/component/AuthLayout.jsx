import { useMemo } from "react";
import { Lock } from "lucide-react";
import "../style/style.css";

const HEX_CHARS = "0123456789ABCDEF";

function makeColumn(rows) {
  let out = "";
  for (let i = 0; i < rows; i++) {
    let line = "";
    for (let j = 0; j < 4; j++) {
      line += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
    }
    out += line + "\n";
  }
  return out;
}

function HexRain() {
  const columns = useMemo(
    () => Array.from({ length: 6 }, () => makeColumn(14)),
    [],
  );
  return (
    <div className="hexrain" aria-hidden="true">
      {columns.map((text, i) => (
        <span className="col" key={i}>
          {text}
        </span>
      ))}
    </div>
  );
}

/**
 * Wraps the amber "brand" panel (logo, tagline, status log) that is shared
 * across every auth screen (login, register, forgot password...).
 * Pass the form card as children.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="layout">
      <div className="brand">
        <HexRain />
        <div className="brand-content">
          <div className="eyebrow">
            <span className="dot" />
            PHIÊN LÀM VIỆC ĐÃ MÃ HÓA
          </div>
          <div className="wordmark-row">
            <Lock size={30} className="lock-icon" strokeWidth={2.2} />
            <span className="wordmark">CIPHERVAULT</span>
          </div>
          <p className="tagline">
            Kho lưu trữ của bạn, chìa khóa của bạn, quyền kiểm soát của bạn.
          </p>
          <p className="desc">
            Mọi thông tin đăng nhập đều được mã hóa đầu-cuối trước khi rời khỏi
            thiết bị của bạn. Ngay cả chúng tôi cũng không thể đọc được.
          </p>
          <div className="status-log">
            <div>… đang chờ thông tin đăng nhập</div>
          </div>
        </div>
      </div>

      <div className="form-panel">{children}</div>
    </div>
  );
}
