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
router.get("/notes/:noteId/attachments", requireAuth, attachmentController.listAttachments);
router.delete("/attachments/:attachmentId", requireAuth, attachmentController.deleteAttachment);

export default router;