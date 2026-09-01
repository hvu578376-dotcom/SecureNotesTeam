import express from "express";
import { AppError } from "../service/index.js";
import { sendError } from "../controller/Httphelper.js";

import authRouter from "./Authrouter.js";
import userRouter from "./Userrouter.js";
import userSettingRouter from "./UserSettingRouter.js";
import roleRouter from "./RoleRouter.js";
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