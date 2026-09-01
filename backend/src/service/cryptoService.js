import crypto from "node:crypto";
import { AppError } from "./appError.js";

/**
 * cryptoService — toàn bộ phần "mật mã học" của SecureNotes, gom vào 1 chỗ
 * để không rải rác logic bảo mật ra nhiều service khác nhau.
 *
 * QUYẾT ĐỊNH THIẾT KẾ QUAN TRỌNG (đọc trước khi động vào file này):
 *
 * 1) Băm mật khẩu bằng scrypt (module `crypto` có sẵn của Node) thay vì
 *    bcrypt/argon2. Lý do: package.json hiện chưa cài bcrypt/argon2, và
 *    scrypt là hàm băm mật khẩu "memory-hard" được chính Node.js và OWASP
 *    khuyến nghị khi không muốn thêm dependency ngoài. Không cần cài thêm
 *    gói nào cho phần này.
 *
 * 2) Mã hoá nội dung note bằng AES-256-GCM (đúng như comment trong
 *    noteModel.js/sql.sql đã ghi) — cũng dùng module `crypto` có sẵn.
 *    GCM tự kèm "auth tag" nên vừa mã hoá vừa chống bị sửa dữ liệu
 *    (tamper-evident): nếu ai đó chỉnh trực tiếp trong DB, decrypt sẽ
 *    ném lỗi thay vì âm thầm trả về rác.
 *
 * 3) Token phiên đăng nhập (active_sessions.session_id) dùng chuỗi ngẫu
 *    nhiên (opaque token) thay vì JWT thật. Đây KHÔNG phải thiếu sót —
 *    comment gốc trong sql.sql ghi rõ cột này chứa "Token JWT ID **hoặc**
 *    Session ID", tức là dùng session ID thuần cũng đúng đặc tả. Ưu điểm
 *    so với JWT: thu hồi (revoke) tức thì bằng cách xoá 1 dòng trong DB —
 *    JWT tự chứa (self-contained) thì không thể "vô hiệu hoá" giữa chừng
 *    nếu chưa hết hạn, trừ khi có thêm blacklist (tức lại phải tra DB,
 *    mất hết lợi thế của JWT). Vì vậy dự án này không cần cài thêm gói
 *    `jsonwebtoken`.
 *
 * 4) Cho các "vé" ngắn hạn, dùng 1 lần, KHÔNG lưu DB (VD: bước trung gian
 *    giữa "đã đúng mật khẩu" và "đã nhập đúng mã 2FA" khi đăng nhập; hoặc
 *    link xác minh email) — dùng token tự ký bằng HMAC-SHA256
 *    (signEphemeralToken/verifyEphemeralToken bên dưới). Cách này tự chứa
 *    thời hạn hết hạn (exp) và chữ ký chống giả mạo, không cần thêm bảng
 *    DB nào mà sql.sql chưa định nghĩa.
 *
 * Các hàm ở đây đã được tự kiểm tra (self-test) với test vector và các
 * trường hợp round-trip trước khi đưa vào — xem thêm phần tổng kết cuối
 * chat để biết cách tự chạy lại nếu cần.
 */

// ---------------------------------------------------------------------
// 1) Băm & so khớp mật khẩu (scrypt)
// ---------------------------------------------------------------------

const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_BYTES = 16;

/**
 * Băm mật khẩu plaintext -> chuỗi lưu vào users.password_hash.
 * Định dạng: "scrypt$<salt hex>$<hash hex>" — độ dài ~168 ký tự,
 * vẫn nằm trong giới hạn VARCHAR(255) của cột.
 */
export function hashPassword(plainPassword) {
  if (typeof plainPassword !== "string" || plainPassword.length === 0) {
    throw AppError.badRequest("Mật khẩu không được để trống.", "PASSWORD_REQUIRED");
  }
  const salt = crypto.randomBytes(SCRYPT_SALT_BYTES).toString("hex");
  const derivedKey = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

/** So khớp mật khẩu plaintext người dùng nhập với hash đã lưu. Trả về boolean, không throw. */
export function verifyPassword(plainPassword, storedHash) {
  if (typeof plainPassword !== "string" || typeof storedHash !== "string") return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  try {
    const storedBuffer = Buffer.from(hashHex, "hex");
    const derivedKey = crypto.scryptSync(plainPassword, salt, storedBuffer.length);
    return storedBuffer.length === derivedKey.length && crypto.timingSafeEqual(storedBuffer, derivedKey);
  } catch {
    return false; // hashHex/salt hỏng định dạng -> coi như không khớp, không crash
  }
}

// ---------------------------------------------------------------------
// 2) Mã hoá / giải mã nội dung note (AES-256-GCM)
// ---------------------------------------------------------------------

const AES_ALGORITHM = "aes-256-gcm";
const AES_IV_BYTES = 12; // 96-bit IV — khuyến nghị chuẩn cho GCM

function getEncryptionKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw AppError.internal(
      "ENCRYPTION_KEY chưa được cấu hình đúng trong .env (cần chuỗi hex 64 ký tự = 32 byte). " +
        "Sinh 1 key mới bằng lệnh: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      "ENCRYPTION_KEY_MISSING"
    );
  }
  return Buffer.from(raw, "hex");
}

