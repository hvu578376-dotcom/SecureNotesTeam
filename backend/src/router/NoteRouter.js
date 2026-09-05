import express from "express";
import noteController from "../controller/CNotes.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * noteRouter — Module 2 & 3 (Notes & Private Notes).
 * Ánh xạ theo docblock của CNotes.js. Xoá/khôi phục (thùng rác) nằm ở
 * trashRouter.js; đính kèm/bình luận/chia sẻ nằm ở attachmentRouter.js /
 * commentRouter.js / noteShareRouter.js — cùng dùng tiền tố
 * "/notes/:noteId/..." nhưng khác controller/service phụ trách.
 *
 * QUAN TRỌNG VỀ THỨ TỰ: "/notes/shared-with-me" phải khai báo TRƯỚC
 * "/notes/:noteId" — cùng lý do như userRouter.js (tránh Express hiểu
 * nhầm "shared-with-me" là giá trị :noteId).
 */
const router = express.Router();

router.post("/notes", requireAuth, noteController.createNote);
//Phục vụ nút "Tạo ghi chú mới" (Nút Dấu + / Create Note). Khi bấm vào, giao diện hiện ra 
// vùng nhập liệu, khi ấn gửi thì API này sẽ ghi nhận để tạo ra một thẻ ghi chú mới tinh trên 
// màn hình.
router.get("/notes", requireAuth, noteController.listMyNotes);
//Phục vụ khu vực hiển thị "Ghi chú của tôi" (My Notes). Khi người dùng đăng nhập thành công, 
// giao diện tự động gọi API này để tải danh sách các thẻ (cards) ghi chú cá nhân của họ lên 
// màn hình chính.
router.get("/notes/shared-with-me", requireAuth, noteController.listSharedWithMe);
//Tương ứng với tab hoặc menu "Được chia sẻ với tôi" bên thanh điều hướng. Bấm vào tab này, 
// giao diện sẽ tải riêng một danh sách những ghi chú do tài khoản khác cấp quyền đọc/sửa cho bạn.
router.get("/notes/:noteId", requireAuth, noteController.getNote);
//Chạy khi người dùng Click vào một ghi chú cụ thể trong danh sách. Giao diện gọi API này 
// lấy toàn bộ văn bản chi tiết ra và đổ vào khung soạn thảo để người dùng đọc.
router.patch("/notes/:noteId", requireAuth, noteController.updateNote);
//Phục vụ Nút "Lưu" (Save) hoặc tính năng Tự động lưu (Auto-save). Mỗi khi bạn gõ thêm chữ vào 
// khung soạn thảo và dừng lại vài giây, giao diện sẽ ngầm gọi API này để cập nhật bản nháp 
// mà không cần tải lại trang.
router.patch("/notes/:noteId/private", requireAuth, noteController.setPrivate);
//Phục vụ Nút Ổ khóa / Biểu tượng bảo mật. Bấm vào nút này trên giao diện, tính năng Ghi chú 
// riêng tư (Module 3) sẽ kích hoạt, có thể giao diện sẽ đổi màu ghi chú hoặc yêu cầu nhập mã 
// PIN khi ai đó muốn mở nó vào lần sau.
export default router;