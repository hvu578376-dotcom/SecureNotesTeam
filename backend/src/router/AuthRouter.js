import express from "express";
import authController from "../controller/CAuth.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * authRouter — Module 1 (Tài khoản & Phân quyền), phần xác thực.
 *
 * Ánh xạ đúng theo khối "Route đã gắn" trong docblock của CAuth.js.
 * Đây chính là router mà frontend/login.html gọi tới — fetch('/api/auth/login')
 * hoạt động được nhờ router này (xem server.js).
 *
 * register/verify-email/login/login/2fa/logout KHÔNG gắn middleware
 * (4 route đầu vì chưa đăng nhập thì đương nhiên chưa có token; logout
 * thì cố tình khoan dung — xem LƯU Ý trong CAuth.js). 4 route còn lại
 * (đổi mật khẩu, 2FA) bắt buộc requireAuth — token hợp lệ sẽ được gán
 * sẵn vào req.userId/req.token, controller không tự đọc header nữa.
 */
const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/verify-email", authController.verifyEmail);
router.post("/auth/login", authController.login);
router.post("/auth/login/2fa", authController.verifyTwoFactor);
router.post("/auth/logout", authController.logout);
router.patch("/auth/password", requireAuth, authController.changePassword);
router.post("/auth/2fa/setup", requireAuth, authController.beginTwoFactorSetup);
router.post("/auth/2fa/confirm", requireAuth, authController.confirmTwoFactorSetup);
router.post("/auth/2fa/disable", requireAuth, authController.disableTwoFactor);

export default router;