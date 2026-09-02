import { noteService } from "../service/index.js";
import { asyncHandler } from "./Httphelper.js";

/**
 * CNotes — Controller cho Module 2 & 3 (Notes & Private Notes).
 * Xoá / khôi phục ghi chú (thùng rác) nằm ở CTrash.js — noteService
 * KHÔNG có hàm xoá (xem noteService.js, phần thùng rác do trashService lo).
 *
 * Route dự kiến:
 *   POST   /api/notes                  -> createNote
 *   GET    /api/notes                  -> listMyNotes         (?includeTrashed=true)
 *   GET    /api/notes/shared-with-me   -> listSharedWithMe
 *   GET    /api/notes/:noteId          -> getNote
 *   PATCH  /api/notes/:noteId          -> updateNote
 *   PATCH  /api/notes/:noteId/private  -> setPrivate
 *
 * Mọi quyền xem/sửa (owner/share) đã được kiểm tra sẵn trong noteService
 * (dựa trên noteShareService.resolveAccess) — controller không tự kiểm
 * tra lại quyền, chỉ truyền requestingUserId xuống cho service quyết định.
 */

export const createNote = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { title, content, isPrivate, color } = req.body ?? {};
  const note = await noteService.createNote(userId, { title, content, isPrivate, color });
  res.status(201).json({ success: true, data: note });
});

export const listMyNotes = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const includeTrashed = req.query.includeTrashed === "true";
  const notes = await noteService.listMyNotes(userId, { includeTrashed });
  res.json({ success: true, data: notes });
});

/** Ghi chú người KHÁC đã chia sẻ cho user hiện tại (qua note_shares) — khác với listMyNotes (ghi chú do chính mình sở hữu). */
export const listSharedWithMe = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const notes = await noteService.listSharedWithMe(userId);
  res.json({ success: true, data: notes });
});

export const getNote = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const note = await noteService.getNoteById(req.params.noteId, userId);
  res.json({ success: true, data: note });
});

export const updateNote = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { title, content, color } = req.body ?? {};
  const note = await noteService.updateNote(req.params.noteId, userId, { title, content, color });
  res.json({ success: true, data: note });
});

/** Chỉ chủ sở hữu note mới đổi được cờ is_private (đã enforce trong noteService.setPrivate). */
export const setPrivate = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { isPrivate } = req.body ?? {};
  const note = await noteService.setPrivate(req.params.noteId, userId, isPrivate);
  res.json({ success: true, data: note });
});

export default { createNote, listMyNotes, listSharedWithMe, getNote, updateNote, setPrivate };