/**
 * Mã hoá nội dung note trước khi lưu DB.
 * Trả về { content, iv } — ghi thẳng vào notes.content và notes.encryption_iv.
 * content lưu dạng "<ciphertext hex>:<authTag hex>" để không cần thêm cột DB
 * cho auth tag (notes.content là TEXT nên đủ chỗ chứa).
 */
export function encryptNoteContent(plainText) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(AES_IV_BYTES);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText ?? ""), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    content: `${encrypted.toString("hex")}:${authTag.toString("hex")}`,
    iv: iv.toString("hex"),
  };
}

/** Giải mã nội dung note đọc từ DB. Ném AppError 500 nếu dữ liệu bị hỏng/sửa. */
export function decryptNoteContent(storedContent, ivHex) {
  const key = getEncryptionKey();
  const [encryptedHex, authTagHex] = String(storedContent ?? "").split(":");
  if (!encryptedHex || !authTagHex || !ivHex) {
    throw AppError.internal("Dữ liệu ghi chú bị thiếu IV hoặc auth tag, không thể giải mã.", "DECRYPT_MALFORMED");
  }
  try {
    const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    // GCM auth tag không khớp -> dữ liệu đã bị sửa hoặc sai key
    throw AppError.internal("Không thể giải mã ghi chú — dữ liệu có thể đã bị thay đổi.", "DECRYPT_FAILED");
  }
}

// ---------------------------------------------------------------------
// 3) Token phiên đăng nhập (opaque session token)
// ---------------------------------------------------------------------

/** Sinh token phiên ngẫu nhiên (raw) — chuỗi này trả về cho client, KHÔNG lưu thẳng vào DB. */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex"); // 256-bit
}

/** Băm token bằng SHA-256 trước khi lưu DB (giống nguyên tắc lưu password_hash — lộ DB cũng không lộ token thật). */
export function hashSessionToken(rawToken) {
  return crypto.createHash("sha256").update(String(rawToken)).digest("hex");
}

// ---------------------------------------------------------------------
// 4) Token ký HMAC ngắn hạn, không lưu DB (2FA challenge, verify email,...)
// ---------------------------------------------------------------------

function getAppSecret() {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 16) {
    throw AppError.internal(
      "APP_SECRET chưa được cấu hình trong .env (cần chuỗi ngẫu nhiên dài >=16 ký tự, dùng để ký token ngắn hạn cho luồng 2FA/verify email).",
      "APP_SECRET_MISSING"
    );
  }
  return secret;
}

/** Ký 1 payload thành token tự chứa hạn dùng (mặc định 5 phút), dạng "<base64url payload>.<chữ ký>". */
export function signEphemeralToken(payload, ttlSeconds = 300) {
  const secret = getAppSecret();
  const body = { ...payload, exp: Date.now() + ttlSeconds * 1000 };
  const encoded = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

/** Xác minh + giải mã token từ signEphemeralToken. Throw AppError 401 nếu sai chữ ký hoặc hết hạn. */
export function verifyEphemeralToken(token) {
  const secret = getAppSecret();
  if (typeof token !== "string" || !token.includes(".")) {
    throw AppError.unauthorized("Token không hợp lệ.", "INVALID_TOKEN");
  }
  const [encoded, signature] = token.split(".");
  const expectedSignature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  const sigBuffer = Buffer.from(signature ?? "", "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw AppError.unauthorized("Chữ ký token không hợp lệ hoặc đã bị thay đổi.", "INVALID_TOKEN");
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw AppError.unauthorized("Token không hợp lệ.", "INVALID_TOKEN");
  }
  if (!payload.exp || Date.now() > payload.exp) {
    throw AppError.unauthorized("Token đã hết hạn, vui lòng thực hiện lại thao tác.", "TOKEN_EXPIRED");
  }
  return payload;
}

export default {
  hashPassword,
  verifyPassword,
  encryptNoteContent,
  decryptNoteContent,
  generateSessionToken,
  hashSessionToken,
  signEphemeralToken,
  verifyEphemeralToken,
};
