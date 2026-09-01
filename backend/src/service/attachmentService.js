import { Attachment } from "../models/index.js";
import { AppError } from "./appError.js";
import { getRawNoteOrThrow, getAccessLevel, hasAtLeast } from "./noteService.js";

/**
 * attachmentService — Module 4 (phần 2): Tệp đính kèm.
 *
 * LƯU Ý PHẠM VI: bảng attachments chỉ lưu METADATA (file_name, file_url,
 * file_type, file_size, encryption_iv) — sql.sql ghi rõ file_url là
 * "Đường dẫn lưu trữ (AWS S3, Cloudinary,...)". Nghĩa là việc tải file
 * thật lên storage ngoài KHÔNG thuộc service này (và không thể làm ở
 * đây vì môi trường build hiện không có SDK S3/Cloudinary lẫn kết nối
 * mạng). addAttachment() bên dưới giả định file ĐÃ được upload xong ở
 * đâu đó (tầng Controller sẽ gọi 1 storage-service riêng để lấy fileUrl
 * trước, rồi mới gọi addAttachment() để ghi metadata vào DB).
 */

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB — giới hạn mặc định hợp lý, chỉnh lại tuỳ hạ tầng lưu trữ thật khi tích hợp

export async function addAttachment(noteId, requestingUserId, { fileName, fileUrl, fileType, fileSize, encryptionIv = null }) {
  if (!fileName || !fileUrl || !fileType || !Number.isFinite(fileSize)) {
    throw AppError.badRequest("Thiếu thông tin file (fileName, fileUrl, fileType, fileSize).", "ATTACHMENT_INVALID");
  }
  if (fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
    throw AppError.badRequest(
      `Dung lượng file phải lớn hơn 0 và không vượt quá ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
      "ATTACHMENT_TOO_LARGE"
    );
  }

  const note = await getRawNoteOrThrow(noteId);
  const access = await getAccessLevel(note, requestingUserId);
  if (!hasAtLeast(access, "edit")) {
    throw AppError.forbidden("Bạn không có quyền thêm tệp đính kèm vào ghi chú này.", "NOTE_ACCESS_DENIED");
  }

  return Attachment.create({ noteId, fileName, fileUrl, fileType, fileSize, encryptionIv });
}

export async function listAttachments(noteId, requestingUserId) {
  const note = await getRawNoteOrThrow(noteId);
  const access = await getAccessLevel(note, requestingUserId);
  if (!hasAtLeast(access, "view")) {
    throw AppError.forbidden("Bạn không có quyền xem tệp đính kèm của ghi chú này.", "NOTE_ACCESS_DENIED");
  }
  return Attachment.findAll({ where: { noteId } });
}

export async function deleteAttachment(attachmentId, requestingUserId) {
  const attachment = await Attachment.findByPk(attachmentId);
  if (!attachment) throw AppError.notFound("Không tìm thấy tệp đính kèm.", "ATTACHMENT_NOT_FOUND");

  const note = await getRawNoteOrThrow(attachment.noteId);
  const access = await getAccessLevel(note, requestingUserId);
  if (!hasAtLeast(access, "edit")) {
    throw AppError.forbidden("Bạn không có quyền xoá tệp đính kèm này.", "NOTE_ACCESS_DENIED");
  }

  await attachment.destroy();
  // Chỉ xoá bản ghi metadata trong DB. Nếu fileUrl trỏ tới storage ngoài (S3/Cloudinary,...),
  // tầng Controller/Storage-service cần tự gọi thêm API xoá file thật bên đó.
}

export default { addAttachment, listAttachments, deleteAttachment };
