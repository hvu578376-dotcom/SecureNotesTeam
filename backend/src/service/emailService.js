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
