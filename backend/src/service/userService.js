import { User } from "../models/index.js";
import { AppError } from "./appError.js";
import * as roleService from "./roleService.js";
import * as userSettingService from "./userSettingService.js";
import { hashPassword, verifyPassword } from "./cryptoService.js";

/**
 * userService — Module 1: Tài khoản & Phân quyền (phần User).
 *
 * userModel.js đã khai báo `defaultScope` để tự loại passwordHash/
 * twoFactorSecret khi query User. Tuy nhiên service này KHÔNG chỉ dựa
 * vào defaultScope — mọi hàm trả dữ liệu ra ngoài (cho controller/FE)
 * đều đi qua toSafeUser() để tường minh loại bỏ 2 field nhạy cảm ở tầng
 * plain object, bất kể scope/include nào được dùng để lấy dữ liệu. Đây
 * là nguyên tắc "defense in depth" — 1 dòng code lỡ include sai cũng
 * không lộ hash ra ngoài.
 *
 * Các hàm có hậu tố "ForAuth" trả về User.unscoped() (CÓ passwordHash/
 * twoFactorSecret) — CHỈ authService được gọi các hàm này, không dùng
 * trực tiếp ở controller.
 */

const SECRET_FIELDS = ["passwordHash", "twoFactorSecret"];
const MIN_PASSWORD_LENGTH = 6; // khớp với validate phía frontend (login.html: pwInput.value.length >= 6)
const VALID_STATUSES = ["active", "banned", "unverified"];

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function toSafeUser(userInstance) {
  if (!userInstance) return null;
  const plain = typeof userInstance.toJSON === "function" ? userInstance.toJSON() : { ...userInstance };
  for (const field of SECRET_FIELDS) delete plain[field];
  return plain;
}

// ---------------------------------------------------------------------
// Đọc dữ liệu (an toàn — không có passwordHash/twoFactorSecret)
// ---------------------------------------------------------------------

export async function getUserById(userId, { includeRole = false } = {}) {
  const user = await User.findByPk(userId, includeRole ? { include: [{ association: "role" }] } : undefined);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  return toSafeUser(user);
}

export async function getUserByEmail(email) {
  const user = await User.findOne({ where: { email: normalizeEmail(email) } });
  return toSafeUser(user); // null nếu không có -> để caller (VD flow quên mật khẩu) tự quyết định
}

/** Module 8: Admin Dashboard — danh sách user có phân trang, lọc theo status. */
export async function listUsers({ limit = 20, offset = 0, status } = {}) {
  if (status && !VALID_STATUSES.includes(status)) {
    throw AppError.badRequest(`status phải là 1 trong: ${VALID_STATUSES.join(", ")}.`, "INVALID_STATUS");
  }
  const { rows, count } = await User.findAndCountAll({
    where: status ? { status } : {},
    include: [{ association: "role" }],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
  return { rows: rows.map(toSafeUser), count };
}

// ---------------------------------------------------------------------
// Đọc dữ liệu nội bộ cho authService (CÓ passwordHash/twoFactorSecret)
// ---------------------------------------------------------------------

/** CHỈ dùng trong authService. KHÔNG expose ra controller/response. */
export async function findByEmailForAuth(email) {
  return User.unscoped().findOne({ where: { email: normalizeEmail(email) } });
}

/** CHỈ dùng trong authService. KHÔNG expose ra controller/response. */
export async function findByIdForAuth(userId) {
  return User.unscoped().findByPk(userId);
}

// ---------------------------------------------------------------------
// Ghi dữ liệu
// ---------------------------------------------------------------------

/** Tạo user mới. KHÔNG xử lý phiên đăng nhập/audit log — đó là việc của authService.register(). */
export async function createUser({ email, password, roleId = null, status = "unverified" }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw AppError.badRequest("Email không được để trống.", "EMAIL_REQUIRED");
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw AppError.badRequest(`Mật khẩu cần tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`, "PASSWORD_TOO_SHORT");
  }

  const existed = await User.findOne({ where: { email: normalizedEmail } });
  if (existed) throw AppError.conflict("Email này đã được đăng ký.", "EMAIL_TAKEN");

  const finalRoleId = roleId ?? (await roleService.getDefaultRole()).id;
  const passwordHash = hashPassword(password);

  const user = await User.create({ email: normalizedEmail, passwordHash, roleId: finalRoleId, status });

  // Đảm bảo user nào cũng có 1 dòng user_settings (quan hệ 1-1, Module 8) ngay từ khi tạo,
  // để userSettingService không phải lo trường hợp null ở những nơi khác.
  await userSettingService.getOrCreateSettings(user.id);

  return toSafeUser(user);
}

export async function changePassword(userId, { oldPassword, newPassword }) {
  const user = await findByIdForAuth(userId);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  if (!verifyPassword(oldPassword, user.passwordHash)) {
    throw AppError.unauthorized("Mật khẩu hiện tại không đúng.", "INVALID_CURRENT_PASSWORD");
  }
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    throw AppError.badRequest(`Mật khẩu mới cần tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`, "PASSWORD_TOO_SHORT");
  }
  user.passwordHash = hashPassword(newPassword);
  await user.save();
  return toSafeUser(user);
}

/** Admin đổi trạng thái tài khoản (active/banned/unverified) — Module 8. */
export async function setStatus(userId, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw AppError.badRequest(`status phải là 1 trong: ${VALID_STATUSES.join(", ")}.`, "INVALID_STATUS");
  }
  const user = await User.findByPk(userId);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  user.status = status;
  await user.save();
  return toSafeUser(user);
}

/** Admin đổi role của 1 user — Module 8. */
export async function updateUserRole(userId, roleId) {
  const user = await User.findByPk(userId);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  await roleService.getRoleById(roleId); // throw AppError.notFound nếu roleId không tồn tại
  user.roleId = roleId;
  await user.save();
  return toSafeUser(user);
}

/** Ghi trực tiếp cờ 2FA + secret. CHỈ authService gọi hàm này trong luồng bật/xác nhận/tắt 2FA. */
export async function setTwoFactorSecret(userId, { isTwoFactorEnabled, twoFactorSecret }) {
  const user = await findByIdForAuth(userId);
  if (!user) throw AppError.notFound("Không tìm thấy người dùng.", "USER_NOT_FOUND");
  if (isTwoFactorEnabled !== undefined) user.isTwoFactorEnabled = isTwoFactorEnabled;
  if (twoFactorSecret !== undefined) user.twoFactorSecret = twoFactorSecret;
  await user.save();
  return toSafeUser(user);
}

export default {
  getUserById,
  getUserByEmail,
  listUsers,
  findByEmailForAuth,
  findByIdForAuth,
  createUser,
  changePassword,
  setStatus,
  updateUserRole,
  setTwoFactorSecret,
};
