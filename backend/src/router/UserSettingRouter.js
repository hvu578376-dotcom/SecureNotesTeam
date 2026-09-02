import express from "express";
import userSettingController from "../controller/CUserSettings.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * userSettingRouter — Module 8, phần user_settings (quan hệ 1-1 với users).
 * Ánh xạ theo docblock của CUserSettings.js.
 *
 * Không xung đột với "/users/:userId" của userRouter.js: "/users/me/settings"
 * có 2 segment sau "/users" (me, settings) trong khi "/users/:userId" chỉ
 * khớp đúng 1 segment — 2 router này độc lập, thứ tự gắn vào app không
 * ảnh hưởng lẫn nhau.
 */
const router = express.Router();

router.get("/users/me/settings", requireAuth, userSettingController.getMySettings);
router.patch("/users/me/settings", requireAuth, userSettingController.updateMySettings);

export default router;