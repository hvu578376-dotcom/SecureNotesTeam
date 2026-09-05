import express from "express";
import auditLogController from "../controller/CAuditLogs.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

/**
 * auditLogRouter — Module 7, phần audit_logs (chỉ đọc — việc ghi log là
 * hệ quả nội bộ của các service khác, xem CAuditLogs.js).
 * Ánh xạ theo docblock của CAuditLogs.js.
 */
const router = express.Router();

router.get("/audit-logs/me", requireAuth, auditLogController.listMyAuditLogs);
//Màn hình tương ứng: Tab "Lịch sử hoạt động" (My Recent Activity) nằm trong trang 
// hồ sơ cá nhân hoặc Bảo mật tài khoản của người dùng
//Khi người dùng bình thường bấm vào tab này, giao diện sẽ gọi API /me. Nhờ có requireAuth, 
// Backend biết ai đang đăng nhập và chỉ trả về lịch sử của riêng người đó. Màn hình sẽ hiển 
// thị danh sách các hành động cá nhân để họ tự kiểm tra xem tài khoản có bị ai khác đăng nhập 
// trộm hay không.
router.get("/audit-logs", requirePermission("view_audit_logs"), auditLogController.listAllAuditLogs);
//Màn hình tương ứng: Bảng Quản trị hệ thống (Admin Dashboard / System Logs).
//Cách giải thích: API này lấy lịch sử hoạt động của toàn bộ người dùng trên toàn hệ thống. 
// Điểm mấu chốt nằm ở middleware requirePermission("view_audit_logs"). Trên giao diện, 
// menu dẫn đến trang này sẽ bị ẩn đi đối với người dùng thường. Nếu ai đó cố tình gõ URL trên 
// trình duyệt để vào trang Admin, API này sẽ chặn lại, trả về lỗi 403, và giao diện sẽ hiển 
// thị thông báo "Bạn không có quyền truy cập trang này
//router này phục vụ tính năng Lịch sử hoạt động. Giao diện phần này chỉ đọc (Read-only). 
// Nó rẽ ra 2 màn hình phân cấp rõ rệt: màn hình cá nhân để người dùng tự xem log của mình (/me),
//  và màn hình Admin hiển thị log của toàn hệ thống (bị chặn quyền bởi requirePermission).
export default router;