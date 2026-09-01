import { UserSetting } from "../models/index.js";
import { AppError } from "./appError.js";

/**
 * userSettingService — Module 8: Settings & Admin Dashboard (phần user_settings).
 * Quan hệ 1-1 với users (user_id vừa là PK vừa là FK) — nghĩa là 1 user
 * có thể CHƯA có dòng user_settings nào (VD user vừa được tạo trước khi
 * userService kịp insert dòng mặc định). getOrCreateSettings() xử lý
 * việc này để các service khác không cần lo trường hợp null.
 */

const ALLOWED_FIELDS = ["theme", "language", "emailNotifications", "encryptionPreference"];
const ALLOWED_THEMES = ["light", "dark", "system"];

export async function getOrCreateSettings(userId) {
  const [settings] = await UserSetting.findOrCreate({
    where: { userId },
    defaults: { userId }, // các cột còn lại tự dùng defaultValue khai báo trong model
  });
  return settings;
}

export async function updateSettings(userId, data = {}) {
  if (data.theme !== undefined && !ALLOWED_THEMES.includes(data.theme)) {
    throw AppError.badRequest(`theme phải là 1 trong: ${ALLOWED_THEMES.join(", ")}.`, "INVALID_THEME");
  }
  const settings = await getOrCreateSettings(userId);
  for (const field of ALLOWED_FIELDS) {
    if (data[field] !== undefined) settings[field] = data[field];
  }
  await settings.save();
  return settings;
}

export default { getOrCreateSettings, updateSettings };
