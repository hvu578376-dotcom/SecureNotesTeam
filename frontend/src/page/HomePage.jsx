import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Eye,
  FileText,
  Users,
  Share2,
  Trash2,
  RotateCcw,
  Bell,
  Settings,
  LogOut,
  Search,
  Plus,
  X,
  ChevronDown,
  Menu,
  Check,
  AlertTriangle,
  Mail,
  Activity,
  Monitor,
  Sparkles,
  UserPlus,
} from "lucide-react";

/* ============================================================
 * HomePage — Trang chủ sau khi đăng nhập ("Ghi chú của tôi").
 *
 * Ghép nối 3 route thật đã có ở backend (xem NoteRouter.js,
 * TrashRouter.js, NoteShareRouter.js, NotificationRouter.js,
 * usersRouter.js) vào 1 màn hình duy nhất, đổi view nội bộ thay vì
 * tách route riêng — vì cả "Ghi chú của tôi", "Được chia sẻ" và
 * "Thùng rác" đều dùng chung 1 kiểu lưới note-card.
 *
 * App.jsx hiện CHƯA lưu token đăng nhập ở đâu cả (xem handleLogin bị
 * comment), nên mọi lệnh gọi API bên dưới sẽ trả 401 nếu chạy thật cho
 * tới khi luồng đó được nối xong. Vì vậy trang này luôn khởi tạo bằng
 * dữ liệu mẫu (SAMPLE_*, đúng field như response thật) rồi mới thử gọi
 * API thật trong useEffect — không bao giờ hiển thị trống/giật cục, và
 * khi luồng đăng nhập được nối xong thì phần UI này không cần sửa lại.
 * ============================================================ */

const API_BASE = "http://localhost:3000/api";

// TODO: thay bằng services/tokenService.js thật khi login lưu lại
// data.token (xem Cauth.js — login trả { token, session, user }).
function authHeaders() {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("cn_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiCall(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message || `Không thể gọi ${method} ${path}`);
  }
  return payload.data;
}
const apiGet = (path) => apiCall("GET", path);
const apiPost = (path, body) => apiCall("POST", path, body ?? {});
const apiPatch = (path, body) => apiCall("PATCH", path, body ?? {});
const apiDelete = (path) => apiCall("DELETE", path);

