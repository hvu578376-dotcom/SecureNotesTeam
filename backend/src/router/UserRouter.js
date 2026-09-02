import express from "express";
import userController from "../controller/CUsers.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

/**
 * userRouter — Module 1 (Tài khoản) & Module 8 (Admin Dashboard), phần User.
 * Ánh xạ theo docblock của Cusers.js. Đăng ký/đăng nhập/2FA nằm ở authRouter.js.
 *
 * QUAN TRỌNG VỀ THỨ TỰ: "/users/me" phải khai báo TRƯỚC "/users/:userId".
 * Cả hai đều là GET với đúng 1 segment sau "/users", nên nếu đảo thứ tự,
 * Express sẽ khớp "/users/:userId" trước và hiểu nhầm "me" chính là giá
 * trị :userId — gọi nhầm sang getUserById (và requirePermission
 * "manage_users") thay vì getMe.
 */
const router = express.Router();

router.get("/users/me", requireAuth, userController.getMe);
router.get("/users", requirePermission("manage_users"), userController.listUsers);
router.get("/users/:userId", requirePermission("manage_users"), userController.getUserById);
router.patch("/users/:userId/status", requirePermission("manage_users"), userController.updateUserStatus);
router.patch("/users/:userId/role", requirePermission("manage_users"), userController.updateUserRole);

export default router;