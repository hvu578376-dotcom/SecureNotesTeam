import { Note } from "../models/index.js";
import { AppError } from "./appError.js";
import { encryptNoteContent, decryptNoteContent } from "./cryptoService.js";
import { resolveAccess, hasAtLeast, listNoteIdsSharedWith } from "./noteShareService.js";

/**
 * noteService — Module 2 & 3: Notes & Private Notes.
 *
 * MÃ HOÁ LUÔN BẬT: comment gốc trong noteModel.js/sql.sql ghi content
 * "Bắt buộc mã hóa (VD AES-256-GCM) trước khi lưu" — nên createNote() và
 * updateNote() ở đây LUÔN mã hoá, không có tuỳ chọn tắt. isEncrypted vì
 * vậy cũng luôn được set true khi tạo qua service này.
 *
 * GIỚI HẠN CẦN BIẾT (is_private): notes.is_private hiện chỉ là 1 cờ
 * BOOLEAN đơn thuần, không có cột nào lưu "mật khẩu cấp 2" như comment
 * trong sql.sql mô tả ("cần mật khẩu cấp 2 để mở"). Vì sql.sql không
 * định nghĩa cột đó (VD private_password_hash), service này CHƯA thể
 * enforce việc khoá bằng mật khẩu riêng — setPrivate() chỉ lưu cờ để FE
 * hiển thị khác đi. Nếu cần khoá thật, sẽ phải bổ sung cột vào sql.sql
 * trước rồi mới thêm logic tương ứng ở đây.
 *
 * Việc trả về nội dung đã giải mã (plaintext) cho FE là đúng chủ đích —
 * "mã hoá" ở đây bảo vệ dữ liệu NẰM YÊN trong DB (encryption at rest),
 * không phải che nội dung khỏi chính chủ sở hữu/người được chia sẻ.
 */

/** Chuyển 1 instance Note (đã mã hoá trong DB) thành plain object với content đã giải mã, sẵn sàng trả cho FE. */
function decorateWithPlainContent(noteInstance) {
  const plain = noteInstance.toJSON();
  plain.content = decryptNoteContent(plain.content, plain.encryptionIv);
  return plain;
}

/** Lấy note theo id, loại trừ note đang trong thùng rác (dùng trashService để thao tác note đã trashed). Ném 404 nếu không có. */
async function getActiveNoteOrThrow(noteId) {
  const note = await Note.findByPk(noteId);
  if (!note || note.isTrashed) {
    throw AppError.notFound("Không tìm thấy ghi chú.", "NOTE_NOT_FOUND");
  }
  return note;
}

/** Note "thô" (chưa giải mã, không kiểm tra quyền) — dùng nội bộ cho attachmentService/commentService, các service đó tự lo phần kiểm tra quyền riêng. */
export async function getRawNoteOrThrow(noteId) {
  return getActiveNoteOrThrow(noteId);
}

export { resolveAccess as getAccessLevel, hasAtLeast };

export async function createNote(userId, { title, content, isPrivate = false, color = null }) {
  if (!title || !title.trim()) {
    throw AppError.badRequest("Tiêu đề ghi chú không được để trống.", "NOTE_TITLE_REQUIRED");
  }
  const { content: encryptedContent, iv } = encryptNoteContent(content ?? "");
  const note = await Note.create({
    userId,
    title: title.trim(),
    content: encryptedContent,
    encryptionIv: iv,
    isEncrypted: true,
    isPrivate: Boolean(isPrivate),
    color,
  });
  return decorateWithPlainContent(note);
}

export async function getNoteById(noteId, requestingUserId) {
  const note = await getActiveNoteOrThrow(noteId);
  const access = await resolveAccess(note, requestingUserId);
  if (!hasAtLeast(access, "view")) {
    throw AppError.forbidden("Bạn không có quyền xem ghi chú này.", "NOTE_ACCESS_DENIED");
  }
  return decorateWithPlainContent(note);
}

/** Ghi chú do chính userId sở hữu (không gồm ghi chú được người khác share cho họ — xem listSharedWithMe). */
export async function listMyNotes(userId, { includeTrashed = false } = {}) {
  const notes = await Note.findAll({
    where: includeTrashed ? { userId } : { userId, isTrashed: false },
    order: [["updatedAt", "DESC"]],
  });
  return notes.map(decorateWithPlainContent);
}

/** Ghi chú người khác đã chia sẻ CHO userId (qua note_shares). */
export async function listSharedWithMe(userId) {
  const noteIds = await listNoteIdsSharedWith(userId);
  if (noteIds.length === 0) return [];
  const notes = await Note.findAll({ where: { id: noteIds, isTrashed: false } });
  return notes.map(decorateWithPlainContent);
}

export async function updateNote(noteId, requestingUserId, { title, content, color } = {}) {
  const note = await getActiveNoteOrThrow(noteId);
  const access = await resolveAccess(note, requestingUserId);
  if (!hasAtLeast(access, "edit")) {
    throw AppError.forbidden("Bạn không có quyền chỉnh sửa ghi chú này.", "NOTE_ACCESS_DENIED");
  }
  if (title !== undefined) {
    if (!title.trim()) throw AppError.badRequest("Tiêu đề ghi chú không được để trống.", "NOTE_TITLE_REQUIRED");
    note.title = title.trim();
  }
  if (content !== undefined) {
    const { content: encryptedContent, iv } = encryptNoteContent(content);
    note.content = encryptedContent;
    note.encryptionIv = iv;
  }
  if (color !== undefined) note.color = color;
  await note.save();
  return decorateWithPlainContent(note);
}

/** Chỉ chủ sở hữu được đổi is_private — đây là thuộc tính riêng tư gắn liền với chủ ghi chú, người được share không nên chỉnh được. */
export async function setPrivate(noteId, requestingUserId, isPrivate) {
  const note = await getActiveNoteOrThrow(noteId);
  if (note.userId !== requestingUserId) {
    throw AppError.forbidden("Chỉ chủ sở hữu mới được đổi trạng thái riêng tư của ghi chú.", "NOTE_ACCESS_DENIED");
  }
  note.isPrivate = Boolean(isPrivate);
  await note.save();
  return decorateWithPlainContent(note);
}

export default {
  createNote,
  getNoteById,
  listMyNotes,
  listSharedWithMe,
  updateNote,
  setPrivate,
  getRawNoteOrThrow,
  getAccessLevel: resolveAccess,
  hasAtLeast,
};