// Cùng thang quyền với noteShareService.ACCESS_RANK ở backend (owner > edit
// > comment > view), để nút bấm trên giao diện chỉ hiện đúng theo quyền
// thật — tránh vẽ ra hành động mà API chắc chắn sẽ từ chối.
const ACCESS_RANK = { view: 1, comment: 2, edit: 3, owner: 4 };
function hasAtLeast(level, required) {
  if (!level || !(level in ACCESS_RANK)) return false;
  return ACCESS_RANK[level] >= ACCESS_RANK[required];
}
function getAccess(view, note) {
  if (view === "trash") return "trash";
  if (view === "mine") return "owner";
  return note?.permissionLevel || "view"; // xem ghi chú noteService.listSharedWithMe bên dưới
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}
function daysAgo(d) {
  return hoursAgo(d * 24);
}
function timeAgo(iso) {
  if (!iso) return "";
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ trước`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

// Khớp THIRTY_DAYS_MS trong backend/src/models/trashModel.js.
const TRASH_RETENTION_DAYS = 30;
function daysLeftInTrash(deletedAt) {
  if (!deletedAt) return TRASH_RETENTION_DAYS;
  const deadline = new Date(deletedAt).getTime() + TRASH_RETENTION_DAYS * 24 * 3600 * 1000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / (24 * 3600 * 1000)));
}

const NOTE_COLORS = [
  { value: "#00d4aa", name: "Bạc hà" },
  { value: "#00b4ff", name: "Xanh dương" },
  { value: "#f59e0b", name: "Hổ phách" },
  { value: "#ef4444", name: "Đỏ" },
  { value: "#8b5cf6", name: "Tím" },
  { value: "#64748b", name: "Xám" },
];

// Nhãn hiển thị theo đúng permissions[] trong seed data cuối sql.sql.
const ROLE_STYLE = {
  free_user: { label: "Free", bg: "#1a2035", fg: "#94a3b8" },
  premium_user: { label: "Premium", bg: "#00d4aa1f", fg: "#00d4aa" },
  admin: { label: "Admin", bg: "#00b4ff1f", fg: "#00b4ff" },
  super_admin: { label: "Super Admin", bg: "#f59e0b1f", fg: "#f59e0b" },
};
const PERMISSION_LABEL = { view: "Chỉ xem", comment: "Bình luận", edit: "Chỉnh sửa" };

/* ============================================================
 * Dữ liệu mẫu — field khớp đúng response thật (xem CNotes.js,
 * CTrash.js, CNotifications.js, Cusers.js) để khi nối API xong,
 * phần giao diện gần như không cần sửa lại.
 *
 * LƯU Ý (đọc kỹ noteService.js/noteShareService.js):
 *  - isEncrypted LUÔN true cho mọi note tạo qua noteService.createNote,
 *    và content luôn được giải mã (decorateWithPlainContent) trước khi
 *    trả về cho chủ sở hữu/người được share — "mã hoá" ở đây bảo vệ dữ
 *    liệu NẰM YÊN trong DB, không che nội dung khỏi người có quyền xem.
 *    Vì vậy UI KHÔNG che nội dung theo isEncrypted (sẽ luôn đúng 100%,
 *    không nói lên điều gì) — chỉ hiển thị ambient 1 chỗ ở sidebar.
 *  - isPrivate chỉ là 1 cờ hiển thị, backend CHƯA có cột mật khẩu cấp 2
 *    (xem docblock noteService.js) — phần "che rồi bấm Xem nội dung"
 *    dưới đây vì vậy chỉ là gợi ý giao diện, không phải lớp bảo mật thật.
 *  - GET /notes/shared-with-me hiện trả Note thô, CHƯA join thêm
 *    owner/permissionLevel (noteService.listSharedWithMe không include
 *    NoteShare) — 2 trường ownerEmail/permissionLevel dưới đây vì vậy
 *    chỉ có ở dữ liệu mẫu, cần bổ sung include ở service đó mới có thật.
 * ============================================================ */

const SAMPLE_ME = {
  id: "sample-free-user",
  email: "free.user@securenotes.test",
  status: "active",
  isTwoFactorEnabled: false,
  role: { id: 1, name: "free_user", permissions: ["create_note", "share_note"] },
};

const SAMPLE_NOTES = [
  {
    id: "note-1",
    title: "Checklist bàn giao ca trực",
    content:
      "1. Xoay lại secret trong .env trước khi merge\n2. Kiểm tra lại CORS ở server.js\n3. Rà middleware/auth.js cho route mới\n4. Báo nhóm backend nếu đổi response shape",
    color: "#00d4aa",
    isPrivate: false,
    isEncrypted: true,
    isTrashed: false,
    updatedAt: hoursAgo(0.4),
  },
  {
    id: "note-2",
    title: "Mã khôi phục 2FA",
    content: "7F2K-9QX1-4M0D\n3B6L-2ZP8-7T1S\n(dùng khi mất thiết bị Authenticator)",
    color: "#ef4444",
    isPrivate: true,
    isEncrypted: true,
    isTrashed: false,
    updatedAt: hoursAgo(2),
  },
  {
    id: "note-3",
    title: "Ý tưởng: chia sẻ theo nhóm",
    content:
      'Thay vì share từng email một, cho phép tạo "nhóm" rồi share note cho cả nhóm — giảm thao tác lặp lại ở noteShareService.shareNote().',
    color: "#00b4ff",
    isPrivate: false,
    isEncrypted: true,
    isTrashed: false,
    updatedAt: hoursAgo(5),
  },
  {
    id: "note-4",
    title: "Ghi chú họp với team backend",
    content:
      "- Thứ tự quyền: owner > edit > comment > view\n- Trash không có bảng riêng, chỉ 2 cột is_trashed/deleted_at\n- Cron dọn thùng rác sau đúng 30 ngày",
    color: "#8b5cf6",
    isPrivate: false,
    isEncrypted: true,
    isTrashed: false,
    updatedAt: daysAgo(1),
  },
  {
    id: "note-5",
    title: "Audit gói phụ thuộc trước release",
    content: "npm audit --production\nXem lại các gói ít dùng, cân nhắc gỡ bớt cho nhẹ bundle.",
    color: "#64748b",
    isPrivate: false,
    isEncrypted: true,
    isTrashed: false,
    updatedAt: daysAgo(3),
  },
  {
    id: "note-6",
    title: "Khoá sao lưu ổ đĩa mã hoá",
    content: "Recovery key: EF19-88AC-33D0-991A-77BB-2C40-EE01-5F3D",
    color: "#f59e0b",
    isPrivate: true,
    isEncrypted: true,
    isTrashed: false,
    updatedAt: daysAgo(6),
  },
];

const SAMPLE_SHARED = [
  {
    id: "shared-1",
    title: "Quy trình xử lý sự cố bảo mật",
    content: "Bước 1: Cô lập phiên đăng nhập nghi ngờ.\nBước 2: Ghi nhận vào audit_logs.\nBước 3: Đổi mật khẩu, thu hồi toàn bộ session.",
    color: "#00b4ff",
    isPrivate: false,
    isEncrypted: true,
    ownerEmail: "admin@securenotes.test",
    permissionLevel: "edit",
    updatedAt: hoursAgo(3),
  },
  {
    id: "shared-2",
    title: "Bảng phân quyền vai trò (roles)",
    content:
      "free_user: create_note, share_note\npremium_user: + unlimited_storage\nadmin/super_admin: + manage_users, view_audit_logs",
    color: "#8b5cf6",
    isPrivate: false,
    isEncrypted: true,
    ownerEmail: "premium.user@securenotes.test",
    permissionLevel: "comment",
    updatedAt: daysAgo(1),
  },
  {
    id: "shared-3",
    title: "Ghi chú riêng của khách mời",
    content: "Nội dung riêng tư do chủ ghi chú chia sẻ ở chế độ chỉ xem.",
    color: "#64748b",
    isPrivate: true,
    isEncrypted: true,
    ownerEmail: "free.user2@securenotes.test",
    permissionLevel: "view",
    updatedAt: daysAgo(5),
  },
];

const SAMPLE_TRASH = [
  {
    id: "trash-1",
    title: "Nháp cũ — bỏ",
    content: "Không dùng nữa, để lại phòng khi cần đối chiếu.",
    color: "#64748b",
    isPrivate: false,
    isEncrypted: true,
    updatedAt: daysAgo(2),
    deletedAt: daysAgo(2),
  },
  {
    id: "trash-2",
    title: "Ghi chú test luồng đính kèm",
    content: "Note test khi làm attachmentService, có thể xoá vĩnh viễn.",
    color: "#ef4444",
    isPrivate: false,
    isEncrypted: true,
    updatedAt: daysAgo(27),
    deletedAt: daysAgo(27),
  },
];

const SAMPLE_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "note_shared",
    message: '"Bảng phân quyền vai trò (roles)" đã được chia sẻ với bạn (quyền: comment).',
    isRead: false,
    createdAt: hoursAgo(0.2),
  },
  {
    id: "notif-2",
    type: "new_comment",
    message: 'Có bình luận mới trên ghi chú "Quy trình xử lý sự cố bảo mật" của bạn.',
    isRead: false,
    createdAt: hoursAgo(1),
  },
  {
    id: "notif-3",
    type: "note_shared",
    message: '"Ghi chú riêng của khách mời" đã được chia sẻ với bạn (quyền: view).',
    isRead: true,
    createdAt: daysAgo(1),
  },
];

const INITIAL_SHARES = {
  "note-3": [{ id: "s1", email: "premium.user@securenotes.test", permissionLevel: "comment" }],
};

/* ============================================================
 * Thành phần nhỏ dùng lại trong trang
 * ============================================================ */

function ColorDot({ color }) {
  return <span className="color-dot" style={{ background: color || "#334155" }} />;
}

function ToggleRow({ on, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!on)}
      aria-pressed={on}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        fontSize: 11.5,
        color: "#94a3b8",
      }}
    >
      <span className={`switch ${on ? "on" : ""}`} aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      {label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="stat-card flex items-center gap-3">
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 34, height: 34, borderRadius: 3, background: `${tint}1f`, color: tint }}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1, color: "#e2e8f0" }}>{value}</div>
        <div className="truncate" style={{ fontSize: 11, marginTop: 4, color: "#64748b" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button type="button" className={`filter-chip ${active ? "active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function VeiledPreview({ onReveal }) {
  return (
    <div>
      <div className="veil-line" style={{ width: "92%" }} />
      <div className="veil-line" style={{ width: "68%", marginBottom: 8 }} />
      <button
        type="button"
        className="mono"
        onClick={(e) => {
          e.stopPropagation();
          onReveal();
        }}
        style={{
          background: "transparent",
          border: "none",
          color: "#00d4aa",
          fontSize: 11,
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Eye size={12} /> Xem nội dung riêng tư
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="empty-state">
      <Icon size={26} style={{ color: "#334155" }} />
      <div style={{ fontSize: 13.5, color: "#94a3b8", fontWeight: 600 }}>{title}</div>
      {hint && <div style={{ fontSize: 12, maxWidth: 320 }}>{hint}</div>}
    </div>
  );
}

function SidebarItem({ icon: Icon, label, count, active, onClick }) {
  return (
    <button
      type="button"
      className={`sidebar-item ${active ? "active" : ""}`}
      onClick={onClick}
      style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", font: "inherit", cursor: "pointer" }}
    >
      <Icon size={15} />
      <span style={{ flex: 1 }}>{label}</span>
      {count > 0 && (
        <span className="mono" style={{ fontSize: 10.5, color: active ? "#00d4aa" : "#475569" }}>
          {count}
        </span>
      )}
    </button>
  );
}

function NoteCard({ note, view, selected, onSelect, onTrash, onRestore, onDeleteForever }) {
  const [revealed, setRevealed] = useState(false);
  const clickable = view !== "trash";
  const daysLeft = view === "trash" ? daysLeftInTrash(note.deletedAt) : null;
  const showVeil = note.isPrivate && !revealed;

  return (
    <div
      className={`note-card animate-in ${selected ? "selected" : ""}`}
      onClick={clickable ? () => onSelect(note.id) : undefined}
      style={{ cursor: clickable ? "pointer" : "default" }}
    >
      <div className="flex items-start gap-2 mb-2">
        <div style={{ marginTop: 5 }}>
          <ColorDot color={note.color} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {note.isPrivate && <Lock size={11} style={{ color: "#f59e0b", flexShrink: 0 }} />}
            <h3 className="truncate" style={{ fontSize: 13.5, fontWeight: 600, color: "#e2e8f0" }}>
              {note.title}
            </h3>
          </div>
        </div>
        {view === "mine" && (
          <button
            type="button"
            className="icon-btn tooltip"
            data-tip="Chuyển vào thùng rác"
            style={{ width: 26, height: 26, flexShrink: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onTrash(note.id);
            }}
          >
            <Trash2 size={13} />
          </button>
        )}
        {view === "trash" && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              className="icon-btn tooltip"
              data-tip="Khôi phục"
              style={{ width: 26, height: 26 }}
              onClick={(e) => {
                e.stopPropagation();
                onRestore(note.id);
              }}
            >
              <RotateCcw size={13} />
            </button>
            <button
              type="button"
              className="icon-btn tooltip"
              data-tip="Xoá vĩnh viễn"
              style={{ width: 26, height: 26, color: "#ef4444" }}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteForever(note.id);
              }}
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      <div style={{ minHeight: 46 }}>
        {showVeil ? (
          <VeiledPreview onReveal={() => setRevealed(true)} />
        ) : (
          <p
            className="mono"
            style={{
              fontSize: 11.5,
              lineHeight: 1.6,
              color: "#64748b",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              whiteSpace: "pre-line",
              margin: 0,
            }}
          >
            {note.content}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 flex-wrap gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {view === "shared" && note.permissionLevel && (
            <span className="tag" style={{ background: "#00b4ff1a", color: "#00b4ff" }}>
              {PERMISSION_LABEL[note.permissionLevel] || note.permissionLevel}
            </span>
          )}
          {view === "shared" && (
            <span className="tag" style={{ background: "#1a2035", color: "#64748b" }}>
              {note.ownerEmail ? note.ownerEmail.split("@")[0] : "không rõ người chia sẻ"}
            </span>
          )}
          {view === "trash" && (
            <span
              className="tag"
              style={{
                background: daysLeft <= 3 ? "#ef44441a" : "#1a2035",
                color: daysLeft <= 3 ? "#ef4444" : "#64748b",
              }}
            >
              Còn {daysLeft} ngày
            </span>
          )}
        </div>
        <span className="mono" style={{ fontSize: 10.5, color: "#475569", flexShrink: 0 }}>
          {timeAgo(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function ComposeCard({ onCancel, onCreate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0].value);
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!title.trim()) {
      setError("Ghi chú cần có tiêu đề.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreate({ title: title.trim(), content, color, isPrivate });
    } catch (err) {
      setError(err.message || "Không thể tạo ghi chú.");
      setSaving(false);
    }
  }

  return (
    <div className="note-card animate-in" style={{ cursor: "default", gridColumn: "1 / -1" }}>
      <input
        className="field-plain"
        placeholder="Tiêu đề ghi chú..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}
        autoFocus
      />
      <textarea
        className="field-plain mono"
        placeholder="Nội dung..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        style={{ fontSize: 12, lineHeight: 1.6, resize: "vertical" }}
      />
      {error && <p style={{ color: "#ef4444", fontSize: 11.5, marginTop: 6 }}>{error}</p>}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.name}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: c.value,
                  border: color === c.value ? "2px solid #e2e8f0" : "2px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
          <ToggleRow on={isPrivate} onToggle={setIsPrivate} label="Riêng tư" />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Hủy
          </button>
          <button type="button" className="btn-primary flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
            <Check size={13} /> {saving ? "Đang lưu..." : "Lưu ghi chú"}
          </button>
        </div>
      </div>
      <p className="mono" style={{ fontSize: 10, color: "#334155", marginTop: 10 }}>
        Ghi chú sẽ tự động được mã hoá khi lưu (AES-256-GCM, encryption at rest).
      </p>
    </div>
  );
}

function NotificationsPanel({ notifications, onMarkAllRead, onMarkRead, onDelete }) {
  return (
    <div className="dropdown-panel animate-in">
      <div
        className="flex items-center justify-between"
        style={{ padding: "10px 14px", borderBottom: "1px solid #1e2a3a" }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#e2e8f0" }}>Thông báo</span>
        <button
          type="button"
          onClick={onMarkAllRead}
          style={{ background: "none", border: "none", color: "#00d4aa", fontSize: 11, cursor: "pointer" }}
        >
          Đánh dấu đã đọc hết
        </button>
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: "28px 14px", textAlign: "center", color: "#475569", fontSize: 12 }}>
          Chưa có thông báo nào.
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className={`notif-row ${n.isRead ? "" : "unread"}`} onClick={() => onMarkRead(n.id)}>
            <div style={{ marginTop: 2, flexShrink: 0 }}>
              {n.type === "note_shared" ? (
                <Share2 size={14} style={{ color: "#00b4ff" }} />
              ) : (
                <Mail size={14} style={{ color: "#00d4aa" }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: n.isRead ? "#64748b" : "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
                {n.message}
              </p>
              <span className="mono" style={{ fontSize: 10, color: "#475569" }}>
                {timeAgo(n.createdAt)}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(n.id);
              }}
              style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", flexShrink: 0, padding: 2 }}
            >
              <X size={13} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

const menuBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "10px 14px",
  background: "none",
  border: "none",
  color: "#94a3b8",
  fontSize: 12.5,
  cursor: "pointer",
  textAlign: "left",
};

function UserMenuPanel({ me, roleStyle, onSettings, onLogout }) {
  return (
    <div className="dropdown-panel animate-in" style={{ width: 240 }}>
      <div style={{ padding: 14, borderBottom: "1px solid #1e2a3a" }}>
        <div style={{ fontSize: 12.5, color: "#e2e8f0", fontWeight: 600, wordBreak: "break-all" }}>{me?.email}</div>
        <span className="badge mt-2" style={{ background: roleStyle.bg, color: roleStyle.fg, display: "inline-flex" }}>
          {roleStyle.label}
        </span>
      </div>
      <button type="button" style={menuBtnStyle} onClick={onSettings}>
        <Settings size={14} /> Cài đặt tài khoản
      </button>
      <button type="button" style={{ ...menuBtnStyle, color: "#ef4444" }} onClick={onLogout}>
        <LogOut size={14} /> Đăng xuất
      </button>
    </div>
  );
}

function DetailPanel({
  note,
  view,
  onClose,
  onTitleChange,
  onContentChange,
  onColorChange,
  onTogglePrivate,
  onTrash,
  onRestore,
  onDeleteForever,
  saveStatus,
  shares,
  shareEmail,
  onShareEmailChange,
  sharePermission,
  onSharePermissionChange,
  onAddShare,
}) {
  const [revealed, setRevealed] = useState(false);
  const access = getAccess(view, note);
  const canEdit = hasAtLeast(access, "edit");
  const isOwner = access === "owner";
  const daysLeft = view === "trash" ? daysLeftInTrash(note.deletedAt) : null;
  const showVeil = note.isPrivate && !revealed && view !== "trash";

  return (
    <aside className="detail-panel animate-in">
      <div className="flex items-center justify-between mb-4">
        <span
          className="mono"
          style={{ fontSize: 10.5, letterSpacing: "0.06em", color: "#475569", textTransform: "uppercase" }}
        >
          {view === "mine" ? "Ghi chú của bạn" : view === "shared" ? "Được chia sẻ với bạn" : "Trong thùng rác"}
        </span>
        <button type="button" className="icon-btn" onClick={onClose}>
          <X size={15} />
        </button>
      </div>

      {canEdit ? (
        <input
          className="field-plain"
          value={note.title}
          onChange={(e) => onTitleChange(e.target.value)}
          style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}
        />
      ) : (
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>{note.title}</h2>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <ColorDot color={note.color} />
        {note.isPrivate && (
          <span className="tag flex items-center gap-1" style={{ background: "#f59e0b1a", color: "#f59e0b" }}>
            <Lock size={10} /> Riêng tư
          </span>
        )}
        {view === "shared" && note.permissionLevel && (
          <span className="tag" style={{ background: "#00b4ff1a", color: "#00b4ff" }}>
            {PERMISSION_LABEL[note.permissionLevel] || note.permissionLevel}
          </span>
        )}
        <span className="mono" style={{ fontSize: 10.5, color: "#475569" }}>
          Cập nhật {timeAgo(note.updatedAt)}
        </span>
      </div>

      {showVeil ? (
        <div className="mb-4">
          <VeiledPreview onReveal={() => setRevealed(true)} />
        </div>
      ) : canEdit ? (
        <textarea
          className="field-plain mono"
          value={note.content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={10}
          style={{ fontSize: 12.5, lineHeight: 1.7, resize: "vertical", marginBottom: 6 }}
        />
      ) : (
        <p
          className="mono"
          style={{ fontSize: 12.5, lineHeight: 1.7, color: "#94a3b8", whiteSpace: "pre-line", marginBottom: 12 }}
        >
          {note.content}
        </p>
      )}

      {canEdit && (
        <div className="mono" style={{ fontSize: 10.5, color: "#475569", marginBottom: 16, minHeight: 14 }}>
          {saveStatus === "saving" && "Đang lưu..."}
          {saveStatus === "saved" && "Đã lưu."}
        </div>
      )}

      {isOwner && view !== "trash" && (
        <>
          <div className="panel" style={{ padding: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>Màu ghi chú</span>
            <div className="flex items-center gap-2 my-3">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  onClick={() => onColorChange(c.value)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: c.value,
                    border: note.color === c.value ? "2px solid #e2e8f0" : "2px solid transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              ))}
            </div>
            <ToggleRow on={note.isPrivate} onToggle={onTogglePrivate} label="Đánh dấu là ghi chú riêng tư" />
          </div>

          <div className="panel" style={{ padding: 12, marginBottom: 14 }}>
            <div className="flex items-center gap-2 mb-3" style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>
              <Share2 size={13} /> Chia sẻ ghi chú
            </div>
            {shares.length > 0 && (
              <div className="mb-3" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {shares.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2" style={{ fontSize: 11.5, color: "#94a3b8" }}>
                    <span className="truncate">{s.email}</span>
                    <span className="tag" style={{ background: "#1a2035", color: "#64748b", flexShrink: 0 }}>
                      {PERMISSION_LABEL[s.permissionLevel]}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="email"
                className="input-field flex-1"
                placeholder="email@vidu.com"
                value={shareEmail}
                onChange={(e) => onShareEmailChange(e.target.value)}
                style={{ fontSize: 12 }}
              />
              <select
                className="input-field"
                value={sharePermission}
                onChange={(e) => onSharePermissionChange(e.target.value)}
                style={{ width: 110, fontSize: 12, flexShrink: 0 }}
              >
                <option value="view">Chỉ xem</option>
                <option value="comment">Bình luận</option>
                <option value="edit">Chỉnh sửa</option>
              </select>
            </div>
            <button
              type="button"
              className="btn-ghost flex items-center justify-center gap-1.5 mt-2"
              style={{ width: "100%" }}
              onClick={onAddShare}
              disabled={!shareEmail.trim()}
            >
              <UserPlus size={13} /> Mời
            </button>
          </div>
        </>
      )}

      {view === "trash" ? (
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost flex items-center justify-center gap-1.5 flex-1" onClick={onRestore}>
            <RotateCcw size={13} /> Khôi phục
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 flex-1"
            style={{
              background: "#ef44441a",
              color: "#ef4444",
              border: "1px solid #ef444444",
              borderRadius: 3,
              padding: "7px 14px",
              fontSize: 12,
              cursor: "pointer",
            }}
            onClick={onDeleteForever}
          >
            <X size={13} /> Xoá vĩnh viễn
          </button>
        </div>
      ) : (
        isOwner && (
          <button type="button" className="btn-ghost flex items-center gap-1.5" onClick={onTrash}>
            <Trash2 size={13} /> Chuyển vào thùng rác
          </button>
        )
      )}
      {view === "trash" && (
        <p className="mono" style={{ fontSize: 10.5, color: daysLeft <= 3 ? "#ef4444" : "#475569", marginTop: 10 }}>
          Tự động xoá vĩnh viễn sau {daysLeft} ngày nữa.
        </p>
      )}
    </aside>
  );
}

/* ============================================================
 * HomePage
 * ============================================================ */

export default function HomePage() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [sharedNotes, setSharedNotes] = useState(SAMPLE_SHARED);
  const [trashedNotes, setTrashedNotes] = useState(SAMPLE_TRASH);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(SAMPLE_NOTIFICATIONS.filter((n) => !n.isRead).length);
  const [me, setMe] = useState(SAMPLE_ME);
  const [offline, setOffline] = useState(false);

  const [activeView, setActiveView] = useState("mine"); // 'mine' | 'shared' | 'trash'
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'private'
  const [selectedId, setSelectedId] = useState(null);
  const [composing, setComposing] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [sharesByNoteId, setSharesByNoteId] = useState(INITIAL_SHARES);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("view");

  const saveTimer = useRef(null);
  const toastTimer = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleDocClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  async function fetchAll() {
    try {
      const [mine, shared, trash, notifRows, unread, meData] = await Promise.all([
        apiGet("/notes"),
        apiGet("/notes/shared-with-me"),
        apiGet("/trash"),
        apiGet("/notifications"),
        apiGet("/notifications/unread-count"),
        apiGet("/users/me"),
      ]);
      setNotes(mine);
      setSharedNotes(shared);
      setTrashedNotes(trash);
      setNotifications(notifRows);
      setUnreadCount(unread.count);
      setMe(meData.user);
      setOffline(false);
    } catch (err) {
      // Bình thường ở giai đoạn hiện tại: App.jsx chưa lưu token đăng nhập
      // (xem comment đầu file) nên các request trên trả 401. Giữ nguyên
      // dữ liệu mẫu để giao diện luôn có nội dung để xem/duyệt.
      console.warn("[HomePage] Dùng dữ liệu mẫu — chưa gọi được API thật:", err.message);
      setOffline(true);
    }
  }

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }
  function handleComingSoon(label) {
    showToast(`${label}: màn hình riêng sẽ có ở bản cập nhật tiếp theo.`);
  }

  function switchView(view) {
    setActiveView(view);
    setSelectedId(null);
    setComposing(false);
    setQuery("");
    setActiveFilter("all");
    setMobileNavOpen(false);
  }

  function openCompose() {
    setActiveView("mine");
    setSelectedId(null);
    setComposing(true);
    setMobileNavOpen(false);
  }

  function selectNote(id) {
    setComposing(false);
    setSelectedId(id);
    setShareEmail("");
    setSharePermission("view");
  }

  async function handleCreateNote(payload) {
    const optimistic = {
      id: `local-${Date.now()}`,
      title: payload.title,
      content: payload.content,
      color: payload.color,
      isPrivate: payload.isPrivate,
      isEncrypted: true,
      isTrashed: false,
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [optimistic, ...prev]);
    setComposing(false);
    showToast("Đã tạo ghi chú.");
    try {
      const created = await apiPost("/notes", payload);
      setNotes((prev) => prev.map((n) => (n.id === optimistic.id ? created : n)));
    } catch (err) {
      console.warn("Không thể lưu lên máy chủ (demo/offline):", err.message);
    }
  }

  function handleTrash(id) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setTrashedNotes((prev) => [{ ...note, isTrashed: true, deletedAt: new Date().toISOString() }, ...prev]);
    if (selectedId === id) setSelectedId(null);
    showToast("Đã chuyển vào thùng rác.");
    apiPost(`/notes/${id}/trash`).catch((err) => console.warn(err.message));
  }

  function handleRestore(id) {
    const note = trashedNotes.find((n) => n.id === id);
    if (!note) return;
    setTrashedNotes((prev) => prev.filter((n) => n.id !== id));
    setNotes((prev) => [{ ...note, isTrashed: false, deletedAt: null }, ...prev]);
    if (selectedId === id) setSelectedId(null);
    showToast("Đã khôi phục ghi chú.");
    apiPost(`/notes/${id}/restore`).catch((err) => console.warn(err.message));
  }

  function handleDeleteForever(id) {
    if (typeof window !== "undefined" && !window.confirm("Xoá vĩnh viễn ghi chú này? Không thể hoàn tác.")) return;
    setTrashedNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
    showToast("Đã xoá vĩnh viễn.");
    apiDelete(`/trash/${id}`).catch((err) => console.warn(err.message));
  }

  function updateSelectedNote(patch) {
    if (!selectedId) return;
    const updater = (list) => list.map((n) => (n.id === selectedId ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
    if (activeView === "mine") setNotes(updater);
    else if (activeView === "shared") setSharedNotes(updater);
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await apiPatch(`/notes/${selectedId}`, patch);
      } catch (err) {
        console.warn("Không thể lưu (demo/offline):", err.message);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 1500);
    }, 700);
  }

  function handleTogglePrivate(next) {
    if (!selectedId) return;
    setNotes((prev) => prev.map((n) => (n.id === selectedId ? { ...n, isPrivate: next } : n)));
    apiPatch(`/notes/${selectedId}/private`, { isPrivate: next }).catch((err) => console.warn(err.message));
  }

  async function handleAddShare() {
    if (!selectedId || !shareEmail.trim()) return;
    const email = shareEmail.trim();
    const newShare = { id: `local-share-${Date.now()}`, email, permissionLevel: sharePermission };
    setSharesByNoteId((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] || []), newShare] }));
    setShareEmail("");
    showToast(`Đã mời ${email}.`);
    try {
      await apiPost(`/notes/${selectedId}/shares`, { sharedWithEmail: email, permissionLevel: sharePermission });
    } catch (err) {
      console.warn("Không thể gửi lời mời lên máy chủ (demo/offline):", err.message);
    }
  }

  function handleMarkRead(id) {
    const target = notifications.find((n) => n.id === id);
    if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    apiPatch(`/notifications/${id}/read`).catch((err) => console.warn(err.message));
  }
  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    apiPatch("/notifications/read-all").catch((err) => console.warn(err.message));
  }
  function handleDeleteNotification(id) {
    const target = notifications.find((n) => n.id === id);
    if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    apiDelete(`/notifications/${id}`).catch((err) => console.warn(err.message));
  }

  function handleLogout() {
    apiPost("/auth/logout").catch(() => {});
    if (typeof window !== "undefined") window.localStorage.removeItem("cn_token");
    navigate("/login");
  }

  const currentList = activeView === "mine" ? notes : activeView === "shared" ? sharedNotes : trashedNotes;

  const filteredList = useMemo(() => {
    let list = currentList;
    if (activeView === "mine" && activeFilter === "private") {
      list = list.filter((n) => n.isPrivate);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q));
    }
    return list;
  }, [currentList, activeView, activeFilter, query]);

  const selectedNote = selectedId ? currentList.find((n) => n.id === selectedId) || null : null;
  const roleStyle = ROLE_STYLE[me?.role?.name] || ROLE_STYLE.free_user;
  const permissions = me?.role?.permissions || [];
  const canViewAuditLog = permissions.includes("view_audit_logs");
  const hasUnlimitedStorage = permissions.includes("unlimited_storage");

  const viewTitle = activeView === "mine" ? "Ghi chú của tôi" : activeView === "shared" ? "Được chia sẻ với tôi" : "Thùng rác";
  const viewSubtitle =
    activeView === "trash" ? "Tự động xoá vĩnh viễn sau 30 ngày" : `${currentList.length} ghi chú`;

  let emptyProps = null;
  if (filteredList.length === 0) {
    if (query.trim()) {
      emptyProps = { icon: Search, title: "Không tìm thấy ghi chú phù hợp", hint: `Không có kết quả nào khớp với "${query}".` };
    } else if (activeView === "mine") {
      emptyProps = { icon: FileText, title: "Chưa có ghi chú nào", hint: 'Bấm "Ghi chú mới" ở trên để bắt đầu.' };
    } else if (activeView === "shared") {
      emptyProps = { icon: Users, title: "Chưa có ai chia sẻ ghi chú với bạn", hint: "Ghi chú được chia sẻ tới bạn sẽ xuất hiện ở đây." };
    } else {
      emptyProps = { icon: Trash2, title: "Thùng rác trống", hint: "Ghi chú đã xoá sẽ nằm ở đây trong 30 ngày trước khi bị xoá vĩnh viễn." };
    }
  }

  return (
    <div className="app-shell">
      <div className={`sidebar-backdrop ${mobileNavOpen ? "show" : ""}`} onClick={() => setMobileNavOpen(false)} />

      <aside className={`app-sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="flex items-center gap-2 px-1" style={{ paddingTop: 4, paddingBottom: 10 }}>
          <Lock size={18} style={{ color: "#00d4aa" }} />
          <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
            CIPHERVAULT
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-1 mb-4">
          <span className="live-dot" />
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: "0.07em", color: "#4fa8a0" }}>
            AES-256 · MÃ HOÁ KHI LƯU TRỮ
          </span>
        </div>

        <SidebarItem icon={FileText} label="Ghi chú của tôi" count={notes.length} active={activeView === "mine"} onClick={() => switchView("mine")} />
        <SidebarItem icon={Users} label="Được chia sẻ với tôi" count={sharedNotes.length} active={activeView === "shared"} onClick={() => switchView("shared")} />
        <SidebarItem icon={Trash2} label="Thùng rác" count={trashedNotes.length} active={activeView === "trash"} onClick={() => switchView("trash")} />

        <div style={{ height: 1, background: "#1e2a3a", margin: "12px 4px" }} />

        <SidebarItem icon={Monitor} label="Phiên đăng nhập" count={0} active={false} onClick={() => handleComingSoon("Phiên đăng nhập")} />
        {canViewAuditLog && (
          <SidebarItem icon={Activity} label="Nhật ký hoạt động" count={0} active={false} onClick={() => handleComingSoon("Nhật ký hoạt động")} />
        )}
        <SidebarItem icon={Settings} label="Cài đặt" count={0} active={false} onClick={() => handleComingSoon("Cài đặt")} />

        <div style={{ flex: 1 }} />

        {!hasUnlimitedStorage && (
          <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
            <div className="flex items-center gap-1.5 mb-2" style={{ fontSize: 11, color: "#94a3b8" }}>
              <Sparkles size={12} style={{ color: "#f59e0b" }} /> Dung lượng miễn phí
            </div>
            <div className="session-bar mb-1.5">
              <div className="session-bar-fill" style={{ width: "34%" }} />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "#475569" }}>
              170MB / 500MB đã dùng
            </div>
          </div>
        )}

        <div className="panel flex items-center gap-2" style={{ padding: 10 }}>
          <div
            className="mono flex items-center justify-center flex-shrink-0"
            style={{ width: 30, height: 30, borderRadius: 3, background: "#1a2035", color: "#94a3b8", fontSize: 12, fontWeight: 700 }}
          >
            {(me?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate" style={{ fontSize: 11.5, color: "#cbd5e1" }}>
              {me?.email}
            </div>
            <span className="badge" style={{ background: roleStyle.bg, color: roleStyle.fg, display: "inline-flex" }}>
              {roleStyle.label}
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button type="button" className="icon-btn mobile-only" onClick={() => setMobileNavOpen(true)}>
            <Menu size={16} />
          </button>

          <div className="flex-1 min-w-0" style={{ position: "relative", maxWidth: 380 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
            <input
              className="input-field w-full"
              style={{ paddingLeft: 30, paddingRight: query ? 28 : 12 }}
              placeholder={`Tìm trong "${viewTitle}"...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#475569", cursor: "pointer" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button type="button" className="btn-primary flex items-center gap-1.5" style={{ flexShrink: 0 }} onClick={openCompose}>
            <Plus size={14} /> <span className="hidden sm:inline">Ghi chú mới</span>
          </button>

          <div style={{ flex: 1 }} />

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className={`icon-btn ${notifOpen ? "on" : ""}`}
              onClick={() => {
                setNotifOpen((v) => !v);
                setUserOpen(false);
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className="badge-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            {notifOpen && (
              <NotificationsPanel
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={handleMarkRead}
                onDelete={handleDeleteNotification}
              />
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="flex items-center gap-1"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
              onClick={() => {
                setUserOpen((v) => !v);
                setNotifOpen(false);
              }}
            >
              <div
                className="mono flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: 3, background: "#1a2035", color: "#94a3b8", fontSize: 11.5, fontWeight: 700 }}
              >
                {(me?.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <ChevronDown size={14} style={{ color: "#475569" }} />
            </button>
            {userOpen && (
              <UserMenuPanel
                me={me}
                roleStyle={roleStyle}
                onSettings={() => {
                  setUserOpen(false);
                  handleComingSoon("Cài đặt");
                }}
                onLogout={handleLogout}
              />
            )}
          </div>
        </header>

        <main className="p-6" style={{ flex: 1 }}>
          {offline && (
            <div
              className="flex items-center gap-2 mb-4"
              style={{ background: "#f59e0b12", border: "1px solid #f59e0b33", borderRadius: 4, padding: "9px 12px", fontSize: 12, color: "#f59e0b" }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>Chưa kết nối được API ({API_BASE}) — đang hiển thị dữ liệu minh hoạ.</span>
              <button
                type="button"
                onClick={fetchAll}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "#f59e0b", textDecoration: "underline", cursor: "pointer", fontSize: 12, flexShrink: 0 }}
              >
                Thử lại
              </button>
            </div>
          )}

          <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, color: "#e2e8f0" }}>{viewTitle}</h1>
              <p className="mono" style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                {viewSubtitle}
              </p>
            </div>
            {activeView === "mine" && (
              <div className="flex items-center gap-2">
                <FilterChip active={activeFilter === "all"} onClick={() => setActiveFilter("all")}>
                  Tất cả
                </FilterChip>
                <FilterChip active={activeFilter === "private"} onClick={() => setActiveFilter("private")}>
                  Riêng tư
                </FilterChip>
              </div>
            )}
          </div>

          {activeView === "mine" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={FileText} label="Tổng ghi chú" value={notes.length} tint="#00d4aa" />
              <StatCard icon={Lock} label="Riêng tư" value={notes.filter((n) => n.isPrivate).length} tint="#f59e0b" />
              <StatCard icon={Users} label="Được chia sẻ" value={sharedNotes.length} tint="#00b4ff" />
              <StatCard icon={Trash2} label="Thùng rác" value={trashedNotes.length} tint="#64748b" />
            </div>
          )}

          {emptyProps && !composing ? (
            <EmptyState {...emptyProps} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {composing && <ComposeCard onCancel={() => setComposing(false)} onCreate={handleCreateNote} />}
              {filteredList.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  view={activeView}
                  selected={note.id === selectedId}
                  onSelect={selectNote}
                  onTrash={handleTrash}
                  onRestore={handleRestore}
                  onDeleteForever={handleDeleteForever}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedNote && !composing && (
        <DetailPanel
          note={selectedNote}
          view={activeView}
          onClose={() => setSelectedId(null)}
          onTitleChange={(v) => updateSelectedNote({ title: v })}
          onContentChange={(v) => updateSelectedNote({ content: v })}
          onColorChange={(v) => updateSelectedNote({ color: v })}
          onTogglePrivate={handleTogglePrivate}
          onTrash={() => handleTrash(selectedNote.id)}
          onRestore={() => handleRestore(selectedNote.id)}
          onDeleteForever={() => handleDeleteForever(selectedNote.id)}
          saveStatus={saveStatus}
          shares={sharesByNoteId[selectedNote.id] || []}
          shareEmail={shareEmail}
          onShareEmailChange={setShareEmail}
          sharePermission={sharePermission}
          onSharePermissionChange={setSharePermission}
          onAddShare={handleAddShare}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
