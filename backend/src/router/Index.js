import express from "express";
import { AppError } from "../service/index.js";
import { sendError } from "../controller/Httphelper.js";

import authRouter from "./AuthRouter.js";
import userRouter from "./usersRouter.js";
import userSettingRouter from "./UserSettingRouter.js";
import roleRouter from "./Rolerouter.js";
import noteRouter from "./NoteRouter.js";
import trashRouter from "./TrashRouter.js";
import attachmentRouter from "./AttachmentRouter.js";
import commentRouter from "./CommentRouter.js";
import noteShareRouter from "./NoteShareRouter.js";
import notificationRouter from "./NotificationRouter.js";
import sessionRouter from "./SessionRouter.js";
import auditLogRouter from "./AuditLogRouter.js";

/**
 * router/index.js — gộp toàn bộ router con (1 file / 1 controller) thành
 * 1 router duy nhất, cùng tinh thần barrel export với models/index.js và
 * service/index.js đã có sẵn trong dự án. server.js chỉ cần:
 *
 *   import apiRouter from "./src/router/index.js";
 *   app.use("/api", apiRouter);
 *
 * để toàn bộ route (VD /api/auth/login, /api/notes/:noteId,...) hoạt động,
 * khớp đúng tiền tố "/api" mà mọi docblock "Route dự kiến" và
 * frontend/login.html (fetch('/api/auth/login')) đang chờ.
 *
 * Thứ tự router.use() bên dưới KHÔNG ảnh hưởng route nào khớp route nào,
 * vì mỗi resource dùng 1 tiền tố segment-đầu riêng biệt (auth, users,
 * roles, notes, trash, attachments, comments, shares, notifications,
 * sessions, audit-logs) — không router con nào tranh nhau cùng 1 request.
 * Thứ tự BÊN TRONG từng router con (route tĩnh trước route có :param)
 * mới là chỗ bắt buộc đúng thứ tự — xem ghi chú trong userRouter.js và
 * noteRouter.js.
 */
//Quy định cấu trúc URL cho toàn bộ giao diện: Đoạn comment có nhắc đến việc frontend gọi 
// fetch('/api/auth/login'). File này kết hợp với server.js để thiết lập quy tắc đó. Khi 
// frontend muốn gọi bất kỳ tính năng nào để cập nhật giao diện (đăng nhập, lấy ghi chú, 
// xóa file), họ đều phải gọi qua "cổng" chung là /api/.... File Index.js chính là nơi nối 
// tất cả các router con vào cái cổng chung này.

//Điều phối mượt mà không chồng chéo: File này gom tất cả 12 module 
// (Auth, Note, Trash, Share,...) lại. Đối với Frontend, họ không cần biết Backend chia bao 
// nhiêu file, họ chỉ cần gọi đúng URL. Index.js sẽ đóng vai trò như cảnh sát giao thông, 
// tự động nhận diện URL từ giao diện gửi xuống và điều phối nó vào đúng Router con để xử lý 
// (ví dụ: thấy /auth thì đẩy vào authRouter, thấy /notes thì đẩy vào noteRouter).

//Trong quá trình code giao diện, nếu lập trình viên gọi sai đường dẫn API (ví dụ gõ 
// nhầm /api/noteee thay vì /api/notes), mặc định máy chủ Express sẽ trả về một trang HTML 
// báo lỗi. Điều này rất nguy hiểm vì khi giao diện cố đọc (parse) HTML đó dưới dạng JSON, 
// ứng dụng sẽ bị crash (sập trắng màn hình). Đoạn code fallback này chặn lỗi đó lại và trả về 
// một chuỗi JSON báo lỗi chuẩn form (AppError.notFound). Nhờ vậy, Frontend có thể dễ dàng bắt 
// lỗi và hiển thị một thông báo màu đỏ thân thiện (Toast message) trên màn hình như: "Đường dẫn 
// không tồn tại".
const router = express.Router();

router.use(authRouter);
router.use(userRouter);
router.use(userSettingRouter);
router.use(roleRouter);
router.use(noteRouter);
router.use(trashRouter);
router.use(attachmentRouter);
router.use(commentRouter);
router.use(noteShareRouter);
router.use(notificationRouter);
router.use(sessionRouter);
router.use(auditLogRouter);

// Fallback cho mọi request /api/... không khớp route nào ở trên — trả JSON
// 404 đúng format chuẩn của sendError()/AppError (giống mọi lỗi khác trong
// API) thay vì để Express trả HTML lỗi mặc định.
router.use((req, res) => {
  sendError(
    res,
    AppError.notFound(`Không tìm thấy route ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND")
  );
});

export default router;