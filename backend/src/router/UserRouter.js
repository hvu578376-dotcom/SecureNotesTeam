import express from "express";
import userController from "../controller/Cusers.js";

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

router.get("/users/me", userController.getMe);
router.get("/users", userController.listUsers);
router.get("/users/:userId", userController.getUserById);
router.patch("/users/:userId/status", userController.updateUserStatus);
router.patch("/users/:userId/role", userController.updateUserRole);

export default router;