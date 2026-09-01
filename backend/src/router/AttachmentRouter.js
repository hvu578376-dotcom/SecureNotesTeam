import express from "express";
import attachmentController from "../controller/CAttachments.js";

/**
 * attachmentRouter — Module 4 (phần 2): Tệp đính kèm.
 * Ánh xạ theo docblock của CAttachments.js. Chỉ lưu/đọc METADATA — client
 * tự upload file thật lên storage ngoài trước để lấy fileUrl (xem ghi chú
 * trong CAttachments.js / attachmentService.js).
 */
const router = express.Router();

router.post("/notes/:noteId/attachments", attachmentController.addAttachment);
router.get("/notes/:noteId/attachments", attachmentController.listAttachments);
router.delete("/attachments/:attachmentId", attachmentController.deleteAttachment);

export default router;