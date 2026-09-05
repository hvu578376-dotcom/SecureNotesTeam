import express from "express";
import attachmentController from "../controller/CAttachments.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * attachmentRouter — Module 4 (phần 2): Tệp đính kèm.
 * Ánh xạ theo docblock của CAttachments.js. Chỉ lưu/đọc METADATA — client
 * tự upload file thật lên storage ngoài trước để lấy fileUrl (xem ghi chú
 * trong CAttachments.js / attachmentService.js).
 */
const router = express.Router();

router.post("/notes/:noteId/attachments", requireAuth, attachmentController.addAttachment);
//Nó làm gì trên giao diện: Phục vụ Nút "Đính kèm" (Upload / Biểu tượng chiếc kẹp ghim).
//Khi người dùng click vào nút đính kèm và chọn file từ máy tính, sau khi frontend upload 
// file lấy được URL, nó sẽ gọi API POST này để 'gắn' file đó vào ghi chú đang mở (:noteId). 
// Nếu API báo thành công, giao diện sẽ lập tức cập nhật, chèn thêm tên file vừa tải lên vào 
// danh sách trên màn hình để người dùng nhìn thấy ngay lập tức.
router.get("/notes/:noteId/attachments", requireAuth, attachmentController.listAttachments);
//Nó làm gì trên giao diện: Đây là API phục vụ Khu vực hiển thị danh sách tệp đính kèm.
//Khi người dùng click mở một bản ghi chú (Note) trên màn hình, giao diện sẽ tự động 
//gọi API GET này, truyền ID của ghi chú đó vào (:noteId). Dữ liệu trả về sẽ được 
// giao diện render (vẽ) ra thành một danh sách các file (thường có icon kẹp ghim, icon PDF
// , Word hoặc hình ảnh thu nhỏ) nằm ở dưới cùng hoặc bên hông của ghi chú đó. 
// Nhấn vào các link này trên giao diện sẽ tải file về hoặc xem trước.
router.delete("/attachments/:attachmentId", requireAuth, attachmentController.deleteAttachment);
//Nó làm gì trên giao diện: Phục vụ Nút "Xóa" (Biểu tượng thùng rác / Dấu X) nằm cạnh mỗi tệp đính kèm.
//Khi người dùng muốn gỡ một tệp khỏi ghi chú, họ bấm vào dấu X cạnh tên file. Giao diện có 
// thể hiện một thông báo xác nhận 'Bạn có chắc muốn xóa?', nếu chọn OK, giao diện sẽ 
// gọi API DELETE này kèm theo ID của cái tệp đó (:attachmentId). Thành công thì giao diện 
// sẽ làm biến mất tên file đó khỏi danh sách hiển thị

export default router;
//có thể thấy cả 3 API đều có middleware requireAuth. Điều này tác động trực tiếp đến giao diện 
// ở chỗ: Nếu người dùng để màn hình quá lâu (hết phiên đăng nhập - token hết hạn), hoặc họ 
// cố tình copy link ấn vào khi chưa đăng nhập, requireAuth sẽ chặn lại và trả về lỗi 401. 
// Lúc này, giao diện lập tức bắt được lỗi này và tự động ép người dùng chuyển hướng (redirect) 
// về Màn hình Đăng nhập (Login) để bảo vệ dữ liệu.