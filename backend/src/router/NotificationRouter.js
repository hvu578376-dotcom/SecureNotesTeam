import express from "express";
import notificationController from "../controller/CNotifications.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * notificationRouter — Module 5 & 6, phần thông báo.
 * Ánh xạ theo docblock của CNotifications.js. Không có route tạo thông
 * báo trực tiếp — thông báo được tạo nội bộ bởi các service khác (chia
 * sẻ note, bình luận,...).
 */
const router = express.Router();

router.get("/notifications", requireAuth, notificationController.listMyNotifications);
//Phục vụ Khung danh sách (Dropdown Menu) hiện ra khi bạn click vào quả chuông. Dữ liệu trả 
// về sẽ được giao diện vẽ thành từng dòng thông báo (như: "Nguyễn Văn A vừa chia sẻ ghi chú...").
router.get("/notifications/unread-count", requireAuth, notificationController.getUnreadCount);
//Phục vụ Chấm đỏ (Badge) hiển thị số lượng dính trên góc quả chuông. Giao diện (Frontend) sẽ 
// gọi API này ngay khi vừa đăng nhập hoặc gọi ngầm định kỳ để cập nhật xem có bao nhiêu thông 
// báo mới (ví dụ hiển thị số "3" màu đỏ).
router.patch("/notifications/:notificationId/read", requireAuth, notificationController.markAsRead);
//Kích hoạt tự động khi người dùng Click vào một dòng thông báo cụ thể. Lúc này, giao diện gọi 
// API để báo cho máy chủ biết thông báo này đã được xem. Trên màn hình, dòng thông báo đó 
// thường sẽ đổi màu nền (từ xanh nhạt sang trắng) hoặc mất chữ in đậm.
router.patch("/notifications/read-all", requireAuth, notificationController.markAllAsRead);
//Phục vụ nút bấm "Đánh dấu tất cả là đã đọc" (Mark all as read) thường nằm ở góc trên cùng 
// của khung thông báo. Bấm một lần, giao diện gọi API này và toàn bộ các chấm đỏ báo hiệu 
// thông báo mới sẽ biến mất.
router.delete("/notifications/:notificationId", requireAuth, notificationController.deleteNotification);
//Phục vụ Nút "X" hoặc "Xóa" nằm lề bên phải của từng dòng thông báo. Người dùng bấm vào nút 
// này để dọn dẹp hộp thư, giao diện sẽ xóa dòng thông báo đó khỏi màn hình ngay lập tức.
export default router;