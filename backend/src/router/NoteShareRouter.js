import express from "express";
import noteShareController from "../controller/CNoteshares.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * noteShareRouter — Module 5 & 6, phần chia sẻ ghi chú (note_shares).
 * Ánh xạ theo docblock của CNoteshares.js.
 */
const router = express.Router();

router.post("/notes/:noteId/shares", requireAuth, noteShareController.shareNote);
//Phục vụ khu vực Danh sách người có quyền truy cập. Khi bạn bấm nút "Chia sẻ" trên màn hình 
// để mở Hộp thoại, giao diện lập tức gọi API này (GET) để tải về danh sách những ai đang được 
// xem ghi chú này (thường hiển thị Avatar, Email và Quyền hiện tại của họ).
router.get("/notes/:noteId/shares", requireAuth, noteShareController.listSharesForNote);
//Tương ứng với Ô nhập Email/Tên người dùng và nút "Mời" (Invite). Khi bạn điền email của 
// đồng nghiệp và bấm Mời, giao diện thu thập thông tin đó gọi xuống API POST. Nếu thành công, 
// tên đồng nghiệp sẽ xuất hiện ngay lập tức trong danh sách bên dưới.
router.patch("/shares/:shareId", requireAuth, noteShareController.updateSharePermission);
//Phục vụ Menu thả xuống (Dropdown phân quyền) nằm cạnh tên mỗi người. Khi bạn click đổi quyền 
// của ai đó từ "Chỉ xem" (Viewer) sang "Được phép sửa" (Editor), giao diện sẽ gọi ngầm 
// API PATCH này để cập nhật trạng thái mà không cần tải lại trang.
router.delete("/shares/:shareId", requireAuth, noteShareController.revokeShare);
//Tương ứng với Nút "Xóa" (Dấu X hoặc Hủy quyền). Khi bạn không muốn cho người đó xem ghi 
// chú nữa, bạn bấm dấu X, giao diện gọi API DELETE. Người đó sẽ bị tước quyền và biến mất 
// khỏi danh sách trên màn hình của bạn.
export default router;