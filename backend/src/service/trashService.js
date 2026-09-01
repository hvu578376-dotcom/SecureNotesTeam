import { Note, Trash } from "../models/index.js";
import { AppError } from "./appError.js";
import * as auditLogService from "./auditLogService.js";
import { decryptNoteContent } from "./cryptoService.js";

/**
 * trashService — Module 4 (phần 1): Thùng rác.
 * trashModel.js (export mặc định là object `Trash`) chỉ là các thao tác
 * UPDATE/SELECT thô trên bảng notes, KHÔNG tự kiểm tra quyền sở hữu. Lớp
 * service này thêm phần kiểm tra đó trước khi gọi xuống Trash.* — tách
 * biệt "ai được phép làm" (service) khỏi "làm như thế nào" (model).
 */

async function getOwnedNote(noteId, userId) {
  const note = await Note.findByPk(noteId);
  if (!note) throw AppError.notFound("Không tìm thấy ghi chú.", "NOTE_NOT_FOUND");
  if (note.userId !== userId) {
    throw AppError.forbidden("Bạn không phải chủ sở hữu ghi chú này.", "NOTE_ACCESS_DENIED");
  }
  return note;
}

export async function moveToTrash(noteId, userId) {
  const note = await getOwnedNote(noteId, userId);
  if (note.isTrashed) {
    throw AppError.conflict("Ghi chú này đã ở trong thùng rác rồi.", "NOTE_ALREADY_TRASHED");
  }
  await Trash.moveToTrash(noteId);
  return { id: noteId, isTrashed: true };
}

export async function restoreFromTrash(noteId, userId) {
  const note = await getOwnedNote(noteId, userId);
  if (!note.isTrashed) {
    throw AppError.conflict("Ghi chú này không ở trong thùng rác.", "NOTE_NOT_TRASHED");
  }
  await Trash.restoreFromTrash(noteId);
  return { id: noteId, isTrashed: false };
}

/** Giải mã content trước khi trả về, giống hành vi của noteService — tránh FE nhận phải chuỗi hex đã mã hoá. */
export async function listMyTrash(userId) {
  const notes = await Trash.listTrashed(userId);
  return notes.map((note) => {
    const plain = note.toJSON();
    plain.content = decryptNoteContent(plain.content, plain.encryptionIv);
    return plain;
  });
}

/**
 * Xoá vĩnh viễn 1 note ĐANG ở trong thùng rác — tương ứng nút "Xoá vĩnh
 * viễn" trong UI. Nhờ ON DELETE CASCADE khai báo sẵn trong sql.sql,
 * attachments/note_shares/comments liên quan tới note này cũng tự động
 * bị xoá theo, không cần service này tự dọn từng bảng.
 */
export async function permanentlyDelete(noteId, userId) {
  const note = await getOwnedNote(noteId, userId);
  if (!note.isTrashed) {
    throw AppError.badRequest("Chỉ có thể xoá vĩnh viễn ghi chú đang ở trong thùng rác.", "NOTE_NOT_TRASHED");
  }
  await note.destroy();
}

/**
 * Dọn thùng rác tự động sau 30 ngày — đúng mô tả cột deleted_at trong
 * sql.sql. Hàm này dành cho 1 cronjob gọi định kỳ (VD node-cron ở tầng
 * server.js sau này), KHÔNG gắn với request/user cụ thể nên không kiểm
 * tra quyền sở hữu — nó xử lý toàn hệ thống theo đúng thiết kế đã ghi
 * trong comment gốc của cột deleted_at.
 */
export async function purgeExpiredTrash() {
  const purgedCount = await Trash.purgeExpired();
  if (purgedCount > 0) {
    await auditLogService.logAction({ userId: null, action: "trash_auto_purge" });
  }
  return purgedCount;
}

export default { moveToTrash, restoreFromTrash, listMyTrash, permanentlyDelete, purgeExpiredTrash };
