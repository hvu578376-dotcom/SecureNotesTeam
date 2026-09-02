import { trashService } from "../service/index.js";
import { asyncHandler } from "./Httphelper.js";

/**
 * CTrash — Controller cho Module 4 (phần 1): Thùng rác.
 * Thùng rác không có bảng riêng — vẫn là bảng notes với 2 cột is_trashed/
 * deleted_at (xem trashModel.js / trashService.js / sql.sql).
 *
 * Route dự kiến:
 *   GET    /api/trash                  -> listMyTrash
 *   POST   /api/notes/:noteId/trash    -> moveToTrash
 *   POST   /api/notes/:noteId/restore  -> restoreFromTrash
 *   DELETE /api/trash/:noteId          -> permanentlyDelete
 *   POST   /api/trash/purge-expired    -> purgeExpiredTrash   (quyền manage_users — xem ghi chú bên dưới)
 */

export const listMyTrash = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const notes = await trashService.listMyTrash(userId);
  res.json({ success: true, data: notes });
});

export const moveToTrash = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const result = await trashService.moveToTrash(req.params.noteId, userId);
  res.json({ success: true, data: result });
});

export const restoreFromTrash = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const result = await trashService.restoreFromTrash(req.params.noteId, userId);
  res.json({ success: true, data: result });
});

export const permanentlyDelete = asyncHandler(async (req, res) => {
  const userId = req.userId;
  await trashService.permanentlyDelete(req.params.noteId, userId);
  res.json({ success: true, message: "Đã xoá vĩnh viễn ghi chú." });
});

/**
 * Dọn thùng rác quá hạn 30 ngày trên TOÀN hệ thống. Theo đúng thiết kế
 * trong trashService.js, việc này nên chạy bằng cronjob (VD node-cron ở
 * server.js) chứ không phải người dùng bấm nút — nhưng vẫn để 1 endpoint
 * ở đây (giới hạn quyền manage_users) để có thể kích hoạt thủ công khi
 * cần, VD lúc chưa kịp cấu hình cronjob.
 */
export const purgeExpiredTrash = asyncHandler(async (req, res) => {
  const purgedCount = await trashService.purgeExpiredTrash();
  res.json({ success: true, data: { purgedCount } });
});

export default { listMyTrash, moveToTrash, restoreFromTrash, permanentlyDelete, purgeExpiredTrash };