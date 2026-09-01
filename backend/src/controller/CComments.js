import { commentService } from "../service/index.js";
import { asyncHandler, getCurrentUserId } from "./Httphelper.js";

/**
 * CComments — Controller cho Module 5 & 6, phần bình luận trên ghi chú.
 *
 * Route dự kiến:
 *   POST   /api/notes/:noteId/comments  -> addComment
 *   GET    /api/notes/:noteId/comments  -> listComments
 *   DELETE /api/comments/:commentId     -> deleteComment
 */

/** Cần quyền tối thiểu "comment" trên ghi chú (owner/edit cũng bình luận được — xem commentService.addComment). */
export const addComment = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  const { content } = req.body ?? {};
  const comment = await commentService.addComment(req.params.noteId, userId, content);
  res.status(201).json({ success: true, data: comment });
});

export const listComments = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  const comments = await commentService.listComments(req.params.noteId, userId);
  res.json({ success: true, data: comments });
});

/** Tác giả bình luận HOẶC chủ sở hữu ghi chú được xoá (đã enforce trong commentService.deleteComment). */
export const deleteComment = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  await commentService.deleteComment(req.params.commentId, userId);
  res.json({ success: true, message: "Đã xoá bình luận." });
});

export default { addComment, listComments, deleteComment };