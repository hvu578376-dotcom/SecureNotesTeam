import express from "express";
import roleController from "../controller/Croles.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

/**
 * roleRouter — Module 1 (Tài khoản & Phân quyền), phần Role.
 * Ánh xạ theo docblock của CRoles.js.
 */
const router = express.Router();

router.get("/roles", requireAuth, roleController.listRoles);
//Phục vụ Bảng danh sách các Vai trò. Khi Admin truy cập trang Quản lý, giao diện gọi API này 
// để tải danh sách các nhóm hiện có (như Admin, Manager, User) hiển thị lên màn hình.
router.get("/roles/:roleId", requireAuth, roleController.getRole);
//Phục vụ Màn hình chi tiết / Form chỉnh sửa. Khi Admin click vào xem một nhóm cụ thể, 
// giao diện gọi API này để kéo về thông tin chi tiết và hiển thị danh sách các quyền hạn mà 
// nhóm đó đang sở hữu.
router.post("/roles", requirePermission("manage_users"), roleController.createRole);
//Tương ứng với nút "Thêm vai trò mới". Khi Admin nhập tên một nhóm mới (ví dụ: "Nhân viên 
// thực tập") vào ô văn bản và bấm Lưu, giao diện sẽ gọi API POST để tạo nhóm đó và cập nhật 
// lại bảng danh sách.
router.patch("/roles/:roleId/permissions", requirePermission("manage_users"), roleController.updateRolePermissions);
//Phục vụ khu vực Các hộp kiểm (Checkboxes) hoặc Công tắc (Toggle). Trên giao diện, Admin sẽ 
// đánh dấu tick vào các quyền (ví dụ: [x] Được xóa ghi chú, [ ] Được quản lý user). Khi bấm 
// nút "Cập nhật quyền", giao diện thu thập các ô đã tick và gọi API PATCH để áp dụng giới hạn mới.
router.delete("/roles/:roleId", requirePermission("manage_users"), roleController.deleteRole);
//Phục vụ nút "Xóa" (Biểu tượng thùng rác) nằm cạnh tên mỗi nhóm. Bấm vào đây, giao diện sẽ 
// gọi API DELETE để gỡ bỏ vai trò đó khỏi hệ thống, làm dòng đó biến mất khỏi bảng.
export default router;