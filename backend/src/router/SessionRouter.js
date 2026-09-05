import express from "express";
import sessionController from "../controller/CActiveSessions.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * sessionRouter — Module 7, quản lý phiên đăng nhập (active_sessions).
 * Ánh xạ theo docblock của CActiveSessions.js. Việc TẠO session nằm
 * trong luồng đăng nhập ở authRouter.js (login / login/2fa).
 */
const router = express.Router();

router.get("/sessions", requireAuth, sessionController.listMySessions);
//Phục vụ Danh sách thiết bị đang hoạt động. Khi người dùng mở tab Quản lý thiết bị, giao diện 
// lập tức gọi API này. Dữ liệu kéo về sẽ được vẽ thành một danh sách (List/Cards) hiển thị cụ 
// thể: tên trình duyệt (Chrome, Safari), hệ điều hành (Windows, Android), địa chỉ IP, và thời 
// gian hoạt động gần nhất của từng thiết bị.
router.delete("/sessions/:sessionId", requireAuth, sessionController.revokeSession);
//Phục vụ nút "Đăng xuất" (Log out) nằm cạnh từng dòng thiết bị. Nếu người dùng nhận ra một 
// phiên đăng nhập lạ (ví dụ: máy tính ở quán net hoặc công ty cũ), họ bấm nút này. Giao diện 
// gọi API kèm theo ID phiên, Backend sẽ hủy token của máy đó, ép máy đó văng ra khỏi ứng dụng 
// ngay lập tức.
router.delete("/sessions", requireAuth, sessionController.revokeAllOtherSessions);
//Phục vụ nút "Đăng xuất khỏi tất cả các thiết bị khác" (thường là một nút lớn, nổi bật cảnh 
// báo màu đỏ). Đây là nút xử lý tình huống khẩn cấp. Khi người dùng nghi ngờ bị hack tài khoản, 
// họ bấm nút này. Giao diện gọi API để dọn dẹp toàn bộ các phiên đang tồn tại ở mọi nơi, 
// chỉ giữ lại duy nhất thiết bị mà người dùng đang thao tác.

export default router;
//Tại sao phải tách ra 2 hàm DELETE làm gì?
//để tối ưu trải nghiệm người dùng ạ. Hàm có :sessionId dùng cho việc gỡ lẻ tẻ từng thiết bị. 
// Hàm không có :sessionId đóng vai trò là 'nút khẩn cấp' (panic button), giúp người dùng chỉ 
// cần 1 click là ngắt kết nối toàn bộ hệ thống thay vì phải ngồi bấm xóa thủ công hàng chục 
// thiết bị khác nhau.