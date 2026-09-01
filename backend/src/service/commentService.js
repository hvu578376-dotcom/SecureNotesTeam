import { Comment } from "../models/index.js";
import { AppError } from "./appError.js";
import { getRawNoteOrThrow, getAccessLevel, hasAtLeast } from "./noteService.js";
import * as notificationService from "./notificationService.js";

/**
 * commentService — Module 5 & 6: Bình luận trên ghi chú.
 * Cần quyền tối thiểu "comment" (owner/edit cũng bình luận được vì đều
 * xếp hạng cao hơn "comment" trong ACCESS_RANK của noteShareService).
 */

export async function addComment(noteId, requestingUserId, content) {
  if (!content || !content.trim()) {
    throw AppError.badRequest("Nội dung bình luận không được để trống.", "COMMENT_CONTENT_REQUIRED");
  }

  const note = await getRawNoteOrThrow(noteId);
  const access = await getAccessLevel(note, requestingUserId);
  if (!hasAtLeast(access, "comment")) {
    throw AppError.forbidden("Bạn không có quyền bình luận trên ghi chú này.", "NOTE_ACCESS_DENIED");
  }

  const comment = await Comment.create({ noteId, userId: requestingUserId, content: content.trim() });

  if (note.userId !== requestingUserId) {
    // Không thông báo khi chủ note tự bình luận trên note của chính mình.
    await notificationService.createNotification({
      userId: note.userId,
      actorId: requestingUserId,
      type: "new_comment",
      message: `Có bình luận mới trên ghi chú "${note.title}" của bạn.`,
    });
  }

  return comment;
}

export async function listComments(noteId, requestingUserId) {
  const note = await getRawNoteOrThrow(noteId);
  const access = await getAccessLevel(note, requestingUserId);
  if (!hasAtLeast(access, "view")) {
    throw AppError.forbidden("Bạn không có quyền xem bình luận của ghi chú này.", "NOTE_ACCESS_DENIED");
  }
  return Comment.findAll({ where: { noteId }, order: [["createdAt", "ASC"]] });
}

/** Tác giả bình luận HOẶC chủ sở hữu ghi chú được xoá (giống Google Docs: chủ tài liệu dọn được mọi bình luận). */
export async function deleteComment(commentId, requestingUserId) {
  const comment = await Comment.findByPk(commentId);
  if (!comment) throw AppError.notFound("Không tìm thấy bình luận.", "COMMENT_NOT_FOUND");

  const note = await getRawNoteOrThrow(comment.noteId);
  const isAuthor = comment.userId === requestingUserId;
  const isNoteOwner = note.userId === requestingUserId;
  if (!isAuthor && !isNoteOwner) {
    throw AppError.forbidden("Bạn không có quyền xoá bình luận này.", "COMMENT_ACCESS_DENIED");
  }

  await comment.destroy();
}

export default { addComment, listComments, deleteComment };
