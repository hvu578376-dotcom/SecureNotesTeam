import { userSettingService } from "../service/index.js";
import { asyncHandler, getCurrentUserId } from "./Httphelper.js";

/**
 * CUserSettings — Controller cho Module 8, phần user_settings (quan hệ 1-1 với users).
 *
 * Route dự kiến:
 *   GET   /api/users/me/settings  -> getMySettings
 *   PATCH /api/users/me/settings  -> updateMySettings
 */

/** userSettingService.getOrCreateSettings tự tạo dòng mặc định nếu user chưa có settings — không bao giờ trả về null. */
export const getMySettings = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  const settings = await userSettingService.getOrCreateSettings(userId);
  res.json({ success: true, data: settings });
});

export const updateMySettings = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  const settings = await userSettingService.updateSettings(userId, req.body ?? {});
  res.json({ success: true, data: settings });
});

export default { getMySettings, updateMySettings };