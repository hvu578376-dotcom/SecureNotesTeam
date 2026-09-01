import express from "express";
import authController from "../controller/CAuth.js";

/**
 * authRouter — Module 1 (Tài khoản & Phân quyền), phần xác thực.
 *
 * Ánh xạ đúng theo khối "Route dự kiến" trong docblock của Cauth.js.
 * Đây chính là router mà frontend/login.html đang chờ — fetch('/api/auth/login')
 * sẽ hoạt động được ngay khi router này được gắn vào app (xem server.js).
 *
 * Các route ghi "cần header Authorization" yêu cầu client gửi kèm
 * "Authorization: Bearer <token>". Việc đọc/xác thực token hiện đang nằm
 * trong Httphelper.getCurrentUserId()/getCurrentAuth(), được gọi trực
 * tiếp bên trong từng hàm controller (xem ghi chú trong Httphelper.js),
 * nên router ở đây không cần thêm middleware xác thực riêng.
 */
const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/verify-email", authController.verifyEmail);
router.post("/auth/login", authController.login);
router.post("/auth/login/2fa", authController.verifyTwoFactor);
router.post("/auth/logout", authController.logout);
router.patch("/auth/password", authController.changePassword);
router.post("/auth/2fa/setup", authController.beginTwoFactorSetup);
router.post("/auth/2fa/confirm", authController.confirmTwoFactorSetup);
router.post("/auth/2fa/disable", authController.disableTwoFactor);

export default router;