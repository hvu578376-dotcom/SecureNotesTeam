import nodemailer from "nodemailer";
import { AppError } from "./appError.js";

function getMailer() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw AppError.internal("Thiếu EMAIL_USER hoặc EMAIL_PASS trong .env.", "EMAIL_CONFIG_MISSING");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendVerificationEmail({ recipient, token }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

  await getMailer().sendMail({
    from: `SecureNotes <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: "Xác minh email SecureNotes",
    text: `Mở liên kết sau để xác minh email của bạn: ${verificationUrl}\n\nLiên kết có hiệu lực trong 24 giờ.`,
    html: `<p>Chào bạn,</p><p>Hãy bấm liên kết dưới đây để xác minh email SecureNotes:</p><p><a href="${verificationUrl}">Xác minh email</a></p><p>Liên kết có hiệu lực trong 24 giờ.</p>`,
  });
}

/**
 * Gửi email đặt lại mật khẩu — dùng cho bước 1 của luồng "Quên mật khẩu"
 * (xem authService.requestPasswordReset). token là ephemeral token dạng
 * signEphemeralToken({ purpose: "reset_password", userId }, ...) nên KHÔNG
 * cần bảng DB riêng để lưu — cùng cơ chế với sendVerificationEmail() ở trên.
 * Link trỏ tới resetPasswordPage.jsx (frontend/src/page/resetPasswordPage.jsx),
 * trang này đọc token qua useSearchParams() rồi gọi POST /api/auth/reset-password.
 */
export async function sendPasswordResetEmail({ recipient, token }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await getMailer().sendMail({
    from: `SecureNotes <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: "Đặt lại mật khẩu SecureNotes",
    text: `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Mở liên kết sau để đặt mật khẩu mới: ${resetUrl}\n\nLiên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu điều này, hãy bỏ qua email này — mật khẩu hiện tại của bạn vẫn an toàn.`,
    html: `<p>Chào bạn,</p><p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản SecureNotes của bạn. Bấm liên kết dưới đây để đặt mật khẩu mới:</p><p><a href="${resetUrl}">Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu điều này, hãy bỏ qua email này — mật khẩu hiện tại của bạn vẫn an toàn.</p>`,
  });
}
