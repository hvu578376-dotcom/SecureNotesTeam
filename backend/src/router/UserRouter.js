import express from "express";
import userController from "../controller/Cusers.js";
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
//Phục vụ trang Hồ sơ của tôi. Khi bất kỳ người dùng nào đăng nhập thành công và bấm vào 
// Avatar hoặc menu Profile, giao diện (Frontend) sẽ tự động gọi API này để kéo thông tin cá 
// nhân của riêng họ (Tên, Email) và hiển thị lên màn hình.
router.get("/users", requirePermission("manage_users"), userController.listUsers);
//Phục vụ Bảng danh sách toàn bộ hệ thống. Mở trang quản trị ra, giao diện gọi API này để đổ 
// dữ liệu hàng trăm, hàng ngàn người dùng vào một bảng (Table) lớn.
router.get("/users/:userId", requirePermission("manage_users"), userController.getUserById);
//Phục vụ Màn hình Chi tiết. Khi Admin click đúp vào tên một người dùng cụ thể trong bảng, 
// giao diện gọi API lấy hồ sơ chi tiết của người đó ra.
router.patch("/users/:userId/status", requirePermission("manage_users"), userController.updateUserStatus);
//Tương ứng với Nút Khóa/Mở khóa (Ban/Unban) hoặc công tắc gạt trạng thái. Khi Admin muốn cấm 
// cửa một tài khoản vi phạm, họ bấm nút này. Giao diện gọi API cập nhật trạng thái, người dùng
//  đó sẽ không thể đăng nhập được nữa.
router.patch("/users/:userId/role", requirePermission("manage_users"), userController.updateUserRole);
//Phục vụ Menu thả xuống (Dropdown) phân quyền. Admin bấm vào menu này để đổi quyền cho một 
// người, ví dụ thăng cấp một tài khoản User thường lên làm Admin hoặc Quản lý.
export default router;