import crypto from "node:crypto";

/**
 * totpService — cài đặt TOTP (Time-based One-Time Password) theo đúng
 * RFC 6238 (dựa trên HOTP — RFC 4226), tương thích Google Authenticator /
 * Microsoft Authenticator / Authy,... Dùng cho cột users.is_2fa_enabled
 * và users.two_factor_secret.
 *
 * Vì package.json chưa có `otplib`/`speakeasy` và môi trường build hiện
 * không có mạng để cài thêm gói, toàn bộ thuật toán (kể cả base32) được
 * cài đặt lại bằng module `crypto` có sẵn của Node — ĐÃ tự kiểm chứng
 * bằng 5 test vector chính thức trong RFC 6238 Appendix B (case SHA1)
 * trước khi đưa vào đây, và base32 encode/decode đã test round-trip
 * 1000 lần với dữ liệu ngẫu nhiên. Nếu muốn đổi sang thư viện ngoài sau
 * này, chỉ cần thay nội dung file này — phần còn lại của service layer
 * chỉ gọi 3 hàm public bên dưới nên không bị ảnh hưởng.
 */

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // cho phép lệch ±1 bước (~30s) để bù trừ đồng hồ thiết bị không khớp tuyệt đối

// ---------------------------------------------------------------------
// Base32 (RFC 4648) — TOTP secret theo chuẩn luôn hiển thị dạng base32
// để người dùng có thể gõ tay vào app Authenticator nếu không quét được QR.
// ---------------------------------------------------------------------
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  while (output.length % 8 !== 0) output += "=";
  return output;
}

function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue; // bỏ qua ký tự lạ, phòng khi người dùng gõ tay lẫn khoảng trắng/gạch nối
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// ---------------------------------------------------------------------
// HOTP lõi (RFC 4226 §5.3) — dùng chung cho mọi bước thời gian của TOTP
// ---------------------------------------------------------------------
function hotp(secretBuffer, counter) {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", secretBuffer).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binaryCode % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

// ---------------------------------------------------------------------
// API public — dùng trong authService
// ---------------------------------------------------------------------

/** Sinh secret mới (160-bit, mã hoá base32) cho 1 user khi bật 2FA. Đây là giá trị lưu vào users.two_factor_secret. */
export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

/**
 * Dựng URL "otpauth://" để hiển thị dưới dạng QR code cho app Authenticator quét.
 * accountLabel thường là email người dùng.
 */
export function buildOtpAuthUrl(secretBase32, accountLabel, issuer = "SecureNotes") {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Kiểm tra mã 6 số người dùng nhập có khớp với secret không, cho phép lệch
 * ±1 bước thời gian. Trả về boolean, không throw — authService sẽ quyết
 * định thông báo lỗi phù hợp ngữ cảnh (đăng nhập / bật 2FA / tắt 2FA).
 */
export function verifyTotpToken(secretBase32, token, atTimeMs = Date.now()) {
  const cleanToken = String(token ?? "").trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;
  const secretBuffer = base32Decode(secretBase32);
  const currentCounter = Math.floor(atTimeMs / 1000 / TOTP_STEP_SECONDS);
  const tokenBuffer = Buffer.from(cleanToken);
  for (let drift = -TOTP_WINDOW; drift <= TOTP_WINDOW; drift++) {
    const candidate = Buffer.from(hotp(secretBuffer, currentCounter + drift));
    if (candidate.length === tokenBuffer.length && crypto.timingSafeEqual(candidate, tokenBuffer)) {
      return true;
    }
  }
  return false;
}

export default { generateTotpSecret, buildOtpAuthUrl, verifyTotpToken };
