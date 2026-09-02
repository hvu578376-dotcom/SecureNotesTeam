import { attachmentService } from "../service/index.js";
import { asyncHandler } from "./Httphelper.js";

/**
 * CAttachments — Controller cho Module 4 (phần 2): Tệp đính kèm.
 * Chỉ lưu/đọc METADATA (fileName, fileUrl, fileType, fileSize,...) —
 * việc upload file thật lên storage ngoài (AWS S3, Cloudinary,...) KHÔNG
 * thuộc phạm vi này (xem ghi chú trong attachmentService.js). Client cần
 * tự upload file trước (qua 1 storage-service riêng, chưa có trong dự
 * án) để lấy fileUrl, rồi mới gọi addAttachment() bên dưới để ghi
 * metadata vào DB.
 *
 * Route dự kiến:
 *   POST   /api/notes/:noteId/attachments  -> addAttachment
 *   GET    /api/notes/:noteId/attachments  -> listAttachments
 *   DELETE /api/attachments/:attachmentId  -> deleteAttachment
 */

export const addAttachment = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { fileName, fileUrl, fileType, fileSize, encryptionIv } = req.body ?? {};
  const attachment = await attachmentService.addAttachment(req.params.noteId, userId, {
    fileName,
    fileUrl,
    fileType,
    fileSize,
    encryptionIv,
  });
  res.status(201).json({ success: true, data: attachment });
});

export const listAttachments = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const attachments = await attachmentService.listAttachments(req.params.noteId, userId);
  res.json({ success: true, data: attachments });
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  const userId = req.userId;
  await attachmentService.deleteAttachment(req.params.attachmentId, userId);
  res.json({ success: true, message: "Đã xoá tệp đính kèm." });
});

export default { addAttachment, listAttachments, deleteAttachment };