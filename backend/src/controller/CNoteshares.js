import { noteShareService } from "../service/index.js";
import { asyncHandler, getCurrentUserId } from "./Httphelper.js";

/**
 * CNoteshares — Controller cho Module 5 & 6, phần chia sẻ ghi chú (note_shares).
 *
 * Route dự kiến:
 *   POST   /api/notes/:noteId/shares  -> shareNote
 *   GET    /api/notes/:noteId/shares  -> listSharesForNote
 *   PATCH  /api/shares/:shareId       -> updateSharePermission
 *   DELETE /api/shares/:shareId       -> revokeShare
 */

/** Chia sẻ ghi chú cho 1 user khác qua email — tự tạo thông báo cho người được chia sẻ (xem noteShareService.shareNote). */
export const shareNote = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  const { sharedWithEmail, permissionLevel } = req.body ?? {};
  const share = await noteShareService.shareNote(req.params.noteId, userId, { sharedWithEmail, permissionLevel });
  res.status(201).json({ success: true, data: share });
});

/** Chỉ chủ sở hữu ghi chú mới xem được đầy đủ danh sách người có quyền truy cập (đã enforce trong service). */
export const listSharesForNote = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  const shares = await noteShareService.listSharesForNote(req.params.noteId, userId);
  res.json({ success: true, data: shares });
});

export const updateSharePermission = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  const { permissionLevel } = req.body ?? {};
  const share = await noteShareService.updateSharePermission(req.params.shareId, userId, permissionLevel);
  res.json({ success: true, data: share });
});

export const revokeShare = asyncHandler(async (req, res) => {
  const userId = await getCurrentUserId(req);
  await noteShareService.revokeShare(req.params.shareId, userId);
  res.json({ success: true, message: "Đã huỷ chia sẻ." });
});

export default { shareNote, listSharesForNote, updateSharePermission, revokeShare };