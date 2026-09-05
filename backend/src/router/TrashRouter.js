import express from "express";
import trashController from "../controller/CTrash.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

/**
 * trashRouter — Module 4 (phần 1): Thùng rác.
 * Ánh xạ theo docblock của CTrash.js. Router này có 2 tiền tố khác nhau
 * ("/trash" và "/notes/:noteId/...") vì thùng rác không có bảng riêng —
 * vẫn thao tác trên bảng notes (cột is_trashed/deleted_at, xem
 * trashModel.js / sql.sql).
 */
const router = express.Router();

router.get("/trash", requireAuth, trashController.listMyTrash);
//Phục vụ menu/tab Thùng rác trên thanh điều hướng bên trái. Khi click vào menu này, giao diện 
// gọi API để tải về và hiển thị danh sách tất cả các ghi chú đã bị xóa (soft-delete).
router.post("/notes/:noteId/trash", requireAuth, trashController.moveToTrash);
// Tương ứng với nút Xóa (Biểu tượng thùng rác) khi người dùng đang ở giao diện danh sách ghi 
// chú hoặc trong trình soạn thảo. Bấm nút này, giao diện gọi API để "cất" ghi chú đi, và thẻ 
// ghi chú đó sẽ biến mất khỏi màn hình Dashboard ngay lập tức.
router.post("/notes/:noteId/restore", requireAuth, trashController.restoreFromTrash);
//Phục vụ nút Khôi phục (Restore) (thường có hình mũi tên quay ngược) nằm trên mỗi ghi chú bên 
// trong Thùng rác. Khi bấm vào, API này được gọi, giao diện sẽ xóa ghi chú khỏi màn hình 
// Thùng rác hiện tại và trả nó về Màn hình chính.
router.delete("/trash/:noteId", requireAuth, trashController.permanentlyDelete);
// Quyền manage_users — kiểm tra ở middleware (requirePermission), không phải trong controller.
//: Phục vụ nút Xóa vĩnh viễn (Delete Permanently). Khi thao tác (thường kèm một popup cảnh báo 
// xác nhận), giao diện gọi API này để tiêu hủy hoàn toàn dữ liệu. Sau khi báo thành công, dòng 
// ghi chú đó sẽ biến mất vĩnh viễn.
router.post("/trash/purge-expired", requirePermission("manage_users"), trashController.purgeExpiredTrash);
//Tính năng này dọn dẹp các ghi chú đã nằm trong thùng rác quá hạn (ví dụ: qua 30 ngày). 
// Nhờ có middleware requirePermission("manage_users"), nút bấm kích hoạt tính năng này 
// (hoặc toàn bộ màn hình cấu hình dọn rác) sẽ bị ẩn hoàn toàn đối với người dùng thông thường, 
// và chỉ hiện ra trên bảng điều khiển riêng của Quản trị viên hệ thống.
export default router;