import { Note, NoteShare } from "../models/index.js";
import { AppError } from "./appError.js";
import * as userService from "./userService.js";
import * as notificationService from "./notificationService.js";

/**
 * noteShareService — Module 5 & 6: Chia sẻ ghi chú (note_shares).
 *
 * Đây cũng là nơi định nghĩa resolveAccess()/hasAtLeast() — 2 hàm phân
 * quyền DÙNG CHUNG cho noteService, attachmentService, commentService.
 * Đặt ở đây (thay vì noteService) để tránh phụ thuộc vòng: noteService
 * cần biết user có được SHARE hay không, nhưng noteShareService không
 * cần biết gì từ noteService (chỉ cần model Note để kiểm tra chủ sở hữu).
 *
 * Lưu ý: bảng note_shares trong sql.sql KHÔNG có UNIQUE KEY trên cặp
 * (note_id, shared_with) — về lý thuyết DB vẫn cho phép 2 dòng share
 * trùng nhau cho cùng 1 note+user. shareNote() bên dưới tự chống trùng
 * ở tầng ứng dụng bằng findOrCreate, nhưng nếu muốn chặn tuyệt đối ở
 * tầng DB, nên cân nhắc thêm UNIQUE KEY (note_id, shared_with) vào
 * sql.sql (không tự ý thêm ở đây vì ngoài phạm vi được yêu cầu).
 */

export const ACCESS_RANK = { view: 1, comment: 2, edit: 3, owner: 4 };
const VALID_LEVELS = ["view", "comment", "edit"];

/** So sánh mức quyền: level có >= required không (owner > edit > comment > view). */
export function hasAtLeast(level, required) {
  if (!level) return false;
  return ACCESS_RANK[level] >= ACCESS_RANK[required];
}

async function getOwnedNote(noteId, ownerId) {
  const note = await Note.findByPk(noteId);
  if (!note) throw AppError.notFound("Không tìm thấy ghi chú.", "NOTE_NOT_FOUND");
  if (note.userId !== ownerId) {
    throw AppError.forbidden("Chỉ chủ sở hữu mới được quản lý chia sẻ của ghi chú này.", "NOTE_ACCESS_DENIED");
  }
  return note;
}

/** Mức quyền của userId trên noteId THEO BẢNG note_shares (không tính trường hợp là chủ sở hữu). */
export async function getShareLevel(noteId, userId) {
  const share = await NoteShare.findOne({ where: { noteId, sharedWith: userId } });
  return share ? share.permissionLevel : null;
}

/** Mức quyền thực tế của userId trên 1 note (đã fetch sẵn): 'owner' | 'edit' | 'comment' | 'view' | null. */
export async function resolveAccess(note, userId) {
  if (!note || !userId) return null;
  if (note.userId === userId) return "owner";
  return getShareLevel(note.id, userId);
}

export async function shareNote(noteId, ownerId, { sharedWithEmail, permissionLevel = "view" }) {
  if (!VALID_LEVELS.includes(permissionLevel)) {
    throw AppError.badRequest(`permissionLevel phải là 1 trong: ${VALID_LEVELS.join(", ")}.`, "INVALID_PERMISSION_LEVEL");
  }
  const note = await getOwnedNote(noteId, ownerId);

  const targetUser = await userService.getUserByEmail(sharedWithEmail);
  if (!targetUser) throw AppError.notFound("Không tìm thấy người dùng với email này.", "USER_NOT_FOUND");
  if (targetUser.id === ownerId) {
    throw AppError.badRequest("Không thể tự chia sẻ ghi chú cho chính mình.", "CANNOT_SHARE_WITH_SELF");
  }

  const [share, created] = await NoteShare.findOrCreate({
    where: { noteId, sharedWith: targetUser.id },
    defaults: { noteId, sharedBy: ownerId, sharedWith: targetUser.id, permissionLevel },
  });
  if (!created) {
    share.permissionLevel = permissionLevel; // đã từng share -> coi thao tác này là cập nhật quyền
    await share.save();
  }

  await notificationService.createNotification({
    userId: targetUser.id,
    actorId: ownerId,
    type: "note_shared",
    message: `"${note.title}" đã được chia sẻ với bạn (quyền: ${permissionLevel}).`,
  });

  return share;
}

/** Chỉ chủ sở hữu mới xem được đầy đủ danh sách ai đang có quyền truy cập note của mình. */
export async function listSharesForNote(noteId, requestingUserId) {
  await getOwnedNote(noteId, requestingUserId);
  return NoteShare.findAll({ where: { noteId }, order: [["createdAt", "DESC"]] });
}

/** Danh sách noteId đã được share cho userId — noteService dùng để dựng "Ghi chú được chia sẻ với tôi". */
export async function listNoteIdsSharedWith(userId) {
  const shares = await NoteShare.findAll({ where: { sharedWith: userId }, attributes: ["noteId"] });
  return shares.map((s) => s.noteId);
}

export async function updateSharePermission(shareId, ownerId, newLevel) {
  if (!VALID_LEVELS.includes(newLevel)) {
    throw AppError.badRequest(`permissionLevel phải là 1 trong: ${VALID_LEVELS.join(", ")}.`, "INVALID_PERMISSION_LEVEL");
  }
  const share = await NoteShare.findByPk(shareId);
  if (!share) throw AppError.notFound("Không tìm thấy lượt chia sẻ này.", "SHARE_NOT_FOUND");
  await getOwnedNote(share.noteId, ownerId);
  share.permissionLevel = newLevel;
  await share.save();
  return share;
}

export async function revokeShare(shareId, ownerId) {
  const share = await NoteShare.findByPk(shareId);
  if (!share) throw AppError.notFound("Không tìm thấy lượt chia sẻ này.", "SHARE_NOT_FOUND");
  await getOwnedNote(share.noteId, ownerId);
  await share.destroy();
}

export default {
  ACCESS_RANK,
  hasAtLeast,
  getShareLevel,
  resolveAccess,
  shareNote,
  listSharesForNote,
  listNoteIdsSharedWith,
  updateSharePermission,
  revokeShare,
};
