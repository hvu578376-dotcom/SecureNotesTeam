import express from "express";
import commentController from "../controller/Ccomments.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * commentRouter — Module 5 & 6, phần bình luận trên ghi chú.
 * Ánh xạ theo docblock của CComments.js.
 */
const router = express.Router();

router.post("/notes/:noteId/comments", requireAuth, commentController.addComment);
//Khu vực trên giao diện: Ô nhập văn bản (Text Input) và Nút "Gửi" (Send/Submit)
//Khi người dùng gõ ý kiến vào ô nhập và nhấn phím Enter hoặc nút Gửi, giao diện sẽ thu thập 
// đoạn text đó và gọi API POST. Khi Backend xử lý xong và báo thành công, giao diện lập tức 
// chèn thêm bình luận mới đó vào cuối danh sách trên màn hình để người dùng thấy ngay phản hồi 
// mà không cần F5 (refresh) lại trang.
router.get("/notes/:noteId/comments", requireAuth, commentController.listComments);
//Khu vực trên giao diện: Khung Danh sách bình luận
//Khi người dùng click vào xem một ghi chú (có id là :noteId), song song với việc tải nội dung 
// ghi chú, giao diện sẽ gọi API GET này để kéo về toàn bộ lịch sử trò chuyện. Dữ liệu trả về 
// sẽ được render thành các 'bong bóng chat' (chat bubbles), thường hiển thị kèm Avatar, Tên 
// người bình luận và Thời gian.
router.delete("/comments/:commentId", requireAuth, commentController.deleteComment);
//Khu vực trên giao diện: Nút "Xóa" (hoặc dấu 3 chấm -> Xóa) nằm cạnh mỗi dòng bình luận.
//Nếu người dùng muốn thu hồi lời bình luận, họ bấm nút Xóa. Giao diện sẽ gọi API DELETE kèm 
// theo :commentId. Nếu thành công, dòng bình luận đó sẽ biến mất khỏi màn hình
export default router;
//Vậy ai cũng xóa được bình luận của người khác à?
//Dù router chỉ ghi chung là requireAuth (phải đăng nhập), nhưng ở Frontend (giao diện), ta sẽ 
// xử lý logic ẩn/hiện nút Xóa. Giao diện sẽ so sánh ID của người đang đăng nhập với ID của 
// người tạo ra bình luận đó. Nút Xóa sẽ chỉ hiện ra ở những bình luận do chính người đó viết, 
// các bình luận của người khác sẽ bị ẩn nút Xóa đi. Đồng thời ở tầng Controller 
// (commentController.deleteComment), backend cũng sẽ kiểm tra lại lớp thứ 2 để chặn việc xóa trộm.